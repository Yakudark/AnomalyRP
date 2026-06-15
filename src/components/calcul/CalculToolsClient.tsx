"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, CreditCard, LayoutGrid, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalculTool = {
  id: string;
  label: string;
  description: string;
  href: string;
};

const toolIcons = {
  portail: LayoutGrid,
  ventes: ShoppingCart,
  salaire: CreditCard,
};

export function CalculToolsClient({ tools }: { tools: CalculTool[] }) {
  const [activeToolId, setActiveToolId] = useState(tools[0]?.id ?? "");
  const activeTool = useMemo(
    () => tools.find((tool) => tool.id === activeToolId) ?? tools[0],
    [activeToolId, tools],
  );

  if (!activeTool) {
    return (
      <div className="rounded-md border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
        Aucun fichier de calcul disponible.
      </div>
    );
  }

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/"
            className="mb-3 inline-flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-white"
          >
            &lt; Retour accueil
          </Link>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            <Calculator className="h-8 w-8 text-red-400" />
            Calculs
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Modules internes de calcul et d&apos;analyse.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tools.map((tool) => {
            const Icon = toolIcons[tool.id as keyof typeof toolIcons] ?? Calculator;
            const active = tool.id === activeTool.id;

            return (
              <Button
                key={tool.id}
                type="button"
                variant={active ? "default" : "outline"}
                className={cn(
                  "gap-2",
                  active
                    ? "bg-red-500 text-white hover:bg-red-500/90"
                    : "border-white/10 bg-black/20 text-white hover:bg-white/5",
                )}
                onClick={() => setActiveToolId(tool.id)}
              >
                <Icon className="h-4 w-4" />
                {tool.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="rounded-md border border-white/10 bg-[#050805] shadow-2xl">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-sm font-medium text-white">{activeTool.label}</p>
          <p className="text-xs text-muted-foreground">{activeTool.description}</p>
        </div>
        <iframe
          key={activeTool.id}
          title={activeTool.label}
          src={activeTool.href}
          className="h-[calc(100vh-260px)] min-h-[680px] w-full bg-black"
        />
      </div>
    </div>
  );
}
