"""
Builds the chronological event timeline attached to each incident.

Each event captures a wall-clock timestamp (for display) and the elapsed
time since the previous event (for the "duration" shown in the UI/PDF).
This is deliberately simple -- a list of dicts, JSON-serializable as-is --
so it can be stored directly in the `incidents.timeline` jsonb column
with no extra mapping layer.
"""
import time
from datetime import datetime, timezone


class TimelineBuilder:
    def __init__(self) -> None:
        self._events: list[dict] = []
        self._last_perf: float | None = None

    def event(self, stage: str, label: str, status: str = "complete") -> None:
        now_perf = time.perf_counter()
        now_wall = datetime.now(timezone.utc).isoformat()

        duration_ms = None
        if self._last_perf is not None:
            duration_ms = round((now_perf - self._last_perf) * 1000)

        self._events.append(
            {
                "stage": stage,
                "label": label,
                "status": status,
                "timestamp": now_wall,
                "duration_ms": duration_ms,
            }
        )
        self._last_perf = now_perf

    def to_list(self) -> list[dict]:
        return self._events
