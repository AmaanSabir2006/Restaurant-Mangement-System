import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "PIZZA WORLD AND SANAM ICECREAM | POS & Restaurant OS",
  description: "PIZZA WORLD AND SANAM ICECREAM - Premium Fast Food & Icecream POS System.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col bg-slate-950 text-slate-200 selection:bg-orange-600 selection:text-white"
        suppressHydrationWarning
      >
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
