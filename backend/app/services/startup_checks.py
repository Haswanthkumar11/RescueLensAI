"""
Startup schema validation.

This app's database schema evolved in two additive migrations after the
base schema. Rather than let a missing migration surface as a confusing
runtime error the first time a user hits the affected endpoint (exactly
what happened with `contributing_factors` and `user_profiles` during
development), check for it once at process startup and fail loudly and
specifically.

Each check is a real query against the actual columns the backend
depends on (not just "does the table exist") using supabase-py's
existing REST interface -- no raw SQL / direct Postgres connection
needed.
"""
import logging

from postgrest.exceptions import APIError

from app.database.db import get_supabase

logger = logging.getLogger(__name__)


def _check(label: str, query_fn, fix: str) -> str | None:
    """Runs one schema check. Returns an error string on failure, None on success."""
    try:
        query_fn()
        return None
    except APIError as exc:
        return f"[{label}] {exc.message if hasattr(exc, 'message') else exc}  ->  fix: {fix}"
    except Exception as exc:  # noqa: BLE001 -- deliberately broad, this is a diagnostic
        return f"[{label}] {exc}  ->  fix: {fix}"


def _check_triggers_and_policies(errors: list[str]) -> None:
    """Helper to verify DB trigger and RLS policies via schema_info view."""
    supabase = get_supabase()
    try:
        res = supabase.table("schema_info").select("*").execute()
        rows = res.data or []
        
        # Check trigger
        has_trigger = any(
            r.get("type") == "trigger" and 
            r.get("tablename") == "users" and 
            r.get("name") == "on_auth_user_created"
            for r in rows
        )
        if not has_trigger:
            errors.append(
                "[trigger] 'on_auth_user_created' on auth.users is missing  ->  "
                "fix: run docs/migrations/002_add_user_profiles.sql"
            )
            
        # Check policies on user_profiles
        expected_policies = {
            "Users can view their own profile",
            "Users can update their own profile"
        }
        found_policies = {
            r.get("name") 
            for r in rows 
            if r.get("type") == "policy" and r.get("tablename") == "user_profiles"
        }
        missing_policies = expected_policies - found_policies
        for policy in missing_policies:
            errors.append(
                f"[policy] '{policy}' on user_profiles is missing  ->  "
                "fix: run docs/migrations/002_add_user_profiles.sql"
            )
    except Exception as exc:
        errors.append(
            "[schema_info] Could not query schema_info view. "
            "Please run the updated docs/migrations/002_add_user_profiles.sql in the Supabase SQL editor. "
            f"(underlying error: {exc})"
        )


def validate_schema() -> None:
    """Checks required database tables, columns, migrations, triggers, and policies.
    Logs a critical audit banner if schema is out of sync, without raising
    RuntimeError to avoid blocking backend process startup unnecessarily."""
    supabase = get_supabase()
    errors: list[str] = []

    errors.append(
        _check(
            "incidents (base columns & user_id)",
            lambda: supabase.table("incidents").select("id,user_id,image_url,priority,score").limit(1).execute(),
            "run docs/supabase_schema.sql and docs/migrations/003_add_incident_user_relationship.sql",
        )
    )
    errors.append(
        _check(
            "incidents.timeline / incidents.contributing_factors",
            lambda: supabase.table("incidents").select("timeline,contributing_factors").limit(1).execute(),
            "run docs/migrations/001_add_incident_timeline.sql",
        )
    )
    errors.append(
        _check(
            "detections",
            lambda: supabase.table("detections").select("id").limit(1).execute(),
            "run docs/supabase_schema.sql",
        )
    )
    errors.append(
        _check(
            "user_profiles",
            lambda: supabase.table("user_profiles").select("id,email,role").limit(1).execute(),
            "run docs/migrations/002_add_user_profiles.sql",
        )
    )

    # Perform policy & trigger audits via the schema_info view
    _check_triggers_and_policies(errors)

    errors = [e for e in errors if e]
    if errors:
        banner = "\n".join(
            [
                "=" * 78,
                "DATABASE SCHEMA AUDIT WARNING: Database issues were detected.",
                "=" * 78,
                *errors,
                "=" * 78,
                "Please run the migration(s) named above in the Supabase SQL editor.",
                "See README.md -> 'Supabase' section for full setup steps.",
                "=" * 78,
            ]
        )
        logger.critical(banner)
    else:
        logger.info(
            "Schema validation passed: incidents, detections, user_profiles, triggers, and policies all OK."
        )

