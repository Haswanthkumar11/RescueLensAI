"""
Single source of truth for user roles. Import Role instead of typing
role strings by hand -- this is what "avoid magic strings" means in
practice: one place defines what a valid role is, everything else
references it.
"""
from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    RESPONDER = "responder"
    VIEWER = "viewer"


# Every new signup gets this role. Least-privilege by default -- an
# admin promotes trusted accounts explicitly via PATCH /profile/users/{id}/role.
DEFAULT_ROLE = Role.VIEWER

ALL_ROLES = tuple(role.value for role in Role)
