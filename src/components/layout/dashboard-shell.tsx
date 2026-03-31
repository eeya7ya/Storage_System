"use client";

import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  userRole: string;
  userName: string;
  userBranch?: string | null;
}

export function DashboardShell({
  children,
  title,
  userRole,
  userName,
  userBranch,
}: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar userRole={userRole} userName={userName} userBranch={userBranch} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} userName={userName} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
