export type Section = {
    id: string;
    title: string;
    slug: string;
    category: 'reglement' | 'rp' | 'guide';
    is_visible?: boolean;
    order_index: number;
    icon?: string;
    created_at?: string;
};

export type Article = {
    id: string;
    section_id: string;
    title: string;
    slug: string;
    content: string | null;
    is_published: boolean;
    order_index: number;
    created_at?: string;
    updated_at?: string;
};

export type NavigationItem = Section & {
    articles: Article[];
};
