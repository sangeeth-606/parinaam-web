import { redirect } from "next/navigation";

import { Footer, Sidebar, Topbar, TricolorStrip } from "@/components/app-shell";
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
    <div className="flex min-h-screen flex-col">
      <TricolorStrip />
      <Topbar user={session} />
      <div className="flex flex-1">
        <Sidebar user={session} />
        <main className="min-w-0 flex-1 p-6">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
