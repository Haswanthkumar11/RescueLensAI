"""
Deterministic, explainable risk scoring.

This is the "own intelligence" layer that sits on top of the LLM's raw
perception. Gemini tells us WHAT it sees; this module decides HOW URGENT
that is, using fixed, auditable weights instead of asking the LLM to
grade its own homework. Judges / responders can see exactly why a score
was produced.
"""
from app.models.schemas import DetectionFlags, RiskResult

# Point weights per signal. Tune these based on domain expertise.
WEIGHTS = {
    "flood": 20,
    "fire": 25,
    "trapped": 30,
    "children": 20,
    "elderly": 15,
    "smoke": 15,
    "collapsed_building": 25,
    "injured": 20,
}

PRIORITY_BANDS = (
    (0, 30, "Low"),
    (31, 60, "Medium"),
    (61, 80, "High"),
    (81, 100, "Critical"),
)


def score_to_priority(score: int) -> str:
    for lo, hi, label in PRIORITY_BANDS:
        if lo <= score <= hi:
            return label
    return "Critical"  # anything above 100 before clamping


def calculate_risk(detections: DetectionFlags) -> RiskResult:
    contributing: dict[str, int] = {}

    for field, weight in WEIGHTS.items():
        value = getattr(detections, field)
        if isinstance(value, bool) and value:
            contributing[field] = weight

    # People present at all is a mild baseline bump, independent of the
    # weighted boolean flags above.
    if detections.people_detected > 0:
        contributing["people_present"] = min(10, detections.people_detected * 2)

    raw_score = sum(contributing.values())
    clamped_score = max(0, min(100, raw_score))
    priority = score_to_priority(clamped_score)

    return RiskResult(
        score=clamped_score,
        priority=priority,
        contributing_factors=contributing,
    )


def recommend_team(detections: DetectionFlags, incident_type: str) -> str:
    """Simple deterministic routing rule, separate from Gemini's own
    'recommended_response' guess -- lets us cross-check the two."""
    if detections.trapped or detections.collapsed_building:
        return "Search & Rescue (USAR)"
    if detections.fire or detections.smoke:
        return "Fire Brigade"
    if detections.flood:
        return "Flood Rescue Team"
    if detections.injured:
        return "Medical Emergency (EMS)"
    if incident_type == "vehicle_accident":
        return "Traffic Police + EMS"
    return "General Response Unit"
