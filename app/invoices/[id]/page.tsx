"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

function formatMoney(minorUnits: number) {
  return (minorUnits / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);

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

  if (loading) return <p>Loading...</p>;
  if (error && !invoice) return <p>{error}</p>;
  if (!invoice) return null;

  return (
    <main>
      <Link href="/invoices">Back to invoices</Link>

      <h1>
        {invoice.number} {invoice.title && `— ${invoice.title}`}
      </h1>

      <div>
        <label>
          Status:{" "}
          <select
            value={invoice.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p>{error}</p>}

      <p>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</p>
      <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>

      <h2>Client</h2>
      <p>{invoice.client.name}</p>
      {invoice.client.email && <p>{invoice.client.email}</p>}
      {invoice.client.phone && <p>{invoice.client.phone}</p>}
      {invoice.client.address && <p>{invoice.client.address}</p>}

      <h2>Items</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price (KES)</th>
            <th>Subtotal (KES)</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item) => (
            <tr key={item.id}>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>{formatMoney(item.unitPrice)}</td>
              <td>{formatMoney(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p>
        <strong>Total: KES {formatMoney(invoice.total)}</strong>
      </p>

      {invoice.notes && (
        <>
          <h2>Notes</h2>
          <p>{invoice.notes}</p>
        </>
      )}
    </main>
  );
}