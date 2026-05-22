-- 1. Nettoyage (au cas où)
DROP TABLE IF EXISTS articles;
DROP TABLE IF EXISTS sections;

-- 2. Table des Sections (Catégories dynamiques créées par l'admin)
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT, 
    -- NOUVEAU: Le "Pilier" auquel appartient cette section
    category TEXT NOT NULL CHECK (category IN ('reglement', 'rp', 'guide')), 
    is_visible BOOLEAN DEFAULT true NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table des Articles
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    parent_article_id UUID REFERENCES articles(id) ON DELETE SET NULL, -- AJOUTÉE ICI
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content TEXT, 
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(section_id, slug)
);

-- ... (RLS Policies restent identiques) ...

-- 6. SEED DATA (Données de test mises à jour)

-- Sections
INSERT INTO sections (title, slug, description, category, icon, order_index) VALUES
-- Pôle Règlements
('Règlement Général', 'reglement-general', 'Les bases.', 'reglement', 'Gavel', 1),
('Règlement Illégal', 'reglement-illegal', 'Pour les criminels.', 'reglement', 'ShieldAlert', 2),

-- Pôle Documents RP
('Code Pénal', 'code-penal', 'La loi.', 'rp', 'Scale', 1),
('Procédures LSPD', 'procedures-lspd', 'Manuels de police.', 'rp', 'Siren', 2),

-- Pôle Guides
('Débuter sur le serveur', 'debuter', 'Les premières étapes.', 'guide', 'Map', 1),
('Système de Drogue', 'drogues', 'Comment cuisiner.', 'guide', 'Beaker', 2);

-- Articles pour "Règlement Général"
-- Note: Le bloc DO précédent doit être adapté pour chercher le bon slug ('reglement-general')
DO $$
DECLARE
    reglement_id UUID;
BEGIN
    SELECT id INTO reglement_id FROM sections WHERE slug = 'reglement-general';

    INSERT INTO articles (section_id, title, slug, content, is_published, order_index) VALUES
    (reglement_id, 'Concepts de Base', 'concepts-de-base', '
        <h2>Le Roleplay (RP)</h2>
        <p>Le Roleplay est un jeu de rôle...</p>
    ', true, 1);
END $$;
