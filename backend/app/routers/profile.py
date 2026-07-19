from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.database.db import get_supabase
from app.models.permissions import Permission
from app.models.roles import ALL_ROLES
from app.models.schemas import RoleUpdate, UserProfile, UserProfileUpdate
from app.services.auth import get_current_user, require_permission

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=UserProfile)
async def update_my_profile(
    payload: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return current_user

    supabase = get_supabase()
    result = await run_in_threadpool(
        lambda: supabase.table("user_profiles").update(updates).eq("id", current_user["id"]).execute()
    )
    if not result.data:
        raise HTTPException(404, "Profile not found.")
    return result.data[0]


@router.post("/me/touch-login")
async def touch_last_login(current_user: dict = Depends(get_current_user)):
    """Called by the frontend right after a successful sign-in so
    `last_login` reflects reality without needing a DB trigger on
    every token refresh."""
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    await run_in_threadpool(
        lambda: supabase.table("user_profiles").update({"last_login": now}).eq("id", current_user["id"]).execute()
    )
    return {"ok": True}


@router.get("/users", response_model=list[UserProfile])
async def list_users(_admin: dict = Depends(require_permission(Permission.CAN_MANAGE_USERS))):
    supabase = get_supabase()
    result = await run_in_threadpool(
        lambda: supabase.table("user_profiles").select("*").order("created_at", desc=True).execute()
    )
    return result.data


@router.patch("/users/{user_id}/role", response_model=UserProfile)
async def update_user_role(
    user_id: str,
    payload: RoleUpdate,
    _admin: dict = Depends(require_permission(Permission.CAN_MANAGE_ROLES)),
):
    if payload.role not in ALL_ROLES:
        raise HTTPException(400, "Invalid role. Must be admin, responder, or viewer.")

    supabase = get_supabase()
    result = await run_in_threadpool(
        lambda: supabase.table("user_profiles").update({"role": payload.role}).eq("id", user_id).execute()
    )
    if not result.data:
        raise HTTPException(404, "User not found.")
    return result.data[0]

