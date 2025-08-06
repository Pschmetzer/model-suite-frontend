import store from "../globalstate/store";
import { logout as logoutAction } from "../globalstate/authSlice";

/**
 * Centralized logout utility function
 * This ensures consistent logout behavior across the application
 * and properly clears Redux state
 */
export const performLogout = () => {
  // Dispatch logout action to clear Redux state
  store.dispatch(logoutAction());
};

/**
 * Get the appropriate login path based on user role
 * @param {string} userRole - The user's role (model, agency, employee)
 * @returns {string} - The login path
 */
export const getLoginPath = (userRole) => {
  switch (userRole) {
    case "model":
      return "/model/login";
    case "agency":
    case "employee":
      return "/agency/login";
    default:
      return "/";
  }
};

/**
 * Logout and redirect to appropriate login page
 * @param {string} userRole - The user's role
 */
export const logoutAndRedirect = (userRole) => {
  performLogout();
  const loginPath = getLoginPath(userRole);
  window.location.href = loginPath;
};
