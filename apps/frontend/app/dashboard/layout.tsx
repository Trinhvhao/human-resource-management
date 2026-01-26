import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - HRMS Pro",
  description: "Hệ thống quản lý nhân sự",
};

export default function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
