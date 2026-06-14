import type { Metadata } from "next";
import { RootLayoutClient } from "@/components/root-layout-client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Clinic Management",
  description: "Sistem rekam medis klinik modern",
  icons: {
    icon: "/IconTitle.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}