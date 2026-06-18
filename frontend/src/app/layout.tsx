import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { RootLayoutClient } from "@/components/root-layout-client";
import { getServerSiteCms } from "@/lib/site-cms-server";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cms = await getServerSiteCms();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const title = cms.seoTitle || cms.brandName;
  const description = cms.seoDescription || cms.brandSubtitle;
  const ogImage = cms.heroImageUrl || cms.logoImageUrl;

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    keywords: cms.seoKeywords,
    applicationName: cms.brandName,
    authors: [{ name: cms.brandName }],
    creator: cms.brandName,
    publisher: cms.brandName,
    alternates: {
      canonical: "/"
    },
    icons: {
      icon: "/IconTitle.svg",
      shortcut: "/IconTitle.svg",
      apple: "/IconTitle.svg"
    },
    openGraph: {
      title,
      description,
      url: "/",
      siteName: cms.brandName,
      locale: "id_ID",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: cms.heroImageAlt || cms.brandName
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    },
    category: "healthcare"
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cms = await getServerSiteCms();

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          id="clinic-extension-attribute-cleaner"
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var patterns = [/^bis_/, /^__processed_/];
                function shouldRemove(name) {
                  return patterns.some(function (pattern) { return pattern.test(name); });
                }
                function cleanElement(element) {
                  if (!element || !element.attributes) return;
                  for (var i = element.attributes.length - 1; i >= 0; i -= 1) {
                    var name = element.attributes[i].name;
                    if (shouldRemove(name)) element.removeAttribute(name);
                  }
                }
                function cleanTree(root) {
                  if (!root) return;
                  if (root.nodeType === 1) cleanElement(root);
                  if (root.querySelectorAll) {
                    root.querySelectorAll("*").forEach(cleanElement);
                  }
                }
                cleanTree(document.documentElement);
                if (window.MutationObserver) {
                  var observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                      if (mutation.type === "attributes") cleanElement(mutation.target);
                      if (mutation.type === "childList") {
                        mutation.addedNodes.forEach(cleanTree);
                      }
                    });
                  });
                  observer.observe(document.documentElement, { attributes: true, childList: true, subtree: true });
                  window.__clinicExtensionAttributeCleaner = observer;
                }
              })();
            `
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <RootLayoutClient initialCms={cms}>{children}</RootLayoutClient>
        <Analytics />
      </body>
    </html>
  );
}
