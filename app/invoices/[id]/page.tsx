"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Invoice = {
  id: string;
  number: string;
  title: string | null;
  notes: string | null;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
  issueDate: string;
  dueDate: string;
  total: number;
  client: { name: string; email: string | null; phone: string | null; address: string | null };
  items: { id: string; description: string; quantity: number; unitPrice: number }[];
};

const STATUSES = ["DRAFT", "SENT", "PAID", "OVERDUE"] as const;

const STATUS_STYLES: Record<Invoice["status"], string> = {
  DRAFT: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  SENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  OVERDUE: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function formatMoney(minorUnits: number) {
  return (minorUnits / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const res = await fetch(`/api/invoices/${id}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to load invoice");
        return;
      }
      setInvoice(data.invoice);
      setError("");
    } catch {
      setError("Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function handleStatusChange(status: string) {
    setUpdating(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to update status");
        return;
      }
      setInvoice(data.invoice);
    } catch {
      setError("Failed to update status");
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to delete invoice");
        setDeleting(false);
        return;
      }
      router.push("/invoices");
    } catch {
      setError("Failed to delete invoice");
      setDeleting(false);
    }
  }

  if (loading) return <p className="p-6 text-sm text-neutral-500">Loading...</p>;
  if (error && !invoice) return <p className="p-6 text-sm text-red-600">{error}</p>;
  if (!invoice) return null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center gap-4 text-sm">
        <Link href="/invoices" className="text-neutral-500 hover:underline">
          Back to invoices
        </Link>
        <Link
          href={`/invoices/${invoice.id}/print`}
          target="_blank"
          className="font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Print / PDF
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto text-red-600 hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">
              {invoice.number} {invoice.title && `— ${invoice.title}`}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Issued {new Date(invoice.issueDate).toLocaleDateString()} · Due{" "}
              {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[invoice.status]}`}>
            {invoice.status}
          </span>
        </div>

        <div className="mt-4">
          <label className="text-sm font-medium">
            Status:{" "}
            <select
              value={invoice.status}
              disabled={updating}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="ml-2 rounded-md border border-black/10 px-2 py-1 text-sm dark:border-white/10 dark:bg-neutral-900"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
          <h2 className="text-sm font-semibold text-neutral-500">Client</h2>
          <p className="mt-1 font-medium">{invoice.client.name}</p>
          {invoice.client.email && <p className="text-sm text-neutral-500">{invoice.client.email}</p>}
          {invoice.client.phone && <p className="text-sm text-neutral-500">{invoice.client.phone}</p>}
          {invoice.client.address && <p className="text-sm text-neutral-500">{invoice.client.address}</p>}
        </div>

        <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
          <h2 className="text-sm font-semibold text-neutral-500 mb-2">Items</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="py-2 font-medium">Description</th>
                <th className="py-2 font-medium">Qty</th>
                <th className="py-2 font-medium">Unit price</th>
                <th className="py-2 font-medium text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 dark:divide-white/10">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-2">{item.description}</td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2">{formatMoney(item.unitPrice)}</td>
                  <td className="py-2 text-right">{formatMoney(item.quantity * item.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3 dark:border-white/10">
            <span className="text-sm text-neutral-500">Total</span>
            <span className="text-lg font-semibold">KES {formatMoney(invoice.total)}</span>
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-6 border-t border-black/10 pt-4 dark:border-white/10">
            <h2 className="text-sm font-semibold text-neutral-500">Notes</h2>
            <p className="mt-1 text-sm">{invoice.notes}</p>
          </div>
        )}
      </div>
    </main>
  );
}