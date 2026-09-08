import { getCurrentUserServer } from "@/hooks/use-current-user-server";
import { RedirectError } from "./ErrorUtils";

// const options: RequestInit = {
//   method: "POST", // 'GET', 'POST', 'PUT', 'DELETE', etc.
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: "Bearer token_123",
//   },
//   body: JSON.stringify({ key: "value" }), // string, FormData, Blob, URLSearchParams, etc.
//   mode: "cors", // 'cors', 'no-cors', 'same-origin'
//   credentials: "include", // 'omit', 'same-origin', 'include'
//   cache: "no-cache", // 'default', 'no-store', 'reload', 'no-cache', 'force-cache'
//   signal: AbortSignal.timeout(5000), // Used to cancel requests
// };

interface GlobalAPICallProps {
  url: string;
  options?: RequestInit;
}

export const GlobalApiCall = async ({
  url,
  options = {},
}: GlobalAPICallProps) => {
  try {
    const session = await getCurrentUserServer();
    const token = session?.accessToken ?? null;

    const response = await fetch(url, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (response.status === 401) {
      throw new RedirectError(302, "/logout", "session expired");
    }

    if (!response.ok) {
      const errorTask = await response.text();
      throw new Error(
        `HTTP error! status: ${response.status}, message:${errorTask}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("fetch error: ", error);
    throw error;
  }
};
