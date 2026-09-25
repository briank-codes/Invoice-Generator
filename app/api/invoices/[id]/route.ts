import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 }
  );
}

function notFound() {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: "Invoice not found" } },
    { status: 404 }
  );
}

function withTotal<T extends { items: { quantity: number; unitPrice: number }[] }>(
  invoice: T
) {
  const total = invoice.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  return { ...invoice, total };
}

const VALID_STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId },
      include: { client: true, items: true },
    });
    if (!invoice) return notFound();

    return NextResponse.json({ invoice: withTotal(invoice) });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const status = body.status;
  if (typeof status !== "string" || !VALID_STATUSES.includes(status as any)) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: `status must be one of ${VALID_STATUSES.join(", ")}`,
        },
      },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.invoice.findFirst({ where: { id, userId } });
    if (!existing) return notFound();

    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: status as (typeof VALID_STATUSES)[number] },
      include: { client: true, items: true },
    });

    return NextResponse.json({ invoice: withTotal(invoice) });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}