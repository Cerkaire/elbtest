import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Card,
    CardContent,
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getImagePath } from '../../utils/images';
import { getCategory } from '../../config/categories';

// Grouper les codex par catégorie
function groupCodexByCategory(codexList) {
    const grouped = {};
    codexList.forEach((codex) => {
        const categorySlug = codex.categorie || 'autres';
        if (!grouped[categorySlug]) grouped[categorySlug] = [];
        grouped[categorySlug].push(codex);
    });
    return grouped;
}

function CodexSelectorPage({ onSelectCodex }) {
    const [codexList, setCodexList] = useState([]);
    const [expandedCategory, setExpandedCategory] = useState(null);

    useEffect(() => {
        // Charger la liste des codex disponibles
        const loadCodexList = () => {
            const codexes = [

                {
                    id: 'adeptus_astartes',
                    name: 'Adeptus Astartes',
                    categorie: 'armees-astartes',
                    faction: 'Adeptus Astartes',
                    color: '#1223a6ff',
                    version: '1.2',
                    logo: 'asta.png'
                },
                {
                    id: 'legion_dacier',
                    name: "Légion d'Acier",
                    faction: 'Impérium',
                    categorie: 'armees-imperiales',
                    color: '#686000',
                    version: '1.2.1',
                    logo: 'steel.png'
                },
                {
                    id: 'orks_ghazghkull',
                    name: 'Orks de Ghazghkull',
                    faction: 'Orks',
                    categorie: 'armees-xenos',
                    color: '#236d44',
                    version: '1.5.1',
                    logo: 'ork.png'
                },
                {
                    id: 'empire_tau',
                    name: 'Empire T\'au',
                    faction: 'Tau',
                    categorie: 'armees-xenos',
                    color: '#0080c0',
                    version: 'REV-1.3.1',
                    logo: 'tau.png'
                },
                {
                    id: 'eldars_noirs',
                    name: 'Eldars Noirs',
                    faction: 'Eldars Noirs',
                    categorie: 'armees-xenos',
                    color: '#6100be',
                    version: '1.2',
                    logo: 'en.png'
                },
                {
                    id: 'eldars_biel_tan',
                    name: 'Eldars de Biel-Tan',
                    categorie: 'armees-xenos',
                    faction: 'Eldars',
                    color: '#4aa612',
                    version: '1.4',
                    logo: 'eld.png'
                },
                {
                    id: 'tyranides',
                    name: 'Tyranides',
                    faction: 'Tyranides',
                    categorie: 'armees-xenos',
                    color: '#96009e',
                    version: '1.2',
                    logo: 'ty.png'
                },
                {
                    id: 'gargants_orkimedes',
                    name: 'Gargants d\'Orkimedes',
                    faction: 'Orks',
                    categorie: 'armees-xenos',
                    color: '#4a7c59',
                    version: 'REV-1.0',
                    logo: 'ork.png'
                },
                {
                    id: 'blood_angels',
                    name: 'Blood Angels',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#a20000',
                    version: '1.0.1',
                    logo: 'ba.png'
                },
                {
                    id: 'dark_angels',
                    name: 'Dark Angels',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#1b611d',
                    version: '1.0',
                    logo: 'da.png'
                },
                {
                    id: 'imperial_fist',
                    name: 'Imperial Fist',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#aba646',
                    version: '1.1',
                    logo: 'if.png'
                },
                {
                    id: 'raven_guard',
                    name: 'Raven Guard',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#52637d',
                    version: '1.2',
                    logo: 'rg.png'
                },
                {
                    id: 'black_templar',
                    name: 'Black Templar',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#2c3036',
                    version: '1.2',
                    logo: 'bt.png'
                },
                {
                    id: 'space_wolves',
                    name: 'Space Wolves',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#505a5d',
                    version: '1.0',
                    logo: 'wolf.png'
                },
                {
                    id: 'white_scars',
                    name: 'White Scars',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#818181',
                    version: '1.0',
                    logo: 'white.png'
                },
                {
                    id: 'salamanders',
                    name: 'Salamanders',
                    faction: 'Astartes',
                    categorie: 'armees-astartes',
                    color: '#1a4d1a',
                    version: '1.1',
                    logo: 'salam.png'
                },
                {
                    id: 'necrons',
                    name: 'Nécrons',
                    faction: 'Nécrons',
                    categorie: 'armees-xenos',
                    color: '#696969',
                    version: '1.3',
                    logo: 'nec.png'
                },
                {
                    id: 'squats',
                    name: 'Squats',
                    faction: 'Squat',
                    categorie: 'armees-xenos',
                    color: '#18524c',
                    version: '1.2.2',
                    logo: 'squat.png'
                },
                {
                    id: 'death_korps_krieg',
                    name: 'Death Korps of Krieg',
                    faction: 'Impérium',
                    categorie: 'armees-imperiales',
                    color: '#30545e',
                    version: '1.3.2',
                    logo: 'dkok.png'
                },
                {
                    id: 'paras_elyseens',
                    name: 'Paras Élyséens',
                    faction: 'Impérium',
                    categorie: 'armees-imperiales',
                    color: '#1e3f59',
                    version: '1.2.1',
                    logo: 'para.png'
                },
                {
                    id: 'premier_nes_vostroyens',
                    name: 'Premier-nés Vostroyens',
                    faction: 'Impérium',
                    categorie: 'armees-imperiales',
                    color: '#610505',
                    version: '1.3',
                    logo: 'vostro.png'
                },
                {
                    id: 'adeptus_sororitas',
                    name: 'Adeptus Sororitas',
                    faction: 'Impérium',
                    categorie: 'armees-imperiales',
                    color: '#610505',
                    version: '1.0.1',
                    logo: 'sororita.png'
                },
                {
                    id: 'adeptus_arbites',
                    name: 'Adeptus Arbites',
                    faction: 'Impérium',
                    categorie: 'armees-imperiales',
                    color: '#2a3a8c',
                    version: '1.1.1',
                    logo: 'arbites.png'
                },
                {
                    id: 'chevaliers_imperiaux',
                    name: 'Chevaliers Impériaux',
                    faction: 'Titanicus',
                    categorie: 'armees-imperiales',
                    color: '#004b58',
                    version: '1.4',
                    logo: 'chevalier.png'
                },
                {
                    id: 'adeptus_mechanicus',
                    name: 'Adeptus Mechanicus',
                    faction: 'Titanicus',
                    categorie: 'armees-imperiales',
                    color: '#610505',
                    version: '1.5',
                    logo: 'mechanicus.png'
                },
                {
                    id: 'legion_titanique',
                    name: 'Légion Titanique',
                    faction: 'Titanicus',
                    categorie: 'armees-imperiales',
                    color: '#a75502',
                    version: '1.4.1',
                    logo: 'titan.png'
                },
                {
                    id: 'black_legion',
                    name: 'Black Légion',
                    faction: 'Chaos',
                    categorie: 'armees-chaos',
                    color: '#3B2F2F',
                    version: '1.6.1',
                    logo: 'bl.png'
                },
                {
                    id: 'thousand_sons',
                    name: 'Thousand Sons',
                    faction: 'Chaos',
                    categorie: 'armees-chaos',
                    color: '#79e8d9',
                    version: '1.2',
                    logo: 'ts.png'
                },
                {
                    id: 'death_guard',
                    name: 'Death Guard',
                    faction: 'Chaos',
                    categorie: 'armees-chaos',
                    color: '#588300',
                    version: '1.2.1',
                    logo: 'dg.png'
                },
                {
                    id: 'world_eaters',
                    name: 'World Eaters',
                    faction: 'Chaos',
                    categorie: 'armees-chaos',
                    color: '#ac2001',
                    version: '1.2',
                    logo: 'we.png'
                },
                {
                    id: 'iron_warriors',
                    name: 'Iron Warriors',
                    faction: 'Chaos',
                    categorie: 'armees-chaos',
                    color: '#3C4744',
                    version: '1.3',
                    logo: 'iw.png'
                },
                {
                    id: 'egares_et_damnes',
                    name: 'Égarés et Damnés',
                    faction: 'Chaos',
                    categorie: 'armees-chaos',
                    color: '#086b6f',
                    version: '1.6.1',
                    logo: 'eed.png'
                }
            ];
            setCodexList(codexes);
        };

        loadCodexList();
    }, []);

    const groupedCodex = groupCodexByCategory(codexList);
    const handleAccordionChange = (category) => (event, isExpanded) => {
        setExpandedCategory(isExpanded ? category : null);
    };

    return (
        <Container
            maxWidth={false}
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: 4,
                px: 2
            }}
        >
            <Box sx={{ width: '100%', maxWidth: '1400px' }}>
                {/* Header */}
                <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 6 } }}>
                    <Typography
                        component="h1"
                        gutterBottom
                        sx={{
                            fontWeight: 'bold',
                            fontSize: { xs: '2rem', sm: '3.75rem' },
                            background: 'linear-gradient(45deg, #4a7c59 30%, #0080c0 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        Epic List Builder
                    </Typography>
                    <Typography variant={{ xs: 'body1', sm: 'h5' }} color="text.secondary">
                        Sélectionnez votre codex
                    </Typography>
                </Box>

                {/* Grille de catégories */}
                <Grid container spacing={3} justifyContent="center">
                    {Object.entries(groupedCodex).map(([categorySlug, codexes]) => {
                        const category = getCategory(categorySlug); // ✅ Récupérer les infos de la catégorie

                        return (
                            <Grid key={categorySlug} item xs={12} md={6} lg={4}>
                                <Accordion
                                    elevation={3}
                                    defaultExpanded={false}
                                    sx={{
                                        borderRadius: 2,
                                        '&:before': { display: 'none' },
                                        overflow: 'hidden'
                                    }}
                                >
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        sx={{
                                            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${getImagePath.category(category.slug)})`,
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center',
                                            backgroundSize: 'cover',
                                            minHeight: { xs: '70px', sm: '120px' },
                                            transition: 'all 0.3s ease',
                                            filter: 'grayscale(50%)',
                                            '&:hover': {
                                                filter: 'grayscale(0%)',
                                                transform: 'scale(1.02)'
                                            }
                                        }}
                                    >
                                        <Box sx={{ width: '100%', textAlign: 'center', py: { xs: 1, sm: 2 } }}>
                                            <Typography
                                                sx={{
                                                    fontSize: { xs: '1rem', sm: '2.125rem' },
                                                    fontWeight: 'bold',
                                                    color: 'white',
                                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                                                }}
                                            >
                                                {category.name.toUpperCase()}
                                            </Typography>
                                        </Box>
                                    </AccordionSummary>

                                    <AccordionDetails sx={{ p: { xs: 1, sm: 2 } }}>
                                        <Grid container spacing={{ xs: 1, sm: 2 }}>
                                            {codexes.map((codex) => (
                                                <Grid item xs={6} sm={6} key={codex.id}>
                                                    <Card
                                                        onClick={() => onSelectCodex(codex.id)}
                                                        sx={{
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease',
                                                            '&:hover': {
                                                                transform: 'translateY(-4px)',
                                                                boxShadow: 6,
                                                                borderColor: codex.color
                                                            },
                                                            border: '2px solid transparent',
                                                            borderRadius: 2
                                                        }}
                                                    >
                                                        <CardContent
                                                            sx={{
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                alignItems: 'center',
                                                                gap: { xs: 0.75, sm: 2 },
                                                                p: { xs: 1.5, sm: 3 },
                                                                '&:last-child': { pb: { xs: 1.5, sm: 3 } }
                                                            }}
                                                        >
                                                            {/* Logo */}
                                                            <Box
                                                                component="img"
                                                                src={getImagePath.logo(codex.logo)}
                                                                alt={codex.name}
                                                                sx={{
                                                                    width: { xs: '52px', sm: '100px' },
                                                                    height: { xs: '52px', sm: '100px' },
                                                                    objectFit: 'contain',
                                                                    transition: 'transform 0.3s ease',
                                                                    '&:hover': {
                                                                        transform: 'scale(1.15) rotate(5deg)'
                                                                    }
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.src = getImagePath.placeholder();
                                                                }}
                                                            />

                                                            {/* Nom du codex */}
                                                            <Box sx={{ textAlign: 'center', width: '100%' }}>
                                                                <Typography
                                                                    component="div"
                                                                    sx={{
                                                                        fontWeight: 'bold',
                                                                        color: codex.color,
                                                                        fontSize: { xs: '0.75rem', sm: '1.25rem' },
                                                                        lineHeight: 1.2
                                                                    }}
                                                                >
                                                                    {codex.name}
                                                                </Typography>

                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{ fontStyle: 'italic', display: { xs: 'none', sm: 'block' } }}
                                                                >
                                                                    Version {codex.version}
                                                                </Typography>
                                                            </Box>

                                                            {/* Badge de couleur */}
                                                            <Box
                                                                sx={{
                                                                    width: '100%',
                                                                    height: '3px',
                                                                    backgroundColor: codex.color,
                                                                    borderRadius: 1
                                                                }}
                                                            />
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Footer */}
                <Box sx={{ textAlign: 'center', mt: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                        Epic Armageddon List Builder v5.0
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
}

export default CodexSelectorPage;