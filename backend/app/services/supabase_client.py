"""
Thin data-access layer over Supabase Storage + Postgres tables
(`incidents`, `detections`). Keeps routers free of raw SQL/storage calls.
"""
import uuid
from datetime import datetime, timezone

from app.database.db import get_settings, get_supabase
from app.models.schemas import GeminiAnalysis, RiskResult

# DB column name -> DetectionFlags field name. The `detections` table
# predates DetectionFlags and uses `people`/`vehicles` for the count
# fields; normalizing here means every consumer (Result page, PDF)
# can rely on one consistent shape instead of branching per source.
_DETECTIONS_DB_TO_FLAGS = {
    "people": "people_detected",
    "vehicles": "vehicles",
    "children": "children",
    "elderly": "elderly",
    "injured": "injured",
    "trapped": "trapped",
    "fire": "fire",
    "flood": "flood",
    "smoke": "smoke",
    "collapsed_building": "collapsed_building",
}


def _normalize_detections_row(row: dict | None) -> dict | None:
    if not row:
        return None
    return {flags_key: row.get(db_key) for db_key, flags_key in _DETECTIONS_DB_TO_FLAGS.items()}


def upload_image(file_bytes: bytes, filename: str, content_type: str) -> tuple[str, str]:
    """Uploads an image to Supabase Storage and returns (public_url, storage_path)."""
    settings = get_settings()
    supabase = get_supabase()

    ext = filename.split(".")[-1] if "." in filename else "jpg"
    storage_path = f"{uuid.uuid4()}.{ext}"

    supabase.storage.from_(settings.supabase_bucket).upload(
        storage_path,
        file_bytes,
        {"content-type": content_type},
    )
    public_url = supabase.storage.from_(settings.supabase_bucket).get_public_url(storage_path)
    return public_url, storage_path


def save_incident(
    image_url: str,
    analysis: GeminiAnalysis,
    risk: RiskResult,
    recommended_team: str,
    timeline: list[dict] | None = None,
    user_id: str | None = None,
) -> dict:
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()

    incident_row = {
        "user_id": user_id,
        "image_url": image_url,
        "incident_type": analysis.incident,
        "severity": analysis.severity,
        "priority": risk.priority,
        "score": risk.score,
        "summary": analysis.summary,
        "response_team": recommended_team,
        "confidence": analysis.confidence,
        "created_at": now,
        "timeline": timeline or [],
        "contributing_factors": risk.contributing_factors,
    }
    incident_result = supabase.table("incidents").insert(incident_row).execute()
    incident_id = incident_result.data[0]["id"]

    detection_row = {
        "incident_id": incident_id,
        "people": analysis.detections.people_detected,
        "children": analysis.detections.children,
        "elderly": analysis.detections.elderly,
        "injured": analysis.detections.injured,
        "trapped": analysis.detections.trapped,
        "fire": analysis.detections.fire,
        "flood": analysis.detections.flood,
        "smoke": analysis.detections.smoke,
        "collapsed_building": analysis.detections.collapsed_building,
        "vehicles": analysis.detections.vehicles,
    }
    supabase.table("detections").insert(detection_row).execute()

    return {**incident_row, "id": incident_id}


def list_incidents(limit: int = 50, user_id: str | None = None) -> list[dict]:
    supabase = get_supabase()
    query = supabase.table("incidents").select("*")
    if user_id:
        query = query.eq("user_id", user_id)
    result = query.order("created_at", desc=True).limit(limit).execute()
    return result.data


def get_incident(incident_id: str) -> dict | None:
    """Fetch a single incident with its detections embedded, normalized to
    the same field names GeminiAnalysis.detections uses (so the Result page
    and PDF report can treat a freshly-analyzed incident and a
    fetched-from-history incident identically)."""
    supabase = get_supabase()
    result = (
        supabase.table("incidents")
        .select("*, detections(*)")
        .eq("id", incident_id)
        .execute()
    )
    if not result.data:
        return None

    incident = dict(result.data[0])
    raw_detections = incident.pop("detections", None)
    first_detection_row = raw_detections[0] if raw_detections else None
    incident["detections"] = _normalize_detections_row(first_detection_row)
    return incident


def delete_incident(incident_id: str) -> None:
    supabase = get_supabase()
    supabase.table("detections").delete().eq("incident_id", incident_id).execute()
    supabase.table("incidents").delete().eq("id", incident_id).execute()
