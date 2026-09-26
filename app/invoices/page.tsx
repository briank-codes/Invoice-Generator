"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Invoice = {
  id: string;
  number: string;
  title: string | null;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
  dueDate: string;
  total: number;
  client: { id: string; name: string };
};

function formatMoney(minorUnits: number) {
  return (minorUnits / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/invoices");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message ?? "Failed to load invoices");
          return;
        }
        setInvoices(data.invoices);
      } catch {
        setError("Failed to load invoices");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <main>
      <h1>Invoices</h1>
      <Link href="/invoices/new">New invoice</Link>
      <span> · </span>
      <Link href="/">Home</Link>

      {error && <p>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : invoices.length === 0 ? (
        <p>No invoices yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Number</th>
              <th>Client</th>
              <th>Status</th>
              <th>Due</th>
              <th>Total (KES)</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>
  <Link href={`/invoices/${inv.id}`}>{inv.number}</Link>
</td>
                <td>{inv.client.name}</td>
                <td>{inv.status}</td>
                <td>{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td>{formatMoney(inv.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}