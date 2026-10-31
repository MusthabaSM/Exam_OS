import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import { CapacitorHardwareBackButton } from "@/components/CapacitorHardwareBackButton";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Exam Preparation OS",
  description: "Organize your competitive exam preparation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col">
        <CapacitorHardwareBackButton />
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
