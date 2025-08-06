import { useSelector } from "react-redux";

/**
 * Custom hook to check user permissions
 * @param {string} permission - The permission to check (e.g., 'tasks.create', 'model.view')
 * @returns {boolean} - Whether the user has the permission
 */
export const usePermissions = () => {
  const { permissions, role, isAuthenticated, lastPermissionUpdate } =
    useSelector((state) => state.auth);

  /**
   * Check if user has a specific permission
   * @param {string} permission - Permission in dot notation (e.g., 'tasks.create')
   * @returns {boolean}
   */
  const hasPermission = (permission) => {
    // If not authenticated, no permissions
    if (!isAuthenticated) {
      return false;
    }

    // Models and agencies have full access
    if (role === "model" || role === "agency") {
      return true;
    }

    // For employees, check specific permissions
    if (role === "employee") {
      // If permissions array is empty or undefined, no access
      if (!permissions || permissions.length === 0) {
        return false;
      }

      // Check if user has the specific permission
      return permissions.includes(permission);
    }

    // Default: no permission
    return false;
  };

  /**
   * Check if user has any of the provided permissions
   * @param {string[]} permissionList - Array of permissions to check
   * @returns {boolean}
   */
  const hasAnyPermission = (permissionList) => {
    return permissionList.some((permission) => hasPermission(permission));
  };

  /**
   * Check if user has all of the provided permissions
   * @param {string[]} permissionList - Array of permissions to check
   * @returns {boolean}
   */
  const hasAllPermissions = (permissionList) => {
    return permissionList.every((permission) => hasPermission(permission));
  };

  /**
   * Check if user can perform CRUD operations on a module
   * @param {string} module - Module name (e.g., 'tasks', 'model', 'uploads')
   * @param {string} action - Action type ('create', 'read', 'update', 'delete')
   * @returns {boolean}
   */
  const canPerformAction = (module, action) => {
    return hasPermission(`${module}.${action}`);
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canPerformAction,
    permissions,
    role,
    isAuthenticated,
    lastPermissionUpdate,
    // Convenience getters
    isModel: role === "model",
    isAgency: role === "agency",
    isEmployee: role === "employee",
    hasFullAccess: role === "model" || role === "agency",
  };
};

export default usePermissions;
