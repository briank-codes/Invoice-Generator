"use client";

import { useEffect, useState } from "react";

type Client = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });

  async function loadClients() {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to load clients");
        return;
      }
      setClients(data.clients);
      setError("");
    } catch {
      setError("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to add client");
        return;
      }
      setForm({ name: "", email: "", phone: "", address: "" });
      await loadClients();
    } catch {
      setError("Failed to add client");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client?")) return;
    setError("");
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to delete client");
        return;
      }
      await loadClients();
    } catch {
      setError("Failed to delete client");
    }
  }

  const inputClass =
    "w-full rounded-md border border-black/10 px-3 py-2 text-sm outline-none focus:border-neutral-400 dark:border-white/10 dark:bg-neutral-900";

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">My Clients</h1>

      <form
        onSubmit={handleSubmit}
        className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-neutral-900 sm:grid-cols-2"
      >
        <input
          className={inputClass}
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className={inputClass}
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <button
          type="submit"
          className="sm:col-span-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          Add client
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        {loading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : clients.length === 0 ? (
          <p className="text-sm text-neutral-500">No clients yet.</p>
        ) : (
          <ul className="divide-y divide-black/10 rounded-lg border border-black/10 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-neutral-900">
            {clients.map((c) => (
              <li key={c.id} className="flex items-center justify-between p-4 text-sm">
                <div>
                  <span className="font-medium">{c.name}</span>
                  {c.email && <span className="text-neutral-500"> · {c.email}</span>}
                  {c.phone && <span className="text-neutral-500"> · {c.phone}</span>}
                  {c.address && <span className="text-neutral-500"> · {c.address}</span>}
                </div>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}