/**
 * Configuration des catégories de codex
 */

export const CATEGORIES = {

    'armees-astartes': {
        id: 'armees-astartes',
        name: 'Armées Astartes',
        slug: 'armees-astartes',
        color: '#4b42c7ff',
        image: 'armees-astartes.png'
    },
    'armees-imperiales': {
        id: 'armees-imperiales',
        name: 'Armées Impériales',
        slug: 'armees-imperiales',
        color: '#c0a000',
        image: 'armees-imperiales.png'
    }, 
    'armees-xenos': {
        id: 'armees-xenos',
        name: 'Armées Xénos',
        slug: 'armees-xenos',
        color: '#6100be',
        image: 'armees-xenos.png'
    },
    'armees-chaos': {
        id: 'armees-chaos',
        name: 'Armées du Chaos',
        slug: 'armees-chaos',
        color: '#b30000',
        image: 'armees-chaos.png'
    }
};

// Helper pour récupérer une catégorie
export const getCategory = (slug) => {
    return CATEGORIES[slug] || {
        id: slug,
        name: slug,
        slug: slug,
        color: '#666',
        image: 'default.png'
    };
};

// Helper pour lister toutes les catégories
export const getAllCategories = () => {
    return Object.values(CATEGORIES);
};