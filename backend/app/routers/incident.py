from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response

from app.models.permissions import Permission, has_permission
from app.services.auth import get_current_user, require_permission
from app.services.pdf_generator import build_incident_pdf
from app.services.supabase_client import delete_incident, get_incident

router = APIRouter(prefix="/incident", tags=["incident"])


@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str, current_user: dict = Depends(get_current_user)):
    incident = await run_in_threadpool(get_incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found.")
    
    # Access check: Viewers can only view their own reported incidents
    role = current_user.get("role")
    if not has_permission(role, Permission.CAN_VIEW_ALL_INCIDENTS):
        # Allow viewing if it is the viewer's own incident. For legacy/null user_id, access is restricted.
        if incident.get("user_id") != current_user["id"]:
            raise HTTPException(403, "You do not have permission to view this incident.")
            
    return incident


@router.delete("/{incident_id}")
async def remove_incident(
    incident_id: str,
    _user: dict = Depends(require_permission(Permission.CAN_MANAGE_ROLES)),
):
    if not await run_in_threadpool(get_incident, incident_id):
        raise HTTPException(404, "Incident not found.")
    await run_in_threadpool(delete_incident, incident_id)
    return {"deleted": True, "id": incident_id}


@router.get("/{incident_id}/report.pdf")
async def download_incident_report(incident_id: str, current_user: dict = Depends(get_current_user)):
    incident = await run_in_threadpool(get_incident, incident_id)
    if not incident:
        raise HTTPException(404, "Incident not found.")
        
    # Access check: Viewers can only download PDFs of their own incidents
    role = current_user.get("role")
    if not has_permission(role, Permission.CAN_VIEW_ALL_INCIDENTS):
        if incident.get("user_id") != current_user["id"]:
            raise HTTPException(403, "You do not have permission to download this report.")
            
    # build_incident_pdf does a network image fetch + CPU-bound rendering
    pdf_bytes = await run_in_threadpool(build_incident_pdf, incident)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="incident-{incident_id}.pdf"'},
    )

