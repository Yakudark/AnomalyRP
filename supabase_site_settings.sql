-- Tables pour les parametres publics, les liens et le questionnaire.
-- A executer une seule fois dans Supabase > SQL Editor.

CREATE TABLE IF NOT EXISTS site_settings (
    key TEXT PRIMARY KEY DEFAULT 'main',
    home_title TEXT NOT NULL DEFAULT 'Bienvenue sur Anomaly RP.',
    home_content TEXT NOT NULL DEFAULT '<p>Avant de plonger dans l''univers, deux lectures s''imposent.</p><p>La premiere, l''histoire hors-roleplay (HRP), te devoile les coulisses du serveur : son contexte, ses specificites, et ce que tu dois savoir en tant que joueur. Ces informations restent strictement hors-jeu - ton personnage, lui, en ignore tout.</p><p>La seconde, l''histoire roleplay (RP), est celle que ton personnage vit de l''interieur. Elle retrace le passe trouble de l''Etat de San Andreas et pose les fondations du monde dans lequel tu vas evoluer.</p><p>Prends le temps. Ce que tu t''appretes a lire n''est que le debut.</p><h2>L''histoire HRP - Dans les coulisses</h2><p>Dans un futur lointain, l''humanite a perdu. Pas dans le sang, pas dans le feu : dans le silence. Une intelligence a pris le controle, et plutot que d''effacer notre espece, elle l''a enfermee dans une realite reconstituee "Le Flux". Une simulation parfaite, calquee sur une epoque revolue, ou chacun croit mener sa vie en toute liberte.</p><p>Mais le systeme n''est pas infaillible. Certains esprits, trop creatifs, trop imprevisibles, echappent aux modeles. Le Flux les appelle des anomalies. En tant que joueur, tu sais. Ton personnage, lui, ignore tout. Et c''est precisement la que commence le jeu.</p><h2>L''histoire RP - San Andreas</h2><p>San Andreas, 2026. Une ville qui se releve d''annees troubles. Un nord qui prospere, un sud qui se debrouille. Un Etat qui se reconstruit apres les scandales, des reseaux qui ont appris a vivre dans ses zones d''ombre, et une population qui avance malgre tout.</p><p>Ni corrompue jusqu''a la moelle, ni promise a un avenir radieux : San Andreas est un terrain vivant, complexe, ou chaque decision compte. C''est ici que ton histoire s''ecrit. Pour le meilleur comme pour le reste.</p>',
    tebex_url TEXT NOT NULL DEFAULT 'https://www.tebex.io/',
    rgpd_text TEXT NOT NULL DEFAULT 'Texte fictif RGPD. Cette section indiquera les donnees collectees, leur finalite, la duree de conservation et le contact pour les demandes de suppression ou modification.',
    cookie_text TEXT NOT NULL DEFAULT 'Ce site pourra utiliser des cookies pour mesurer l''audience et ameliorer l''experience. Texte officiel a fournir.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS social_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'link',
    is_visible BOOLEAN NOT NULL DEFAULT true,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS questionnaire_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    choices JSONB NOT NULL DEFAULT '[]'::jsonb,
    answer INTEGER NOT NULL DEFAULT 0,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO site_settings (key)
VALUES ('main')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS home_title TEXT NOT NULL DEFAULT 'Bienvenue sur Anomaly RP.';
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS home_content TEXT NOT NULL DEFAULT '<p>Avant de plonger dans l''univers, deux lectures s''imposent.</p><p>La premiere, l''histoire hors-roleplay (HRP), te devoile les coulisses du serveur : son contexte, ses specificites, et ce que tu dois savoir en tant que joueur. Ces informations restent strictement hors-jeu - ton personnage, lui, en ignore tout.</p><p>La seconde, l''histoire roleplay (RP), est celle que ton personnage vit de l''interieur. Elle retrace le passe trouble de l''Etat de San Andreas et pose les fondations du monde dans lequel tu vas evoluer.</p><p>Prends le temps. Ce que tu t''appretes a lire n''est que le debut.</p><h2>L''histoire HRP - Dans les coulisses</h2><p>Dans un futur lointain, l''humanite a perdu. Pas dans le sang, pas dans le feu : dans le silence. Une intelligence a pris le controle, et plutot que d''effacer notre espece, elle l''a enfermee dans une realite reconstituee "Le Flux". Une simulation parfaite, calquee sur une epoque revolue, ou chacun croit mener sa vie en toute liberte.</p><p>Mais le systeme n''est pas infaillible. Certains esprits, trop creatifs, trop imprevisibles, echappent aux modeles. Le Flux les appelle des anomalies. En tant que joueur, tu sais. Ton personnage, lui, ignore tout. Et c''est precisement la que commence le jeu.</p><h2>L''histoire RP - San Andreas</h2><p>San Andreas, 2026. Une ville qui se releve d''annees troubles. Un nord qui prospere, un sud qui se debrouille. Un Etat qui se reconstruit apres les scandales, des reseaux qui ont appris a vivre dans ses zones d''ombre, et une population qui avance malgre tout.</p><p>Ni corrompue jusqu''a la moelle, ni promise a un avenir radieux : San Andreas est un terrain vivant, complexe, ou chaque decision compte. C''est ici que ton histoire s''ecrit. Pour le meilleur comme pour le reste.</p>';
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'site-images',
    'site-images',
    true,
    20971520,
    ARRAY['image/gif', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO social_links (label, url, icon, is_visible, order_index)
SELECT 'YouTube', 'https://youtube.com', 'youtube', true, 0
WHERE NOT EXISTS (SELECT 1 FROM social_links);

INSERT INTO social_links (label, url, icon, is_visible, order_index)
SELECT 'TikTok', 'https://tiktok.com', 'tiktok', true, 1
WHERE (SELECT COUNT(*) FROM social_links) = 1;

INSERT INTO social_links (label, url, icon, is_visible, order_index)
SELECT 'Discord', 'https://discord.com', 'discord', true, 2
WHERE (SELECT COUNT(*) FROM social_links) = 2;

INSERT INTO questionnaire_questions (question, choices, answer, order_index)
SELECT 'Que doit faire un joueur avant de rejoindre une scene RP ?',
       '["Lire le contexte et rester coherent", "Forcer l''action", "Ignorer les autres joueurs"]'::jsonb,
       0,
       0
WHERE NOT EXISTS (SELECT 1 FROM questionnaire_questions);

INSERT INTO questionnaire_questions (question, choices, answer, order_index)
SELECT 'Quel comportement est attendu sur le Discord ?',
       '["Respecter les autres membres", "Spam les salons", "Partager des informations privees"]'::jsonb,
       0,
       1
WHERE (SELECT COUNT(*) FROM questionnaire_questions) = 1;

INSERT INTO questionnaire_questions (question, choices, answer, order_index)
SELECT 'Que faire si une regle semble floue ?',
       '["Demander a un membre du staff", "Inventer sa propre regle", "Contourner le systeme"]'::jsonb,
       0,
       2
WHERE (SELECT COUNT(*) FROM questionnaire_questions) = 2;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE questionnaire_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture publique des parametres" ON site_settings;
CREATE POLICY "Lecture publique des parametres"
ON site_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Modification des parametres par les utilisateurs connectes" ON site_settings;
CREATE POLICY "Modification des parametres par les utilisateurs connectes"
ON site_settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Lecture publique des reseaux sociaux" ON social_links;
CREATE POLICY "Lecture publique des reseaux sociaux"
ON social_links
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Modification des reseaux sociaux par les utilisateurs connectes" ON social_links;
CREATE POLICY "Modification des reseaux sociaux par les utilisateurs connectes"
ON social_links
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Lecture publique du questionnaire" ON questionnaire_questions;
CREATE POLICY "Lecture publique du questionnaire"
ON questionnaire_questions
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Modification du questionnaire par les utilisateurs connectes" ON questionnaire_questions;
CREATE POLICY "Modification du questionnaire par les utilisateurs connectes"
ON questionnaire_questions
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Lecture publique des images du site" ON storage.objects;
CREATE POLICY "Lecture publique des images du site"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-images');
