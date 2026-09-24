import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE, verifyToken } from "@/lib/auth";

export async function getCurrentUser() {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = verifyToken(token);
    if (typeof payload === "string" || !payload.userId) return null;

    return await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true },
    });
  } catch {
    return null;
  }
}