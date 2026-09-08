import { auth } from "@/auth";

export async function getCurrentUserServer() {
  const session = await auth();
  return session?.user;
}
