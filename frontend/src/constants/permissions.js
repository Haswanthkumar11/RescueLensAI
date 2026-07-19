export const ROLES = {
  ADMIN: 'admin',
  RESPONDER: 'responder',
  VIEWER: 'viewer',
}

export const PERMISSIONS = {
  CAN_ANALYZE: 'can_analyze',
  CAN_VIEW_HISTORY: 'can_view_history',
  CAN_VIEW_ALL_INCIDENTS: 'can_view_all_incidents',
  CAN_ASSIGN_RESPONDERS: 'can_assign_responders',
  CAN_MANAGE_USERS: 'can_manage_users',
  CAN_MANAGE_ROLES: 'can_manage_roles',
  CAN_VIEW_RESPONDER_DASHBOARD: 'can_view_responder_dashboard',
  CAN_MANAGE_INCIDENTS: 'can_manage_incidents',
  CAN_VIEW_SETTINGS: 'can_view_settings',
}

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.CAN_ANALYZE,
    PERMISSIONS.CAN_VIEW_HISTORY,
    PERMISSIONS.CAN_VIEW_ALL_INCIDENTS,
    PERMISSIONS.CAN_ASSIGN_RESPONDERS,
    PERMISSIONS.CAN_MANAGE_USERS,
    PERMISSIONS.CAN_MANAGE_ROLES,
    PERMISSIONS.CAN_VIEW_RESPONDER_DASHBOARD,
    PERMISSIONS.CAN_MANAGE_INCIDENTS,
    PERMISSIONS.CAN_VIEW_SETTINGS,
  ],
  [ROLES.RESPONDER]: [
    PERMISSIONS.CAN_ANALYZE,
    PERMISSIONS.CAN_VIEW_HISTORY,
    PERMISSIONS.CAN_VIEW_ALL_INCIDENTS,
    PERMISSIONS.CAN_ASSIGN_RESPONDERS,
    PERMISSIONS.CAN_VIEW_RESPONDER_DASHBOARD,
    PERMISSIONS.CAN_MANAGE_INCIDENTS,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.CAN_ANALYZE,
    PERMISSIONS.CAN_VIEW_HISTORY,
  ],
}

export function hasPermission(role, permission) {
  if (!role) return false
  const allowed = ROLE_PERMISSIONS[role]
  return allowed ? allowed.includes(permission) : false
}
