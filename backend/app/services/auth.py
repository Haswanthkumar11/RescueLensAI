"""
Backend-side auth. The frontend authenticates directly against Supabase
Auth (email/password, verification, password reset all happen there --
the backend never sees a password). Every protected backend request
carries the resulting session's access token as `Authorization: Bearer
<token>`; this module validates that token and loads the caller's role.

get_current_user(token) -> any authenticated user (Admin/Responder/Viewer)
require_role(Role.ADMIN, ...) -> restricts to specific roles

Self-healing profiles: a `user_profiles` row is normally created
automatically by the `on_auth_user_created` DB trigger (see
docs/migrations/002_add_user_profiles.sql) the instant someone signs up.
But an account created *before* that trigger existed has no such row,
and rather than permanently 403 those accounts, get_current_user
creates the missing row itself, the first time that user is next seen,
via an idempotent upsert. No manual SQL is ever required.
"""
import logging

from fastapi import Depends, Header, HTTPException
from fastapi.concurrency import run_in_threadpool

from app.database.db import get_supabase
from app.models.roles import DEFAULT_ROLE, Role
from app.models.permissions import Permission, has_permission

logger = logging.getLogger(__name__)


async def get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Missing or malformed Authorization header.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(401, "Missing bearer token.")

    supabase = get_supabase()

    # Validates the JWT against Supabase Auth and returns the user it
    # belongs to. Raises on an invalid/expired/tampered token.
    try:
        auth_response = await run_in_threadpool(supabase.auth.get_user, token)
    except Exception as exc:
        logger.warning("Token validation failed: %s", exc)
        raise HTTPException(401, "Invalid or expired session. Please log in again.") from exc

    user = getattr(auth_response, "user", None)
    if not user:
        raise HTTPException(401, "Invalid or expired session. Please log in again.")

    try:
        profile_result = await run_in_threadpool(
            lambda: supabase.table("user_profiles").select("*").eq("id", user.id).execute()
        )
    except Exception as exc:
        logger.exception("Failed to query user_profiles for %s", user.id)
        # Most common cause: docs/migrations/002_add_user_profiles.sql
        # hasn't been run yet, so this table doesn't exist at all --
        # that's a setup problem, not something we can self-heal.
        raise HTTPException(
            500,
            "Could not read user_profiles. Has "
            "docs/migrations/002_add_user_profiles.sql been run in Supabase yet? "
            f"(underlying error: {exc})",
        ) from exc

    if profile_result.data:
        profile = profile_result.data[0]
    else:
        # Self-heal: this account predates the auth trigger, or the
        # trigger otherwise didn't run. Create the missing row now.
        # upsert (not insert) makes this safe if two requests for the
        # same brand-new user race each other -- the second one just
        # returns the row the first one created.
        logger.info("No user_profiles row for %s -- creating one now (self-heal).", user.id)
        try:
            create_result = await run_in_threadpool(
                lambda: supabase.table("user_profiles")
                .upsert(
                    {"id": user.id, "email": user.email, "role": DEFAULT_ROLE.value},
                    on_conflict="id",
                )
                .execute()
            )
        except Exception as exc:
            logger.exception("Self-heal profile creation failed for %s", user.id)
            raise HTTPException(
                500,
                "Your account is authenticated, but a profile could not be created "
                "automatically. This usually means the user_profiles table's schema "
                "doesn't match what the backend expects -- re-run "
                f"docs/migrations/002_add_user_profiles.sql. (underlying error: {exc})",
            ) from exc
        if not create_result.data:
            raise HTTPException(500, "Profile self-heal returned no data unexpectedly.")
        profile = create_result.data[0]

    return {"id": user.id, "email": user.email, **profile}


def require_role(*allowed_roles: Role):
    """FastAPI dependency factory: Depends(require_role(Role.ADMIN, Role.RESPONDER))"""

    async def _dependency(current_user: dict = Depends(get_current_user)) -> dict:
        if current_user.get("role") not in {r.value for r in allowed_roles}:
            allowed_str = ", ".join(r.value for r in allowed_roles)
            raise HTTPException(
                403,
                f"This action requires one of these roles: {allowed_str}.",
            )
        return current_user

    return _dependency


def require_permission(permission: Permission):
    """FastAPI dependency factory: Depends(require_permission(Permission.CAN_MANAGE_USERS))"""

    async def _dependency(current_user: dict = Depends(get_current_user)) -> dict:
        role = current_user.get("role")
        if not has_permission(role, permission):
            raise HTTPException(
                403,
                f"This action requires the '{permission.value}' permission.",
            )
        return current_user

    return _dependency

