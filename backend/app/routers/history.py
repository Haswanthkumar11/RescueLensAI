from fastapi import APIRouter, Depends, Query
from fastapi.concurrency import run_in_threadpool

from app.models.permissions import Permission, has_permission
from app.services.auth import get_current_user
from app.services.supabase_client import list_incidents

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
async def get_history(
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user),
):
    role = current_user.get("role")
    user_id_filter = None
    
    # If the user lacks the permission to view all incidents (i.e. is a Viewer),
    # filter the results to only include incidents they reported.
    if not has_permission(role, Permission.CAN_VIEW_ALL_INCIDENTS):
        user_id_filter = current_user["id"]

    incidents = await run_in_threadpool(list_incidents, limit=limit, user_id=user_id_filter)
    return {"incidents": incidents}

