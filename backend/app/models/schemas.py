from typing import Optional
from pydantic import BaseModel, Field


class DetectionFlags(BaseModel):
    """Raw structured signals extracted from the image by Gemini Vision."""
    people_detected: int = 0
    children: bool = False
    elderly: bool = False
    injured: bool = False
    trapped: bool = False
    fire: bool = False
    flood: bool = False
    smoke: bool = False
    collapsed_building: bool = False
    vehicles: int = 0


class GeminiAnalysis(BaseModel):
    """Validated JSON contract returned by the Gemini Vision service."""
    incident: str
    severity: str
    detections: DetectionFlags
    recommended_response: str
    confidence: float = Field(ge=0, le=1)
    summary: str


class RiskResult(BaseModel):
    score: int = Field(ge=0, le=100)
    priority: str  # Low | Medium | High | Critical
    contributing_factors: dict[str, int]


class TimelineEvent(BaseModel):
    """One step in an incident's processing pipeline (upload -> ... -> saved)."""
    stage: str
    label: str
    status: str = "complete"
    timestamp: str
    duration_ms: Optional[int] = None


class AnalyzeResponse(BaseModel):
    incident_id: str
    image_url: str
    analysis: GeminiAnalysis
    risk: RiskResult
    recommended_team: str
    created_at: str
    timeline: list[TimelineEvent] = []


class IncidentSummary(BaseModel):
    id: str
    user_id: Optional[str] = None
    image_url: str
    incident_type: str
    severity: str
    priority: str
    score: int
    summary: str
    response_team: str
    confidence: float
    created_at: str
    timeline: list[TimelineEvent] = []
    contributing_factors: dict[str, int] = {}


class UploadResponse(BaseModel):
    image_url: str
    storage_path: str


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    organization: Optional[str] = None
    role: str = "viewer"
    profile_image: Optional[str] = None
    created_at: Optional[str] = None
    last_login: Optional[str] = None


class UserProfileUpdate(BaseModel):
    """Self-service profile edits. `role` is deliberately excluded --
    role changes go through the admin-only /profile/users/{id}/role route."""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    organization: Optional[str] = None
    profile_image: Optional[str] = None


class RoleUpdate(BaseModel):
    role: str
