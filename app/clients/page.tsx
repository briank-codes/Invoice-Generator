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

  return (
    <main>
      <h1>My Clients</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />
        <button type="submit">Add client</button>
      </form>

      {error && <p>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : clients.length === 0 ? (
        <p>No clients yet.</p>
      ) : (
        <ul>
          {clients.map((c) => (
            <li key={c.id}>
              {c.name}
              {c.email && ` · ${c.email}`}
              {c.phone && ` · ${c.phone}`}
              {c.address && ` · ${c.address}`}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}