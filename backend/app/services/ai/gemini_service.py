"""
Wraps the Gemini multimodal call and validates the response against the
GeminiAnalysis schema. This is the ONLY place in the codebase that talks
to the AI provider, so swapping models later means editing one file
(or just the GEMINI_MODEL env var).

SDK note: this uses `google-genai` (the current, supported SDK). The
older `google-generativeai` package this file used to import is fully
deprecated / unsupported by Google as of Nov 30, 2025 -- see
https://ai.google.dev/gemini-api/docs/libraries -- so it was migrated
off rather than patched.
"""
import json
import logging
import re

from google import genai
from google.genai import errors as genai_errors
from google.genai import types
from pydantic import ValidationError

from app.database.db import get_settings
from app.models.schemas import GeminiAnalysis
from app.services.ai.prompt import SYSTEM_INSTRUCTION, ANALYSIS_PROMPT

logger = logging.getLogger(__name__)
_JSON_FENCE_RE = re.compile(r"^```(?:json)?|```$", re.MULTILINE)


def _get_client() -> genai.Client:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in the environment.")
    return genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(
            # Google's servers occasionally return transient 503/UNAVAILABLE
            # ("model is overloaded") even with a valid key -- retry with
            # backoff instead of failing the whole /analyze request on the
            # first hiccup. This is the SDK's built-in retry, not a custom loop.
            retry_options=types.HttpRetryOptions(
                attempts=4,
                initial_delay=1.0,
                max_delay=20.0,
                http_status_codes=[429, 500, 502, 503, 504],
            )
        ),
    )


def _extract_json_object(raw_text: str) -> str:
    """Helper to extract the first valid looking JSON object substring."""
    start = raw_text.find("{")
    end = raw_text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return raw_text[start:end + 1]
    return raw_text


def _parse_json(raw_text: str) -> dict:
    """Production-grade JSON extractor and parser. Ensures no uncaught raw JSON exceptions."""
    # 1. Clean markdown fences
    cleaned = _JSON_FENCE_RE.sub("", raw_text).strip()

    # 2. Try direct load
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # 3. Try object extraction
    extracted = _extract_json_object(cleaned)
    try:
        return json.loads(extracted)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse Gemini response as JSON. Raw response: %s", raw_text)
        raise ValueError(f"Output was not valid JSON: {exc}") from exc


async def analyze_image(image_bytes: bytes, mime_type: str = "image/jpeg") -> GeminiAnalysis:
    """Send an image to Gemini and return a validated GeminiAnalysis.

    Retries once with a stricter prompt if parsing or validation fails.
    """
    settings = get_settings()
    client = _get_client()

    prompt = ANALYSIS_PROMPT
    system_instruction = SYSTEM_INSTRUCTION

    last_error = None

    for attempt in range(2):
        logger.info("Querying Gemini API (Attempt %d/2)...", attempt + 1)
        try:
            response = await client.aio.models.generate_content(
                model=settings.gemini_model,
                contents=[
                    prompt,
                    types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                ],
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                ),
            )
        except genai_errors.ServerError as exc:
            last_error = RuntimeError(
                "Gemini is temporarily overloaded on Google's side. Please try again shortly."
            )
            logger.warning("Gemini ServerError on attempt %d: %s", attempt + 1, exc)
            continue
        except genai_errors.ClientError as exc:
            code = getattr(exc, "code", None)
            if code == 429:
                last_error = RuntimeError("Gemini rate limit reached for this API key.")
            elif code in (401, 403):
                last_error = RuntimeError("Gemini rejected the request — invalid or missing API key.")
            else:
                last_error = RuntimeError(f"Gemini rejected the request: {exc}")
            logger.warning("Gemini ClientError on attempt %d: %s", attempt + 1, exc)
            continue
        except Exception as exc:
            last_error = RuntimeError(f"Connection to Gemini failed: {exc}")
            logger.warning("Gemini connection failure on attempt %d: %s", attempt + 1, exc)
            continue

        raw_text = response.text
        logger.info("Raw Gemini Response (Attempt %d/2): %s", attempt + 1, raw_text)

        if not raw_text:
            last_error = ValueError("Gemini returned an empty response.")
            continue

        try:
            # Step 1: Parse JSON safely
            parsed = _parse_json(raw_text)

            # Step 2: Validate against Pydantic schema
            return GeminiAnalysis(**parsed)

        except (ValueError, ValidationError) as exc:
            logger.warning("Attempt %d/2 parsing/validation failed: %s", attempt + 1, exc)
            last_error = exc

            # Prepare stricter prompt for retry
            prompt = (
                ANALYSIS_PROMPT +
                "\n\nSTRICT REQUIREMENT: The previous response failed to parse as valid JSON. "
                "You must return ONLY a single valid JSON object matching the schema exactly. "
                "Do NOT include any markdown code blocks (```json ... ```), no introductory greetings, and no explanatory text."
            )
            system_instruction = (
                SYSTEM_INSTRUCTION +
                " STRICT ACTION: Output raw JSON only. Do not wrap in markdown fences under any circumstances."
            )

    # If we get here, both attempts failed
    raise RuntimeError(
        f"AI analysis failed to yield structured results after 2 attempts. "
        f"Last validation error: {last_error}"
    )


