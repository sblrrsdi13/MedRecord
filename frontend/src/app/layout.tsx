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
      icon:"/IconTitle.svg"
    }
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
      </body>
    </html>
  );
}
