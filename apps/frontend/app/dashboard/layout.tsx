'use client';

import { ToastContainer } from '@/lib/toast';

export default function DashboardRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
      <ToastContainer />
    </>
  );
}
