"""
Generates a multi-section, government-assessment-style incident PDF.

Rewritten from the original single-page canvas.drawString layout to use
reportlab's Platypus layer (SimpleDocTemplate + Table + Paragraph flowables)
so multi-section, table-based content can be composed declaratively instead
of by hand-tracking y-coordinates. The public contract is unchanged:
build_incident_pdf(incident: dict) -> bytes, so the /incident/{id}/report.pdf
route needed no changes.

`incident` is whatever app.services.supabase_client.get_incident() returns:
the incidents row plus a normalized `detections` dict and the persisted
`timeline` / `contributing_factors` jsonb columns. Everything rendered here
is real, previously-computed data -- nothing is fabricated at render time.
"""
import io

import httpx
import qrcode
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.database.db import get_settings

NAVY = colors.HexColor("#0B1120")
NAVY_LIGHT = colors.HexColor("#1E293B")
PAPER = colors.HexColor("#F8FAFC")
RED = colors.HexColor("#DC2626")
ORANGE = colors.HexColor("#F97316")
AMBER = colors.HexColor("#F59E0B")
GREEN = colors.HexColor("#16A34A")
MUTED = colors.HexColor("#64748B")

PRIORITY_COLORS = {"Critical": RED, "High": ORANGE, "Medium": AMBER, "Low": GREEN}

# Human-readable description of what each risk-engine signal means. These
# describe the SIGNAL, not a per-image confidence we don't actually have --
# we never fabricate a number the pipeline didn't produce.
HAZARD_DESCRIPTIONS = {
    "fire": "Visible flames or active fire in the scene",
    "flood": "Standing or rising water consistent with flooding",
    "trapped": "Person(s) appear trapped or unable to self-evacuate",
    "children": "Child(ren) present in the scene",
    "elderly": "Elderly person(s) present in the scene",
    "smoke": "Smoke visible, indicating possible fire or hazardous air",
    "collapsed_building": "Structural collapse or major structural damage",
    "injured": "Visible injury requiring medical attention",
}
# Order shown in the hazard table (highest risk-engine weight first).
HAZARD_ORDER = ["fire", "collapsed_building", "trapped", "smoke", "children", "injured", "flood", "elderly"]

_styles = getSampleStyleSheet()
_STYLE_H1 = ParagraphStyle("H1", parent=_styles["Heading1"], textColor=NAVY, fontSize=16, spaceAfter=6)
_STYLE_H2 = ParagraphStyle("H2", parent=_styles["Heading2"], textColor=NAVY, fontSize=12.5, spaceBefore=14, spaceAfter=6)
_STYLE_BODY = ParagraphStyle("Body", parent=_styles["BodyText"], fontSize=10, leading=14, textColor=NAVY)
_STYLE_MUTED = ParagraphStyle("Muted", parent=_styles["BodyText"], fontSize=8.5, textColor=MUTED)
_STYLE_COVER_TITLE = ParagraphStyle("CoverTitle", parent=_styles["Title"], fontSize=26, textColor=PAPER, alignment=TA_CENTER)
_STYLE_COVER_SUB = ParagraphStyle("CoverSub", parent=_styles["BodyText"], fontSize=12, textColor=PAPER, alignment=TA_CENTER, spaceAfter=4)


def _fetch_image_flowable(image_url: str, max_width_mm: float = 170, max_height_mm: float = 110):
    """Best-effort fetch + embed of the incident photo. Never raises --
    a slow/broken image URL should degrade the PDF, not break it."""
    try:
        resp = httpx.get(image_url, timeout=6.0, follow_redirects=True)
        resp.raise_for_status()
        img = Image(io.BytesIO(resp.content))
        img._restrictSize(max_width_mm * mm, max_height_mm * mm)
        img.hAlign = "CENTER"
        return img
    except Exception:
        return Paragraph("(Original image could not be embedded — view it online via the QR code.)", _STYLE_MUTED)


def _make_qr_flowable(url: str, size_mm: float = 28):
    qr_img = qrcode.make(url)
    buf = io.BytesIO()
    qr_img.save(buf, format="PNG")
    buf.seek(0)
    img = Image(buf, width=size_mm * mm, height=size_mm * mm)
    img.hAlign = "CENTER"
    return img


def _priority_color(priority: str):
    return PRIORITY_COLORS.get(priority, AMBER)


def _cover_flowables(incident: dict) -> list:
    priority = incident.get("priority", "N/A")
    story = [
        Spacer(1, 55 * mm),
        Paragraph("RescueLens AI", _STYLE_COVER_TITLE),
        Spacer(1, 4 * mm),
        Paragraph("Emergency Incident Assessment Report", _STYLE_COVER_SUB),
        Spacer(1, 14 * mm),
        Table(
            [
                ["Incident ID", str(incident.get("id", "N/A"))],
                ["Priority", priority],
                ["Risk Score", f"{incident.get('score', 0)} / 100"],
                ["Report Generated", incident.get("created_at", "N/A")],
            ],
            colWidths=[55 * mm, 90 * mm],
            style=TableStyle(
                [
                    ("TEXTCOLOR", (0, 0), (-1, -1), PAPER),
                    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10.5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LINEBELOW", (0, 0), (-1, -2), 0.4, NAVY_LIGHT),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ]
            ),
        ),
        Spacer(1, 10 * mm),
    ]
    return story


def _executive_summary_flowables(incident: dict) -> list:
    priority = incident.get("priority", "N/A")
    rows = [
        ["Incident Status", "Analyzed"],
        ["Priority", priority],
        ["Risk Score", f"{incident.get('score', 0)} / 100"],
        ["Overall AI Confidence", f"{round((incident.get('confidence') or 0) * 100)}%"],
        ["Estimated Severity", str(incident.get("severity", "N/A")).replace("_", " ").title()],
        ["Recommended Response Team", incident.get("response_team", "N/A")],
    ]
    table = Table(
        rows,
        colWidths=[55 * mm, 105 * mm],
        style=TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (-1, -1), NAVY),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("LINEBELOW", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
                ("TEXTCOLOR", (1, 1), (1, 1), _priority_color(priority)),
                ("FONTNAME", (1, 1), (1, 1), "Helvetica-Bold"),
            ]
        ),
    )
    return [Paragraph("Executive Summary", _STYLE_H2), table]


def _hazard_table_flowables(incident: dict) -> list:
    detections = incident.get("detections") or {}
    factors = incident.get("contributing_factors") or {}

    header = ["Hazard", "Detected", "Risk Contribution", "What this means"]
    rows = [header]
    for key in HAZARD_ORDER:
        detected = bool(detections.get(key))
        contribution = factors.get(key)
        contribution_text = f"+{contribution} pts" if contribution else "—"
        rows.append(
            [
                key.replace("_", " ").title(),
                "Yes" if detected else "No",
                contribution_text,
                Paragraph(HAZARD_DESCRIPTIONS.get(key, ""), _STYLE_MUTED),
            ]
        )

    people_count = detections.get("people_detected") or 0
    people_contribution = factors.get("people_present")
    rows.append(
        [
            "People Present",
            str(people_count),
            f"+{people_contribution} pts" if people_contribution else "—",
            Paragraph("Number of people visible in the scene.", _STYLE_MUTED),
        ]
    )

    table = Table(rows, colWidths=[32 * mm, 20 * mm, 28 * mm, 80 * mm], repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("TEXTCOLOR", (0, 0), (-1, 0), PAPER),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#E2E8F0")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]
    for row_idx, key in enumerate(HAZARD_ORDER, start=1):
        if detections.get(key):
            style.append(("TEXTCOLOR", (1, row_idx), (1, row_idx), RED))
            style.append(("FONTNAME", (1, row_idx), (1, row_idx), "Helvetica-Bold"))
    table.setStyle(TableStyle(style))
    return [Paragraph("AI Hazard Detection", _STYLE_H2), table]


def _risk_explanation_flowables(incident: dict) -> list:
    factors = incident.get("contributing_factors") or {}
    if not factors:
        body = Paragraph("No individual risk factors were recorded for this incident.", _STYLE_BODY)
        return [Paragraph("Risk Explanation", _STYLE_H2), body]

    ranked = sorted(factors.items(), key=lambda kv: kv[1], reverse=True)
    lines = []
    for key, points in ranked:
        label = "People present" if key == "people_present" else key.replace("_", " ").title()
        lines.append(f"&#10003; {label} — contributed <b>+{points}</b> points")
    body = Paragraph("<br/>".join(lines), _STYLE_BODY)
    total = Paragraph(
        f"<b>Total Risk Score: {incident.get('score', 0)} / 100 → {incident.get('priority', 'N/A')} priority</b>",
        _STYLE_BODY,
    )
    return [Paragraph("Risk Explanation", _STYLE_H2), body, Spacer(1, 3 * mm), total]


def _timeline_flowables(incident: dict) -> list:
    events = incident.get("timeline") or []
    if not events:
        return []

    rows = [["Stage", "Timestamp", "Duration"]]
    for ev in events:
        duration = ev.get("duration_ms")
        duration_text = f"{duration} ms" if duration is not None else "—"
        rows.append([ev.get("label", ev.get("stage", "")), ev.get("timestamp", ""), duration_text])

    table = Table(rows, colWidths=[75 * mm, 65 * mm, 25 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY_LIGHT),
                ("TEXTCOLOR", (0, 0), (-1, 0), PAPER),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
            ]
        )
    )
    return [Paragraph("Incident Timeline", _STYLE_H2), table]


def _draw_cover_page(canvas_obj, doc):
    """Draws a solid dark background on the cover page. Footers/headers are omitted here."""
    canvas_obj.saveState()
    width, height = A4
    canvas_obj.setFillColor(NAVY)
    canvas_obj.rect(0, 0, width, height, fill=1, stroke=0)
    canvas_obj.restoreState()


def _footer(canvas_obj, doc):
    canvas_obj.saveState()
    width, _height = A4
    canvas_obj.setStrokeColor(colors.HexColor("#E2E8F0"))
    canvas_obj.line(20 * mm, 16 * mm, width - 20 * mm, 16 * mm)
    canvas_obj.setFont("Helvetica", 7.5)
    canvas_obj.setFillColor(MUTED)
    canvas_obj.drawString(20 * mm, 11 * mm, "Generated by RescueLens AI")
    canvas_obj.drawString(
        20 * mm, 7 * mm,
        "Decision-support tool only — not a replacement for professional emergency personnel.",
    )
    canvas_obj.drawRightString(width - 20 * mm, 11 * mm, f"Page {doc.page}")
    canvas_obj.restoreState()


def build_incident_pdf(incident: dict) -> bytes:
    settings = get_settings()
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=20 * mm,
        bottomMargin=22 * mm,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        title=f"RescueLens AI Incident Report {incident.get('id', '')}",
    )

    story: list = []

    # --- Cover page ---
    story = _cover_flowables(incident)
    incident_url = f"{settings.frontend_origin}/result/{incident.get('id', '')}"
    story.append(_make_qr_flowable(incident_url))
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("Scan to view this incident online", _STYLE_COVER_SUB))
    story.append(PageBreak())

    # --- Report body ---
    story += _executive_summary_flowables(incident)
    story += _hazard_table_flowables(incident)
    story.append(Spacer(1, 2 * mm))
    story.append(Paragraph("Scene Description", _STYLE_H2))
    story.append(Paragraph(incident.get("summary", "") or "No summary available.", _STYLE_BODY))
    story += _risk_explanation_flowables(incident)
    story.append(Paragraph("Emergency Response Recommendation", _STYLE_H2))
    story.append(
        Paragraph(
            f"Recommended primary responder: <b>{incident.get('response_team', 'N/A')}</b>. "
            "This is produced by a deterministic rule engine based on the detected hazards above, "
            "independent of the AI's own free-text suggestion.",
            _STYLE_BODY,
        )
    )
    story += _timeline_flowables(incident)

    story.append(Paragraph("Original Image", _STYLE_H2))
    story.append(_fetch_image_flowable(incident.get("image_url", "")))

    doc.build(story, onFirstPage=_draw_cover_page, onLaterPages=_footer)
    buffer.seek(0)
    return buffer.read()

