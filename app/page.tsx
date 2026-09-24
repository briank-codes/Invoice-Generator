import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import LogoutButton from "./logout-button";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div>
      <h1>Welcome, {user.name}</h1>
      <p>{user.email}</p>
      <div><Link href="/clients">My Clients</Link></div>
      <div><Link href="/invoices">Invoices</Link></div>
      <LogoutButton />
    </div>
  );
}