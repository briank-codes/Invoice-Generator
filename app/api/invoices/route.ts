import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
    { status: 401 }
  );
}

function validationError(message: string) {
  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message } },
    { status: 400 }
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

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: { client: true, items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ invoices: invoices.map(withTotal) });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return validationError("Invalid JSON body");
  }
  if (!body || typeof body !== "object") {
    return validationError("Invalid JSON body");
  }

  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  if (!clientId) return validationError("clientId is required");

  const dueDate = new Date(String(body.dueDate));
  if (Number.isNaN(dueDate.getTime())) {
    return validationError("A valid dueDate is required");
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return validationError("At least one item is required");
  }

  const items: { description: string; quantity: number; unitPrice: number }[] = [];
  for (const raw of body.items) {
    const description =
      typeof raw?.description === "string" ? raw.description.trim() : "";
    const quantity = raw?.quantity;
    const unitPrice = raw?.unitPrice;

    if (!description) return validationError("Each item needs a description");
    if (!Number.isInteger(quantity) || quantity < 1) {
      return validationError("Item quantity must be a whole number of at least 1");
    }
    if (!Number.isInteger(unitPrice) || unitPrice < 0) {
      return validationError("Item unitPrice must be a non-negative whole number");
    }
    items.push({ description, quantity, unitPrice });
  }

  const optional = (v: unknown) =>
    typeof v === "string" && v.trim() ? v.trim() : null;

  try {
    // The client must exist AND belong to the logged-in user
    const client = await prisma.client.findFirst({
      where: { id: clientId, userId },
    });
    if (!client) return validationError("Client not found");

    // Next invoice number for this user: INV-0001, INV-0002, ...
    const count = await prisma.invoice.count({ where: { userId } });
    const number = `INV-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        userId,
        clientId,
        number,
        title: optional(body.title),
        notes: optional(body.notes),
        dueDate,
        items: { create: items },
      },
      include: { client: true, items: true },
    });

    return NextResponse.json({ invoice: withTotal(invoice) }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: { code: "SERVER_ERROR", message: "Something went wrong" } },
      { status: 500 }
    );
  }
}