"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Invoice = {
  number: string;
  title: string | null;
  notes: string | null;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  client: { name: string; email: string | null; phone: string | null; address: string | null };
  items: { id: string; description: string; quantity: number; unitPrice: number }[];
};

function formatMoney(minorUnits: number) {
  return (minorUnits / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function PrintInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/invoices/${id}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message ?? "Failed to load invoice");
          return;
        }
        setInvoice(data.invoice);
        // Give the browser a moment to paint before opening the print dialog
        setTimeout(() => window.print(), 300);
      } catch {
        setError("Failed to load invoice");
      }
    }
    load();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!invoice) return <p>Loading...</p>;

  return (
    <div className="print-invoice">
      <style>{`
        @media print {
          @page { margin: 2cm; }
          .no-print { display: none; }
        }
        .print-invoice {
          font-family: system-ui, sans-serif;
          max-width: 700px;
          margin: 2rem auto;
          color: #111;
        }
        .print-invoice h1 {
          font-size: 1.5rem;
          margin-bottom: 0.25rem;
        }
        .print-invoice table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 1.5rem;
        }
        .print-invoice th, .print-invoice td {
          border-bottom: 1px solid #ddd;
          padding: 0.5rem;
          text-align: left;
        }
        .print-invoice .total-row td {
          border-top: 2px solid #111;
          border-bottom: none;
          font-weight: bold;
        }
        .print-invoice .header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }
      `}</style>

      <button className="no-print" onClick={() => window.print()}>
        Print / Save as PDF
      </button>

      <div className="header-row">
        <div>
          <h1>Invoice {invoice.number}</h1>
          {invoice.title && <p>{invoice.title}</p>}
        </div>
        <div>
          <p>Status: {invoice.status}</p>
          <p>Issued: {new Date(invoice.issueDate).toLocaleDateString()}</p>
          <p>Due: {new Date(invoice.dueDate).toLocaleDateString()}</p>
        </div>
      </div>

      <h3>Bill to</h3>
      <p>{invoice.client.name}</p>
      {invoice.client.email && <p>{invoice.client.email}</p>}
      {invoice.client.phone && <p>{invoice.client.phone}</p>}
      {invoice.client.address && <p>{invoice.client.address}</p>}

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
          <tr className="total-row">
            <td colSpan={3}>Total</td>
            <td>KES {formatMoney(invoice.total)}</td>
          </tr>
        </tbody>
      </table>

      {invoice.notes && (
        <>
          <h3>Notes</h3>
          <p>{invoice.notes}</p>
        </>
      )}
    </div>
  );

}
