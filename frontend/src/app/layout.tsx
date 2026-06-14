import type { Metadata } from "next";
import { RootLayoutClient } from "@/components/root-layout-client";
import { getServerSiteCms } from "@/lib/site-cms-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getServerSiteCms();

  return {
    title: cms.seoTitle || cms.brandName,
    description: cms.seoDescription,
    keywords: cms.seoKeywords,
    icons: {
      icon: cms.faviconUrl || "/IconTitle.svg"
    }
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cms = await getServerSiteCms();

  return (
    <html lang="id" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <RootLayoutClient initialCms={cms}>{children}</RootLayoutClient>
      </body>
    </html>
  );
}
