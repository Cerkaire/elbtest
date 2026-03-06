const ASSETS_BASE = process.env.PUBLIC_URL + '/assets/images';

export const getImagePath = {
    // Logo de codex
    logo: (filename) => `${ASSETS_BASE}/logos/${filename}`,

    // Image de catégorie (reçoit maintenant un slug direct)
    category: (slug) => `${ASSETS_BASE}/categories/${slug}.png`,

    // Image par défaut si l'image n'existe pas
    placeholder: () => `${ASSETS_BASE}/placeholder.png`
};

// Optionnel : valider qu'une image existe
export const imageExists = async (url) => {
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok;
    } catch {
        return false;
    }
};