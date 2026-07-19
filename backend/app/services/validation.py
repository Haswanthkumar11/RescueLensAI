"""
Shared upload validation. Previously duplicated between the /upload and
/analyze routers (the latter didn't validate at all) -- centralized here
so both stay in sync and /analyze gets the same guardrails /upload had.
"""
from fastapi import HTTPException

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_SIZE_MB = 10


def validate_image(content_type: str | None, contents: bytes) -> None:
    """Raises HTTPException(400) if the upload fails basic sanity checks."""
    if not contents:
        raise HTTPException(400, "Empty file.")
    if content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, f"Unsupported file type: {content_type}")
    if len(contents) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File too large. Max {MAX_IMAGE_SIZE_MB}MB.")
