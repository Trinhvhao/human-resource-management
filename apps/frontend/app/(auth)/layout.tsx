import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Đăng nhập - HRMS Pro",
    description: "Đăng nhập vào hệ thống quản lý nhân sự",
};

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
