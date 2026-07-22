"""
Role-based access control (RBAC) permissions definitions and verification mapping.
"""
from enum import Enum
from app.models.roles import Role


class Permission(str, Enum):
    CAN_ANALYZE = "can_analyze"
    CAN_VIEW_HISTORY = "can_view_history"
    CAN_VIEW_ALL_INCIDENTS = "can_view_all_incidents"
    CAN_ASSIGN_RESPONDERS = "can_assign_responders"
    CAN_MANAGE_USERS = "can_manage_users"
    CAN_MANAGE_ROLES = "can_manage_roles"
    CAN_VIEW_RESPONDER_DASHBOARD = "can_view_responder_dashboard"
    CAN_MANAGE_INCIDENTS = "can_manage_incidents"
    CAN_VIEW_SETTINGS = "can_view_settings"


ROLE_PERMISSIONS: dict[Role, set[Permission]] = {
    Role.ADMIN: {
        Permission.CAN_ANALYZE,
        Permission.CAN_VIEW_HISTORY,
        Permission.CAN_VIEW_ALL_INCIDENTS,
        Permission.CAN_ASSIGN_RESPONDERS,
        Permission.CAN_MANAGE_USERS,
        Permission.CAN_MANAGE_ROLES,
        Permission.CAN_VIEW_RESPONDER_DASHBOARD,
        Permission.CAN_MANAGE_INCIDENTS,
        Permission.CAN_VIEW_SETTINGS,
    },
    Role.RESPONDER: {
        Permission.CAN_ANALYZE,
        Permission.CAN_VIEW_HISTORY,
        Permission.CAN_VIEW_ALL_INCIDENTS,
        Permission.CAN_ASSIGN_RESPONDERS,
        Permission.CAN_VIEW_RESPONDER_DASHBOARD,
        Permission.CAN_MANAGE_INCIDENTS,
    },
    Role.VIEWER: {
        Permission.CAN_ANALYZE,
        Permission.CAN_VIEW_HISTORY,
    },
}


def has_permission(role: str, permission: Permission) -> bool:
    """Checks whether a user role string possesses the specified Permission."""
    try:
        r = Role(role)
        return permission in ROLE_PERMISSIONS.get(r, set())
    except ValueError:
        return False

