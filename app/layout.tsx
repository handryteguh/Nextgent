import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mina-UI — CRM + WhatsApp Follow-up",
  description: "Dashboard CRM + WhatsApp auto follow-up (FU1/FU2/FU3)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} antialiased`}>
      <body className="min-h-screen bg-base text-slate-200">{children}</body>
    </html>
  );
}