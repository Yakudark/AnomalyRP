import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { defaultSiteSettings } from "@/lib/site-settings";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type SiteSettingsRow = {
  rgpd_text: string | null;
};

export default async function MentionsLegalesPage() {
  const supabase = createSupabaseClient();
  const { data } = await supabase
    .from("site_settings")
    .select("rgpd_text")
    .eq("key", "main")
    .maybeSingle<SiteSettingsRow>();

  const legalText = data?.rgpd_text ?? defaultSiteSettings.rgpdText;

  return (
    <div className="anomaly-panel anomaly-outline max-w-4xl space-y-8 p-6 md:p-8">
      <Link href="/">
        <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-primary hover:bg-white/5 hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Retour a l&apos;accueil
        </Button>
      </Link>

      <div className="space-y-3 border-b border-white/10 pb-6">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <ShieldCheck className="h-8 w-8 text-primary" />
          Mentions légales
        </h1>
      </div>

      {legalText.replace(/<[^>]*>?/gm, "").trim() ? (
        <div
          className="prose prose-invert max-w-none text-[#dde3da]
            prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
            prose-h2:mt-8 prose-h2:text-2xl prose-h2:text-primary
            prose-h3:mt-6 prose-h3:text-xl
            prose-p:my-4 prose-p:leading-7 prose-p:text-[#dde3da]
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:my-4 prose-li:my-2
            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2
            prose-code:rounded prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-primary
            prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/30"
          dangerouslySetInnerHTML={{ __html: legalText }}
        />
      ) : (
        <p className="text-sm leading-7 text-muted-foreground">Aucune mention légale n&apos;est renseignée pour le moment.</p>
      )}
    </div>
  );
}
