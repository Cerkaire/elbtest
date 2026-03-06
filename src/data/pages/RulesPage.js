import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Chip,
    Card,
    CardContent,
    TextField,
    InputAdornment,
    Divider,
    Badge
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import rulesData from '../rules.json';

function RulesPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedKeywords, setSelectedKeywords] = useState({
        kwtable: [],
        kwgenerique: [],
        kwphase: [],
        kwunite: [],
        kwspeciale: []
    });

    // Extraire les mots-clés uniques par catégorie
    const extractUniqueKeywords = (category) => {
        return Array.from(
            new Set(rulesData.flatMap((rule) => rule[category] || []))
        ).filter(Boolean).sort((a, b) => a.localeCompare(b, 'fr'));
    };

    const keywordCategories = [
        {
            id: 'kwtable',
            label: 'Table & Décors',
            keywords: extractUniqueKeywords('kwtable'),
            color: '#1976d2'
        },
        {
            id: 'kwgenerique',
            label: 'Générique',
            keywords: extractUniqueKeywords('kwgenerique'),
            color: '#2e7d32'
        },
        {
            id: 'kwphase',
            label: "Types d'actions",
            keywords: extractUniqueKeywords('kwphase'),
            color: '#ed6c02'
        },
        {
            id: 'kwunite',
            label: 'Unités',
            keywords: extractUniqueKeywords('kwunite'),
            color: '#9c27b0'
        },
        {
            id: 'kwspeciale',
            label: 'Armes & Spéciales',
            keywords: extractUniqueKeywords('kwspeciale'),
            color: '#d32f2f'
        }
    ];

    // Gérer la sélection/désélection des mots-clés
    const handleKeywordToggle = (category, keyword) => {
        setSelectedKeywords(prev => {
            const categoryKeywords = prev[category];
            const isSelected = categoryKeywords.includes(keyword);

            return {
                ...prev,
                [category]: isSelected
                    ? categoryKeywords.filter(k => k !== keyword)
                    : [...categoryKeywords, keyword]
            };
        });
    };

    // Rassembler tous les mots-clés sélectionnés
    const allSelectedKeywords = Object.values(selectedKeywords).flat();

    // Filtrer les règles
    const filteredRules = rulesData.filter(rule => {
        // Filtre par recherche textuelle
        const matchesSearch = searchTerm === '' ||
            [rule.title1, rule.title2, rule.title3, rule.content]
                .filter(Boolean)
                .some(text => text.toLowerCase().includes(searchTerm.toLowerCase()));

        // Filtre par mots-clés (toutes les catégories confondues)
        const matchesKeywords = allSelectedKeywords.length === 0 ||
            allSelectedKeywords.every(keyword =>
                Object.keys(selectedKeywords).some(category =>
                    rule[category]?.includes(keyword)
                )
            );

        return matchesSearch && matchesKeywords;
    });

    // Fonction pour surligner les mots-clés dans le contenu
    const highlightKeywords = (content, keywords) => {
        if (!keywords.length) return content;

        const escapedKeywords = keywords.map(kw =>
            kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        );
        const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');

        return content.replace(
            regex,
            '<mark style="background-color: #ffeb3b; font-weight: 600; padding: 2px 4px; border-radius: 2px;">$1</mark>'
        );
    };

    // Réinitialiser tous les filtres
    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedKeywords({
            kwtable: [],
            kwgenerique: [],
            kwphase: [],
            kwunite: [],
            kwspeciale: []
        });
    };

    const hasActiveFilters = searchTerm !== '' || allSelectedKeywords.length > 0;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
                <Typography
                    variant="h3"
                    component="h1"
                    gutterBottom
                    sx={{
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #1976d2 30%, #2e7d32 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    📖 Règles simplifiées
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Recherchez et filtrez les règles par mots-clés
                </Typography>
            </Box>

            {/* Barre de recherche */}
            <TextField
                fullWidth
                placeholder="Rechercher dans les règles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    )
                }}
            />

            {/* Filtres par catégorie */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FilterListIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">
                        Filtrer par mots-clés
                    </Typography>
                    {hasActiveFilters && (
                        <Chip
                            label="Réinitialiser les filtres"
                            onClick={clearAllFilters}
                            size="small"
                            color="error"
                            sx={{ ml: 2 }}
                        />
                    )}
                </Box>

                {keywordCategories.map(category => {
                    const selectedCount = selectedKeywords[category.id].length;

                    return (
                        <Accordion
                            key={category.id}
                            defaultExpanded={false}
                            sx={{ mb: 1 }}
                        >
                            <AccordionSummary
                                expandIcon={<ExpandMoreIcon />}
                                sx={{
                                    borderLeft: `4px solid ${category.color}`,
                                    '&:hover': {
                                        backgroundColor: 'action.hover'
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography fontWeight="medium">
                                        {category.label}
                                    </Typography>
                                    {selectedCount > 0 && (
                                        <Badge
                                            badgeContent={selectedCount}
                                            color="primary"
                                        />
                                    )}
                                </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {category.keywords.map(keyword => (
                                        <Chip
                                            key={keyword}
                                            label={keyword}
                                            size="small"
                                            onClick={() => handleKeywordToggle(category.id, keyword)}
                                            color={selectedKeywords[category.id].includes(keyword) ? 'primary' : 'default'}
                                            sx={{
                                                cursor: 'pointer',
                                                '&:hover': {
                                                    transform: 'scale(1.05)',
                                                    transition: 'transform 0.2s'
                                                }
                                            }}
                                        />
                                    ))}
                                </Box>
                            </AccordionDetails>
                        </Accordion>
                    );
                })}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Résultats */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="h6" color="text.secondary">
                    {filteredRules.length} règle{filteredRules.length > 1 ? 's' : ''} trouvée{filteredRules.length > 1 ? 's' : ''}
                </Typography>
            </Box>

            {/* Liste des règles filtrées */}
            <Box>
                {filteredRules.length === 0 ? (
                    <Card sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            Aucune règle ne correspond à vos critères
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Essayez de modifier vos filtres ou votre recherche
                        </Typography>
                    </Card>
                ) : (
                    filteredRules.map((rule, index) => (
                        <Card
                            key={index}
                            sx={{
                                mb: 2,
                                transition: 'all 0.3s ease',
                                '&:hover': {
                                    boxShadow: 4,
                                    transform: 'translateY(-2px)'
                                }
                            }}
                        >
                            <CardContent>
                                {/* Titre principal */}
                                {rule.title1 && (
                                    <Typography
                                        variant="h5"
                                        component="h2"
                                        gutterBottom
                                        sx={{
                                            fontWeight: 'bold',
                                            color: 'primary.main'
                                        }}
                                    >
                                        {rule.title1}
                                    </Typography>
                                )}

                                {/* Titre supérieur (breadcrumb) */}
                                {rule.titlesup && (
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{
                                            display: 'block',
                                            mb: 1,
                                            fontStyle: 'italic'
                                        }}
                                    >
                                        {rule.titlesup} →
                                    </Typography>
                                )}

                                {/* Titre secondaire */}
                                {rule.title2 && (
                                    <Typography
                                        variant="h6"
                                        color="text.primary"
                                        gutterBottom
                                        sx={{ fontWeight: 'medium' }}
                                    >
                                        {rule.title2}
                                    </Typography>
                                )}

                                {/* Titre tertiaire */}
                                {rule.title3 && (
                                    <Typography
                                        variant="subtitle1"
                                        color="text.secondary"
                                        gutterBottom
                                    >
                                        {rule.title3}
                                    </Typography>
                                )}

                                <Divider sx={{ my: 2 }} />

                                {/* Contenu avec surlignage */}
                                <Typography
                                    variant="body1"
                                    component="div"
                                    dangerouslySetInnerHTML={{
                                        __html: highlightKeywords(rule.content, allSelectedKeywords)
                                    }}
                                    sx={{
                                        '& ul': { pl: 3 },
                                        '& li': { mb: 1 },
                                        '& strong': { fontWeight: 600 },
                                        '& p': { mb: 1 }
                                    }}
                                />

                                {/* Afficher les mots-clés de la règle */}
                                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {Object.entries(rule).map(([key, value]) => {
                                        if (!key.startsWith('kw') || !Array.isArray(value) || value.length === 0) {
                                            return null;
                                        }

                                        return value.map(keyword => (
                                            <Chip
                                                key={keyword}
                                                label={keyword}
                                                size="small"
                                                variant="outlined"
                                                sx={{
                                                    fontSize: '0.7rem',
                                                    height: '20px'
                                                }}
                                            />
                                        ));
                                    })}
                                </Box>
                            </CardContent>
                        </Card>
                    ))
                )}
            </Box>
        </Container>
    );
}

export default RulesPage;