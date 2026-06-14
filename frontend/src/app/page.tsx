import { LandingPageClient } from "@/components/landing-page-client";
import { getServerSiteCms } from "@/lib/site-cms-server";

export default async function HomePage() {
  const cms = await getServerSiteCms();

  return <LandingPageClient initialCms={cms} />;
}
