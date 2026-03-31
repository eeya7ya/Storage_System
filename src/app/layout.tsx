import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: "برنامج جرد الصناديق",
  description: "شركة الاعداد الراقي للتجارة والتزويد",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={tajawal.variable}>
      <body className="min-h-screen bg-slate-50 font-[family-name:var(--font-tajawal)]">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
