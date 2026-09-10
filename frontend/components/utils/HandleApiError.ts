import { ApiError, RedirectError } from "./ErrorUtils";

export const handleApiError = (
  error: unknown,
): { status: number; message: string; location?: string } => {
  if (error instanceof ApiError) {
    return { status: error.status, message: error.message };
  } else if (error instanceof RedirectError) {
    return {
      status: error.status,
      message: error.message,
      location: error.location,
    };
  } else if (error instanceof Error) {
    if (error.message.includes("Json deserialize error")) {
      return {
        status: 400,
        message: "Invalid data format received from the server.",
      };
    } else if (error.message.includes("Old password is incoorect")) {
      return { status: 400, message: "Old password is incorrect" };
    } else if (error.message.includes("HTTP error! status:")) {
      const statusMatch = error.message.match(/status: (\d+)/);
      const messageMatch = error.message.match(/message: (.+)/);
      const status = statusMatch ? parseInt(statusMatch[1], 10) : 400;
      let message = messageMatch
        ? messageMatch[1]
        : "An error occurred.";

      try {
        const jsonMessage = JSON.parse(message);
        message = jsonMessage.message || "An error occurred.";
      } catch (_) {
        message = message;
      }
      return { status, message };
    } else {
      return {
        status: 400,
        message: error.message,
      };
    }
  } else {
    return { status: 500, message: "An unexpected error occurred." };
  }
};
