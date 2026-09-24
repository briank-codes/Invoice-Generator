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

// "1500.50" -> 150050 (minor units). Returns null if invalid.
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
      <main>
        <h1>New invoice</h1>
        <p>
          You need a client first. <Link href="/clients">Add one here</Link>.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>New invoice</h1>
      <Link href="/invoices">Back to invoices</Link>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Client
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Select a client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            Title (optional)
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
        </div>

        <div>
          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>

        <h2>Items</h2>
        {items.map((item, i) => (
          <div key={i}>
            <input
              placeholder="Description"
              value={item.description}
              onChange={(e) => updateItem(i, "description", e.target.value)}
            />
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Qty"
              value={item.quantity}
              onChange={(e) => updateItem(i, "quantity", e.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Unit price"
              value={item.unitPrice}
              onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
            />
            {items.length > 1 && (
              <button type="button" onClick={() => removeItem(i)}>
                Remove
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={() => setItems([...items, emptyItem()])}>
          Add item
        </button>

        <p>Total: KES {formatMoney(total)}</p>

        <div>
          <label>
            Notes (optional)
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
        </div>

        {error && <p>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create invoice"}
        </button>
      </form>
    </main>
  );
}