import logging

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.concurrency import run_in_threadpool

from app.models.permissions import Permission
from app.models.schemas import AnalyzeResponse
from app.services.ai.gemini_service import analyze_image
from app.services.auth import require_permission
from app.services.risk_engine import calculate_risk, recommend_team
from app.services.supabase_client import upload_image, save_incident
from app.services.timeline import TimelineBuilder
from app.services.validation import validate_image

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/analyze", tags=["analyze"])


@router.post("", response_model=AnalyzeResponse)
async def analyze_incident_image(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_permission(Permission.CAN_ANALYZE)),
):
    """
    Full pipeline, single request:
    image -> validate -> storage -> Gemini Vision -> risk engine -> DB -> response

    Every stage is timestamped into a TimelineBuilder so the frontend and
    PDF report can show a real, auditable processing timeline -- not a
    simulated one.
    """
    timeline = TimelineBuilder()

    contents = await file.read()
    timeline.event("uploaded", "Image Uploaded")

    validate_image(file.content_type, contents)
    timeline.event("validated", "Image Validated")

    # 1. Persist the raw image first so we always have a record, even if
    #    the AI step fails downstream.
    image_url, _storage_path = await run_in_threadpool(
        upload_image, contents, file.filename, file.content_type
    )
    timeline.event("stored", "Uploaded to Supabase Storage")

    # 2. Scene understanding.
    timeline.event("ai_started", "Gemini AI Analysis Started")
    try:
        analysis = await analyze_image(contents, file.content_type or "image/jpeg")
    except Exception as exc:
        logger.exception("Gemini analysis failed")
        raise HTTPException(502, f"AI analysis failed: {exc}") from exc
    timeline.event("ai_completed", "Gemini AI Analysis Completed")
    timeline.event("hazards_identified", "Hazards Identified")

    # 3. Explainable, deterministic risk scoring (not left to the LLM).
    risk = calculate_risk(analysis.detections)
    timeline.event("risk_generated", "Risk Score Generated")
    timeline.event("priority_assigned", f"Priority Assigned: {risk.priority}")

    team = recommend_team(analysis.detections, analysis.incident)
    timeline.event("team_recommended", f"Response Team Recommended: {team}")

    # 4. Persist the structured result, including the timeline itself.
    try:
        saved = await run_in_threadpool(
            save_incident, image_url, analysis, risk, team, timeline.to_list(), current_user["id"]
        )
    except Exception as exc:
        logger.exception("Failed to save incident to Supabase")
        raise HTTPException(
            500,
            "The AI analysis succeeded, but saving it to the database failed. "
            "This usually means a migration hasn't been run yet -- check that "
            "docs/migrations/001_add_incident_timeline.sql and "
            "docs/migrations/002_add_user_profiles.sql have both been applied "
            f"in Supabase. (underlying error: {exc})",
        ) from exc
    timeline.event("saved", "Incident Saved to Database")

    return AnalyzeResponse(
        incident_id=saved["id"],
        image_url=image_url,
        analysis=analysis,
        risk=risk,
        recommended_team=team,
        created_at=saved["created_at"],
        timeline=timeline.to_list(),
    )
