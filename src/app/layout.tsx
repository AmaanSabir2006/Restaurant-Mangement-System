import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "BURGERCRAFT OS | Fast Food POS, KDS & Real-time Inventory",
  description:
    "Production-grade Fast Food Restaurant Management, Order Processing, Real-Time Kitchen Display System (KDS), and Recipe BOM Inventory Control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-orange-500 selection:text-white"
        suppressHydrationWarning
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
