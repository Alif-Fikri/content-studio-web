import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function StudioLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = typeof data?.claims?.email === "string" ? data.claims.email : null;

  return (
    <Providers>
      <div className="flex min-h-dvh flex-col md:flex-row">
        <Sidebar email={email} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </Providers>
  );
}
