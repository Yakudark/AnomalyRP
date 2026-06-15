import { CalculToolsClient } from "@/components/calcul/CalculToolsClient";
import { loadCalculTools } from "@/lib/calcul-tools";

export const dynamic = "force-dynamic";

export default async function CalculPage() {
  const tools = await loadCalculTools();

  return <CalculToolsClient tools={tools} />;
}
