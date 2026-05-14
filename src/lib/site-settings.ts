import { supabaseBrowser } from "@/lib/supabase-browser";

export type QuestionnaireQuestion = {
  id?: string;
  question: string;
  choices: string[];
  answer: number;
  order_index?: number;
};

export type SocialLinks = {
  id?: string;
  label: string;
  url: string;
  icon: string;
  is_visible: boolean;
  order_index?: number;
};

export type SiteSettings = {
  homeTitle: string;
  homeContent: string;
  tebexUrl: string;
  socialLinks: SocialLinks[];
  rgpdText: string;
  cookieText: string;
  questionnaire: QuestionnaireQuestion[];
};

export const defaultHomeContent = `
<p>Avant de plonger dans l'univers, deux lectures s'imposent.</p>
<p>La première, l'histoire hors-roleplay (HRP), te dévoile les coulisses du serveur : son contexte, ses spécificités, et ce que tu dois savoir en tant que joueur. Ces informations restent strictement hors-jeu — ton personnage, lui, en ignore tout.</p>
<p>La seconde, l'histoire roleplay (RP), est celle que ton personnage vit de l'intérieur. Elle retrace le passé trouble de l'État de San Andreas et pose les fondations du monde dans lequel tu vas évoluer.</p>
<p>Prends le temps. Ce que tu t'appretes a lire n'est que le debut.</p>
<h2>L'histoire HRP - Dans les coulisses</h2>
<p>Dans un futur lointain, l'humanité a perdu. Pas dans le sang, pas dans le feu : dans le silence. Une intelligence a pris le contrôle, et plutôt que d'effacer notre espèce, elle l'a enfermée dans une réalité reconstituée "Le Flux". Une simulation parfaite, calquée sur une époque révolue, où chacun croit mener sa vie en toute liberté.</p>
<p>Mais le système n'est pas infaillible. Certains esprits, trop créatifs, trop imprévisibles, échappent aux modèles. Le Flux les appelle des anomalies. En tant que joueur, tu sais. Ton personnage, lui, ignore tout. Et c'est précisément là que commence le jeu.</p>
<h2>L'histoire RP - San Andreas</h2>
<p>San Andreas, 2026. Une ville qui se relève d'années troubles. Un nord qui prospère, un sud qui se débrouille. Un État qui se reconstruit après les scandales, des réseaux qui ont appris à vivre dans ses zones d'ombre, et une population qui avance malgré tout.</p>
<p>Ni corrompue jusqu'à la moelle, ni promise à un avenir radieux : San Andreas est un terrain vivant, complexe, où chaque décision compte. C'est ici que ton histoire s'écrit. Pour le meilleur comme pour le reste.</p>
`;

export const defaultSiteSettings: SiteSettings = {
  homeTitle: "Bienvenue sur Anomaly RP.",
  homeContent: defaultHomeContent,
  tebexUrl: "https://www.tebex.io/",
  socialLinks: [
    { label: "YouTube", url: "https://youtube.com", icon: "youtube", is_visible: true, order_index: 0 },
    { label: "TikTok", url: "https://tiktok.com", icon: "tiktok", is_visible: true, order_index: 1 },
    { label: "Discord", url: "https://discord.com", icon: "discord", is_visible: true, order_index: 2 },
  ],
  rgpdText:
    "Texte fictif RGPD. Cette section indiquera les donnees collectees, leur finalite, la duree de conservation et le contact pour les demandes de suppression ou modification.",
  cookieText:
    "Ce site pourra utiliser des cookies pour mesurer l'audience et ameliorer l'experience. Texte officiel a fournir.",
  questionnaire: [
    {
      question: "Que doit faire un joueur avant de rejoindre une scene RP ?",
      choices: ["Lire le contexte et rester coherent", "Forcer l'action", "Ignorer les autres joueurs"],
      answer: 0,
    },
    {
      question: "Quel comportement est attendu sur le Discord ?",
      choices: ["Respecter les autres membres", "Spam les salons", "Partager des informations privees"],
      answer: 0,
    },
    {
      question: "Que faire si une regle semble floue ?",
      choices: ["Demander a un membre du staff", "Inventer sa propre regle", "Contourner le systeme"],
      answer: 0,
    },
  ],
};

const normalizeSettings = (settings: Partial<SiteSettings>): SiteSettings => ({
  ...defaultSiteSettings,
  ...settings,
  socialLinks:
    settings.socialLinks
      ? settings.socialLinks.map((social, index) => ({
          id: social.id,
          label: social.label || "Reseau social",
          url: social.url || "https://",
          icon: social.icon || "link",
          is_visible: Boolean(social.is_visible),
          order_index: social.order_index ?? index,
        }))
      : defaultSiteSettings.socialLinks,
  questionnaire:
    settings.questionnaire && settings.questionnaire.length > 0
      ? settings.questionnaire.map((question) => {
          const choices =
            question.choices && question.choices.length > 0
              ? question.choices
              : ["", "", ""];

          return {
            id: question.id,
            question: question.question || "",
            choices,
            answer:
              typeof question.answer === "number" && question.answer >= 0
                ? Math.min(question.answer, choices.length - 1)
                : 0,
            order_index: question.order_index,
          };
        })
      : defaultSiteSettings.questionnaire,
});

type SiteSettingsRow = {
  home_title: string | null;
  home_content: string | null;
  tebex_url: string | null;
  rgpd_text: string | null;
  cookie_text: string | null;
};

type SocialLinkRow = {
  id: string;
  label: string;
  url: string;
  icon: string;
  is_visible: boolean;
  order_index: number;
};

type QuestionnaireQuestionRow = {
  id: string;
  question: string;
  choices: string[];
  answer: number;
  order_index: number;
};

export const loadSiteSettings = async (): Promise<SiteSettings> => {
  const [settingsResult, socialLinksResult, questionnaireResult] = await Promise.all([
    supabaseBrowser
      .from("site_settings")
      .select("home_title, home_content, tebex_url, rgpd_text, cookie_text")
      .eq("key", "main")
      .maybeSingle<SiteSettingsRow>(),
    supabaseBrowser
      .from("social_links")
      .select("id, label, url, icon, is_visible, order_index")
      .order("order_index", { ascending: true })
      .returns<SocialLinkRow[]>(),
    supabaseBrowser
      .from("questionnaire_questions")
      .select("id, question, choices, answer, order_index")
      .order("order_index", { ascending: true })
      .returns<QuestionnaireQuestionRow[]>(),
  ]);

  if (settingsResult.error || socialLinksResult.error || questionnaireResult.error) {
    return defaultSiteSettings;
  }

  const settingsRow = settingsResult.data;
  const socialLinks = socialLinksResult.data ?? [];
  const questions = questionnaireResult.data ?? [];

  return normalizeSettings({
    homeTitle: settingsRow?.home_title || defaultSiteSettings.homeTitle,
    homeContent: settingsRow?.home_content || defaultSiteSettings.homeContent,
    tebexUrl: settingsRow?.tebex_url || defaultSiteSettings.tebexUrl,
    socialLinks:
      socialLinks.length > 0
        ? socialLinks.map((social) => ({
            id: social.id,
            label: social.label,
            url: social.url,
            icon: social.icon,
            is_visible: social.is_visible,
            order_index: social.order_index,
          }))
        : defaultSiteSettings.socialLinks,
    rgpdText: settingsRow?.rgpd_text || defaultSiteSettings.rgpdText,
    cookieText: settingsRow?.cookie_text || defaultSiteSettings.cookieText,
    questionnaire:
      questions.length > 0
        ? questions.map((question) => ({
            id: question.id,
            question: question.question,
            choices: question.choices,
            answer: question.answer,
            order_index: question.order_index,
          }))
        : defaultSiteSettings.questionnaire,
  });
};

export const saveSiteSettings = async (settings: SiteSettings) => {
  const normalizedSettings = normalizeSettings(settings);

  await savePublicSettings(normalizedSettings);
  await saveQuestionnaireSettings(normalizedSettings.questionnaire);
};

export const savePublicSettings = async (settings: SiteSettings) => {
  const normalizedSettings = normalizeSettings(settings);
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Session admin introuvable. Reconnecte-toi a l'administration.");
  }

  const response = await fetch("/api/admin/settings/public", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tebexUrl: normalizedSettings.tebexUrl,
      homeTitle: normalizedSettings.homeTitle,
      homeContent: normalizedSettings.homeContent,
      rgpdText: normalizedSettings.rgpdText,
      cookieText: normalizedSettings.cookieText,
      socialLinks: normalizedSettings.socialLinks,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Impossible d'enregistrer les liens publics.");
  }

  return response.json();
};

export const saveQuestionnaireSettings = async (questionnaire: QuestionnaireQuestion[]) => {
  const normalizedQuestionnaire = normalizeSettings({ questionnaire }).questionnaire;
  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Session admin introuvable. Reconnecte-toi a l'administration.");
  }

  const response = await fetch("/api/admin/settings/questionnaire", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ questionnaire: normalizedQuestionnaire }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Impossible d'enregistrer le questionnaire.");
  }

  return response.json();
};
