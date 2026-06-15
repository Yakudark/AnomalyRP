import path from "node:path";
import { readFile } from "node:fs/promises";

export const calculFiles = [
  {
    id: "portail",
    label: "Portail",
    description: "Hub de selection des modules.",
    filename: "index.html",
    href: "/calcul/index.html",
  },
  {
    id: "ventes",
    label: "Ventes Drive",
    description: "Calcul du total des ventes Drive.",
    filename: "ventes.html",
    href: "/calcul/ventes.html",
  },
  {
    id: "salaire",
    label: "Paies Auto",
    description: "Consolidation des salaires par employe.",
    filename: "salaire.html",
    href: "/calcul/salaire.html",
  },
];

export async function loadCalculTools() {
  return calculFiles;
}

export async function loadCalculHtml(filename: string) {
  return readFile(
    path.join(process.cwd(), "src", "components", "calcul", filename),
    "utf8",
  );
}
