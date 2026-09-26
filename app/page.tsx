import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "./logout-button";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-lg border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-neutral-900">
        <h1 className="text-2xl font-semibold">Welcome, {user.name}</h1>
        <p className="mt-1 text-sm text-neutral-500">{user.email}</p>

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