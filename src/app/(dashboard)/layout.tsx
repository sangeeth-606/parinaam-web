import { redirect } from "next/navigation";

import { Sidebar, Topbar } from "@/components/app-shell";
import { getSession } from "@/lib/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={session} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
