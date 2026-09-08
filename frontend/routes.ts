/**
 * An array of routes that are used for authentication
 * @type { string[] }
 */
export const authRoutes: string[] = ["/login", "/register"];

/**
 * Routes that start with this prefix are sued for API authentication purposes
 * @type { string }
 */
export const apiAuthPrefix: string = "/api/auth";

/**
 * The default redirectr path after logging in
 * @type { string }
 */
export const DEFAULT_LOGIN_REDIRECT: string = "/upload";
