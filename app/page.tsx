import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import LogoutButton from "./logout-button";

function formatMoney(minorUnits: number) {
  return (minorUnits / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const invoices = await prisma.invoice.findMany({
    where: { userId: user.id },
    include: { items: true },
  });

  const now = new Date();
  let outstanding = 0;
  let overdueCount = 0;
  const countByStatus: Record<string, number> = { DRAFT: 0, SENT: 0, PAID: 0, OVERDUE: 0 };

  for (const inv of invoices) {
    countByStatus[inv.status] = (countByStatus[inv.status] ?? 0) + 1;
    const total = inv.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    if (inv.status !== "PAID") {
      outstanding += total;
      if (inv.dueDate < now) overdueCount += 1;
    }
  }

  const clientCount = await prisma.client.count({ where: { userId: user.id } });

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="rounded-lg border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-md border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs text-neutral-500">Outstanding</p>
            <p className="mt-1 text-lg font-semibold">KES {formatMoney(outstanding)}</p>
          </div>
          <div className="rounded-md border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs text-neutral-500">Overdue</p>
            <p className="mt-1 text-lg font-semibold">{overdueCount}</p>
          </div>
          <div className="rounded-md border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs text-neutral-500">Invoices</p>
            <p className="mt-1 text-lg font-semibold">{invoices.length}</p>
          </div>
          <div className="rounded-md border border-black/10 p-4 dark:border-white/10">
            <p className="text-xs text-neutral-500">Clients</p>
            <p className="mt-1 text-lg font-semibold">{clientCount}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/clients"
            className="rounded-md bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            My Clients
          </Link>
          <Link
            href="/invoices"
            className="rounded-md border border-black/10 px-4 py-2 text-center text-sm font-medium hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-neutral-800"
          >
            Invoices
          </Link>
        </div>

        <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}