
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req);
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { id } = await params;

  const client = await prisma.client.findFirst({ where: { id, userId } });
  if (!client) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Client not found" } },
      { status: 404 }
    );
  }

  try {
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e?.code === "P2003") {
      return NextResponse.json(
        {
          error: {
            code: "HAS_INVOICES",
            message: "Cannot delete a client with existing invoices",
          },
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}