"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Client = { id: string; name: string };
type ItemRow = { description: string; quantity: string; unitPrice: string };

const emptyItem = (): ItemRow => ({
  description: "",
  quantity: "1",
  unitPrice: "",
});

function toMinorUnits(value: string): number | null {
  const n = Number(value);
  if (!value.trim() || !Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function formatMoney(minorUnits: number) {
  return (minorUnits / 100).toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const inputClass =
  "w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900";
const labelClass = "block text-sm font-medium mb-1";

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadClients() {
      try {
        const res = await fetch("/api/clients");
        const data = await res.json();
        if (!res.ok) {
          setError(data.error?.message ?? "Failed to load clients");
          return;
        }
        setClients(data.clients);
      } catch {
        setError("Failed to load clients");
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  function updateItem(index: number, field: keyof ItemRow, value: string) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce((sum, item) => {
    const qty = Number(item.quantity);
    const price = toMinorUnits(item.unitPrice);
    if (!Number.isInteger(qty) || qty < 1 || price === null) return sum;
    return sum + qty * price;
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!clientId) return setError("Choose a client");
    if (!dueDate) return setError("Set a due date");

    const payloadItems = [];
    for (const item of items) {
      const quantity = Number(item.quantity);
      const unitPrice = toMinorUnits(item.unitPrice);
      if (!item.description.trim()) return setError("Every item needs a description");
      if (!Number.isInteger(quantity) || quantity < 1) {
        return setError("Quantity must be a whole number of at least 1");
      }
      if (unitPrice === null) return setError("Every item needs a valid price");
      payloadItems.push({
        description: item.description.trim(),
        quantity,
        unitPrice,
      });
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          title,
          notes,
          dueDate,
          items: payloadItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to create invoice");
        return;
      }
      router.push("/invoices");
    } catch {
      setError("Failed to create invoice");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loadingClients && clients.length === 0 && !error) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-2xl font-semibold">New invoice</h1>
        <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400">
          You need a client first.{" "}
          <Link href="/clients" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Add one here
          </Link>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New invoice</h1>
        <Link href="/invoices" className="text-sm text-neutral-500 hover:underline">
          Back to invoices
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5 rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900"
      >
        <div>
          <label className={labelClass}>Client</label>
          <select
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            <option value="">Select a client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Title (optional)</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Due date</label>
          <input
            type="date"
            className={inputClass}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-2">Items</h2>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-2">
                <input
                  className={`${inputClass} flex-[3]`}
                  placeholder="Description"
                  value={item.description}
                  onChange={(e) => updateItem(i, "description", e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  className={`${inputClass} flex-1`}
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => updateItem(i, "quantity", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`${inputClass} flex-1`}
                  placeholder="Unit price"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="px-2 text-sm text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setItems([...items, emptyItem()])}
            className="mt-3 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            + Add item
          </button>
        </div>

        <div className="flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
          <span className="text-sm text-neutral-500">Total</span>
          <span className="text-lg font-semibold">KES {formatMoney(total)}</span>
        </div>

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <textarea
            className={inputClass}
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {submitting ? "Creating..." : "Create invoice"}
        </button>
      </form>
    </main>
  );
}