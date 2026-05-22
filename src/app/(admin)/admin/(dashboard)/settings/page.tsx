import Link from "next/link";
import { Home, Images, Link as LinkIcon, ScrollText } from "lucide-react";

const settingLinks = [
  {
    title: "Accueil",
    description: "Modifier le titre, le texte riche et les images de l'accueil.",
    href: "/admin/home",
    icon: Home,
  },
  {
    title: "Liens publics",
    description: "Modifier Tebex et les reseaux sociaux affiches en bas de page.",
    href: "/admin/links",
    icon: LinkIcon,
  },
  {
    title: "Mentions legales",
    description: "Ajouter, modifier ou supprimer le texte des mentions legales.",
    href: "/admin/legal",
    icon: ScrollText,
  },
  {
    title: "Galerie",
    description: "Ajouter, masquer ou supprimer les images de la galerie.",
    href: "/admin/gallery",
    icon: Images,
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Administration</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Parametres</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Les reglages principaux ont maintenant chacun leur page dediee dans le menu.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {settingLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group border border-white/10 bg-[#111217] p-5 transition-colors hover:border-red-400/50"
          >
            <item.icon className="h-6 w-6 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-white transition-colors group-hover:text-red-300">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
