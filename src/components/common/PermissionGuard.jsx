import React from "react";
import { usePermissions } from "../../hooks/usePermissions";

/**
 * PermissionGuard component to conditionally render children based on user permissions
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to render if permission is granted
 * @param {string} [props.permission] - Single permission to check
 * @param {string[]} [props.permissions] - Array of permissions (user needs ANY of these)
 * @param {string[]} [props.requireAll] - Array of permissions (user needs ALL of these)
 * @param {string} [props.module] - Module name for CRUD operations
 * @param {string} [props.action] - Action type for CRUD operations (create, read, update, delete)
 * @param {React.ReactNode} [props.fallback] - Content to render if permission is denied
 * @param {boolean} [props.employeeOnly] - If true, only applies restrictions to employees (models/agencies always pass)
 * @returns {React.ReactNode}
 */
const PermissionGuard = ({
  children,
  permission,
  permissions,
  requireAll,
  module,
  action,
  fallback = null,
  employeeOnly = true,
}) => {
  const {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerformAction,
    hasFullAccess,
    isEmployee,
  } = usePermissions();

  // If employeeOnly is true and user is not an employee, always show content
  if (employeeOnly && !isEmployee) {
    return children;
  }

  // If user has full access (model/agency), always show content
  if (hasFullAccess) {
    return children;
  }

  let hasAccess = false;

  // Check permissions based on provided props
  if (module && action) {
    // CRUD operation check
    hasAccess = canPerformAction(module, action);
  } else if (permission) {
    // Single permission check
    hasAccess = hasPermission(permission);
  } else if (requireAll && requireAll.length > 0) {
    // All permissions required
    hasAccess = hasAllPermissions(requireAll);
  } else if (permissions && permissions.length > 0) {
    // Any permission required
    hasAccess = hasAnyPermission(permissions);
  } else {
    // No permission specified, default to showing content
    hasAccess = true;
  }

  return hasAccess ? children : fallback;
};

export default PermissionGuard;
