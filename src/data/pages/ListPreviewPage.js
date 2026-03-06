import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useArmyList } from '../../contexts/ArmyListContext';
import caracData from '../stats/carac.json';

const trouverStats = (factionName, uniteName) => {
    const factionEntry = caracData.find(
        f => f.faction.toLowerCase() === factionName.toLowerCase()
    );
    if (!factionEntry) return null;

    const stats = factionEntry.stat;

    // Exact match
    let found = stats.find(s => s.Nom === uniteName);
    if (found) return found;

    // Case-insensitive match
    const uniteNameLower = uniteName.toLowerCase();
    found = stats.find(s => s.Nom.toLowerCase() === uniteNameLower);
    if (found) return found;

    // Includes match (either direction)
    found = stats.find(
        s => s.Nom.toLowerCase().includes(uniteNameLower) ||
             uniteNameLower.includes(s.Nom.toLowerCase())
    );
    return found || null;
};

function ListPreviewPage({ codex }) {
    const { codexId } = useParams();
    const navigate = useNavigate();
    const { liste, calculerCoutTotal } = useArmyList();

    const [selectedFormation, setSelectedFormation] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [tiebreakStates, setTiebreakStates] = useState({});

    const codexColor = codex.codex.color || '#4a7c59';
    const valeurStrategique = codex.codex.regles_speciales?.valeur_strategique || '—';

    const calculerCoutFormation = (formation) => {
        let cout = formation.cout;

        formation.unites?.forEach(unite => {
            unite.options?.forEach(option => {
                if (option.itemSelectionne) {
                    const items = trouverItemsDansCodex(formation.formationId, unite.uniteId, option.optionId);
                    const item = items.find(i => i.id === option.itemSelectionne);
                    if (item) cout += item.cout;
                }
            });
        });

        formation.ameliorations?.forEach(amelio => {
            const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
            if (amelioDef) {
                if (amelioDef.cout_par_unite) {
                    cout += amelioDef.cout * (amelio.quantite || 1);
                } else {
                    cout += amelioDef.cout;
                }
            }
        });

        return cout;
    };

    const trouverItemsDansCodex = (formationId, uniteId, optionId) => {
        for (const groupe of codex.groupes) {
            const formation = groupe.formations.find(f => f.id === formationId);
            if (formation) {
                const unite = formation.unites?.find(u => u.id === uniteId);
                if (unite && unite.options) {
                    const option = unite.options.find(o => o.id === optionId);
                    if (option) return option.items || [];
                }
            }
        }
        return [];
    };

    const handleOpenDetail = (formation) => {
        setSelectedFormation(formation);
        setDialogOpen(true);
    };

    const handleCloseDetail = () => {
        setDialogOpen(false);
        setSelectedFormation(null);
    };

    const handleTiebreakChange = (formationId, value) => {
        setTiebreakStates(prev => ({
            ...prev,
            [formationId]: value
        }));
    };

    const calculateTiebreakValue = (formation) => {
        const baseValue = calculerCoutFormation(formation);
        const state = tiebreakStates[formation.id];

        if (!state || state === 'NA') return 0;

        switch (state) {
            case 'completement_detruite':
            case 'demoralise_moins_de_moitie':
                return baseValue;
            case 'demoralise_plus_de_moitie':
            case 'moins_de_moitie_force':
                return Math.round(baseValue / 2);
            default:
                return 0;
        }
    };

    const totalTiebreak = liste.formations.reduce((total, formation) => {
        return total + calculateTiebreakValue(formation);
    }, 0);

    return (
        <Container maxWidth="lg" sx={{ py: 2, pb: 8 }}>
            {/* Header */}
            <Card sx={{ mb: 2, backgroundColor: codexColor, color: 'white' }}>
                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <IconButton
                            size="small"
                            sx={{ color: 'white', mr: 1 }}
                            onClick={() => navigate(`/builder/${codexId}`)}
                        >
                            <ArrowBackIcon />
                        </IconButton>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                            {codex.codex.name}
                        </Typography>
                    </Box>
                    <Grid container spacing={1}>
                        <Grid item xs={4}>
                            <Typography variant="body2">
                                <b>{calculerCoutTotal()} pts</b>
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2">
                                Formations : <b>{liste.formations.length}</b>
                            </Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography variant="body2">
                                Stratégie : <b>{valeurStrategique}</b>
                            </Typography>
                        </Grid>
                        {totalTiebreak > 0 && (
                            <Grid item xs={12}>
                                <Box sx={{ mt: 0.5, p: 0.5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                                    <Typography variant="body2">
                                        <b>Total Tie Break : {totalTiebreak} pts</b>
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>

            {/* Grid of formations */}
            {liste.formations.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="textSecondary">
                        Aucune formation dans la liste.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={1}>
                    {liste.formations.map(formation => {
                        const cout = calculerCoutFormation(formation);
                        const tiebreakValue = calculateTiebreakValue(formation);

                        return (
                            <Grid item xs={6} key={formation.id}>
                                <Card
                                    sx={{
                                        cursor: 'pointer',
                                        height: '100%',
                                        '&:hover': { boxShadow: 4 },
                                        borderLeft: `4px solid ${codexColor}`,
                                        ...(tiebreakStates[formation.id] && tiebreakStates[formation.id] !== 'NA' && {
                                            backgroundColor: '#fff3e0'
                                        })
                                    }}
                                    onClick={() => handleOpenDetail(formation)}
                                >
                                    <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontSize: '0.8rem', lineHeight: 1.2 }}>
                                            {formation.nom}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {cout} pts
                                        </Typography>
                                        {tiebreakValue > 0 && (
                                            <Typography variant="caption" color="warning.main" sx={{ display: 'block' }}>
                                                TB: {tiebreakValue} pts
                                            </Typography>
                                        )}

                                        {/* Compact unit list */}
                                        <Box sx={{ mt: 0.5 }}>
                                            {formation.unites?.filter(u => !u.remplace).map(unite => (
                                                <React.Fragment key={unite.id}>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1.3, color: unite.est_remplacement ? 'primary.main' : 'text.secondary' }}
                                                    >
                                                        {unite.nombre > 1 ? `${unite.nombre}x ` : ''}{unite.nom}
                                                    </Typography>
                                                    {unite.options?.filter(o => o.itemSelectionne).map(option => {
                                                        const items = trouverItemsDansCodex(formation.formationId, unite.uniteId, option.optionId);
                                                        const item = items.find(i => i.id === option.itemSelectionne);
                                                        if (!item) return null;
                                                        return (
                                                            <Typography key={option.optionId} variant="caption" sx={{ display: 'block', fontSize: '0.6rem', lineHeight: 1.2, color: 'text.disabled', pl: 0.5 }}>
                                                                ↳ {item.name}{item.cout > 0 ? ` (+${item.cout})` : ''}
                                                            </Typography>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                            {formation.ameliorations?.map(amelio => {
                                                const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                                                if (!amelioDef) return null;
                                                const quantite = amelio.quantite || 1;
                                                return (
                                                    <Typography
                                                        key={amelio.id}
                                                        variant="caption"
                                                        sx={{ display: 'block', fontSize: '0.65rem', lineHeight: 1.3, color: 'secondary.main', fontStyle: 'italic' }}
                                                    >
                                                        + {quantite > 1 ? `${quantite}x ` : ''}{amelioDef.name}
                                                    </Typography>
                                                );
                                            })}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Detail Dialog */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDetail}
                fullWidth
                maxWidth="sm"
            >
                {selectedFormation && (
                    <>
                        <DialogContent>
                            <Typography variant="h6" gutterBottom>
                                {selectedFormation.nom}
                                {selectedFormation.varianteName && (
                                    <Chip label={selectedFormation.varianteName} size="small" color="secondary" sx={{ ml: 1 }} />
                                )}
                            </Typography>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                {calculerCoutFormation(selectedFormation)} pts
                            </Typography>

                            {/* Units */}
                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                Composition :
                            </Typography>
                            <List dense disablePadding>
                                {selectedFormation.unites?.filter(u => !u.remplace).map(unite => (
                                    <React.Fragment key={unite.id}>
                                        <ListItem sx={{ py: 0, pl: 2 }}>
                                            <ListItemText
                                                primary={`${unite.nombre > 1 ? `${unite.nombre}x ` : ''}${unite.nom}`}
                                                primaryTypographyProps={{
                                                    variant: 'body2',
                                                    color: unite.est_remplacement ? 'primary.main' : 'text.primary'
                                                }}
                                            />
                                        </ListItem>
                                        {unite.options?.filter(o => o.itemSelectionne).map(option => {
                                            const items = trouverItemsDansCodex(selectedFormation.formationId, unite.uniteId, option.optionId);
                                            const item = items.find(i => i.id === option.itemSelectionne);
                                            if (!item) return null;
                                            return (
                                                <ListItem key={option.optionId} sx={{ py: 0, pl: 4 }}>
                                                    <ListItemText
                                                        primary={`↳ ${option.nom} : ${item.name}${item.cout > 0 ? ` (+${item.cout} pts)` : ''}`}
                                                        primaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                                                    />
                                                </ListItem>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </List>

                            {/* Upgrades */}
                            {selectedFormation.ameliorations?.length > 0 && (
                                <>
                                    <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                                        Améliorations :
                                    </Typography>
                                    <Box sx={{ pl: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                        {selectedFormation.ameliorations.map(amelio => {
                                            const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                                            if (!amelioDef) return null;
                                            const quantite = amelio.quantite || 1;
                                            const coutTotal = amelioDef.cout * quantite;
                                            return (
                                                <Chip
                                                    key={amelio.id}
                                                    label={`${quantite > 1 ? `${quantite}x ` : ''}${amelioDef.name} (${coutTotal} pts)`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            );
                                        })}
                                    </Box>
                                </>
                            )}

                            {/* Caractéristiques */}
                            {(() => {
                                const factionName = codex.codex.faction;
                                const seen = new Set();
                                const unitesAvecStats = (selectedFormation.unites || [])
                                    .filter(u => !u.remplace)
                                    .filter(u => {
                                        if (seen.has(u.uniteId)) return false;
                                        seen.add(u.uniteId);
                                        return true;
                                    })
                                    .flatMap(u => {
                                        const optionsSelectionnees = (u.options || [])
                                            .filter(o => o.itemSelectionne)
                                            .map(option => {
                                                const items = trouverItemsDansCodex(selectedFormation.formationId, u.uniteId, option.optionId);
                                                const item = items.find(i => i.id === option.itemSelectionne);
                                                if (!item) return null;
                                                const itemStats = trouverStats(factionName, item.name);
                                                return { optionNom: option.nom, itemNom: item.name, cout: item.cout, stats: itemStats };
                                            })
                                            .filter(Boolean);
                                        // Si l'unité a des tags, chercher les stats pour chaque tag
                                        if (u.tags?.length) {
                                            return u.tags
                                                .map(tag => {
                                                    const s = trouverStats(factionName, tag);
                                                    return s ? { key: `${u.uniteId}_${tag}`, nom: tag, stats: s, optionsSelectionnees: [] } : null;
                                                })
                                                .filter(Boolean);
                                        }
                                        const s = trouverStats(factionName, u.nom);
                                        return s ? [{ key: u.uniteId, nom: u.nom, stats: s, optionsSelectionnees }] : [];
                                    });

                                // Ajouter les unités des améliorations
                                (selectedFormation.ameliorations || []).forEach(amelio => {
                                    const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                                    // Unités fixes de l'amélioration
                                    if (amelioDef?.unites) {
                                        amelioDef.unites.forEach(au => {
                                            if (seen.has(au.id)) return;
                                            seen.add(au.id);
                                            const stats = trouverStats(factionName, au.name);
                                            if (stats) {
                                                unitesAvecStats.push({ key: au.id, nom: au.name, stats });
                                            }
                                        });
                                    }
                                    // Commandant avec choix (Capitaine, Maître de Chapitre, etc.)
                                    if (amelio.choixName) {
                                        const choixKey = `${amelio.ameliorationId}_${amelio.choixId}`;
                                        if (!seen.has(choixKey)) {
                                            seen.add(choixKey);
                                            const stats = trouverStats(factionName, amelio.choixName);
                                            if (stats) {
                                                unitesAvecStats.push({ key: choixKey, nom: amelio.choixName, stats });
                                            }
                                        }
                                    }
                                    // Unités issues d'une composition (ex: Blindés T'au)
                                    if (amelio.unitesComposition?.length) {
                                        amelio.unitesComposition.forEach(u => {
                                            const nomsRecherche = u.tags?.length ? u.tags : [u.nom];
                                            nomsRecherche.forEach(nom => {
                                                const key = `${amelio.ameliorationId}_${nom}`;
                                                if (seen.has(key)) return;
                                                seen.add(key);
                                                const stats = trouverStats(factionName, nom);
                                                if (stats) {
                                                    unitesAvecStats.push({ key, nom, stats, optionsSelectionnees: [] });
                                                }
                                            });
                                        });
                                    }
                                });

                                // Dédoublonner par nom de stat (stats.Nom)
                                const seenNoms = new Set();
                                const unitesUniques = unitesAvecStats.filter(u => {
                                    if (seenNoms.has(u.stats.Nom)) return false;
                                    seenNoms.add(u.stats.Nom);
                                    return true;
                                });

                                if (unitesUniques && unitesUniques.length > 0) {
                                    return (
                                        <>
                                            <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 2 }}>
                                                Caractéristiques :
                                            </Typography>
                                            <TableContainer sx={{ mt: 0.5 }}>
                                                <Table size="small" sx={{ '& td, & th': { px: 0.5, py: 0.25, fontSize: '0.75rem' } }}>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Vit.</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Blind.</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>CC</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>FF</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {unitesUniques.map(({ key, stats, optionsSelectionnees }) => (
                                                            <React.Fragment key={key}>
                                                                <TableRow>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>{stats.Nom}</TableCell>
                                                                    <TableCell>{stats.Type}</TableCell>
                                                                    <TableCell>{stats.Vitesse}</TableCell>
                                                                    <TableCell>{stats.Blindage}</TableCell>
                                                                    <TableCell>{stats.CC}</TableCell>
                                                                    <TableCell>{stats.FF}</TableCell>
                                                                </TableRow>
                                                                {stats.armes?.length > 0 && (
                                                                    <TableRow>
                                                                        <TableCell colSpan={6} sx={{ pl: 1, py: 0 }}>
                                                                            <Table size="small" sx={{ '& td': { px: 0.5, py: 0, fontSize: '0.7rem', border: 'none' } }}>
                                                                                <TableBody>
                                                                                    {stats.armes.map((arme, idx) => (
                                                                                        <TableRow key={idx}>
                                                                                            <TableCell sx={{ fontStyle: 'italic', width: '40%' }}>{arme.Arme}</TableCell>
                                                                                            <TableCell sx={{ width: '25%' }}>{arme.Portée}</TableCell>
                                                                                            <TableCell>{arme["Puissance de feu"]}</TableCell>
                                                                                        </TableRow>
                                                                                    ))}
                                                                                </TableBody>
                                                                            </Table>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                                {stats.Notes && (
                                                                    <TableRow>
                                                                        <TableCell colSpan={6} sx={{ fontStyle: 'italic', color: 'text.secondary', fontSize: '0.7rem' }}>
                                                                            {stats.Notes}
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                                {optionsSelectionnees?.map((opt, idx) => (
                                                                    <React.Fragment key={idx}>
                                                                        <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                                                            <TableCell sx={{ fontStyle: 'italic', color: 'text.secondary', pl: 1.5 }}>
                                                                                ↳ {opt.itemNom}{opt.cout > 0 ? ` (+${opt.cout} pts)` : ''}
                                                                            </TableCell>
                                                                            {opt.stats ? (
                                                                                <>
                                                                                    <TableCell sx={{ color: 'text.secondary' }}>{opt.stats.Type}</TableCell>
                                                                                    <TableCell sx={{ color: 'text.secondary' }}>{opt.stats.Vitesse}</TableCell>
                                                                                    <TableCell sx={{ color: 'text.secondary' }}>{opt.stats.Blindage}</TableCell>
                                                                                    <TableCell sx={{ color: 'text.secondary' }}>{opt.stats.CC}</TableCell>
                                                                                    <TableCell sx={{ color: 'text.secondary' }}>{opt.stats.FF}</TableCell>
                                                                                </>
                                                                            ) : (
                                                                                <TableCell colSpan={5} />
                                                                            )}
                                                                        </TableRow>
                                                                        {opt.stats?.armes?.length > 0 && (
                                                                            <TableRow sx={{ backgroundColor: '#fafafa' }}>
                                                                                <TableCell colSpan={6} sx={{ pl: 2, py: 0 }}>
                                                                                    <Table size="small" sx={{ '& td': { px: 0.5, py: 0, fontSize: '0.7rem', border: 'none' } }}>
                                                                                        <TableBody>
                                                                                            {opt.stats.armes.map((arme, i) => (
                                                                                                <TableRow key={i}>
                                                                                                    <TableCell sx={{ fontStyle: 'italic', width: '40%', color: 'text.secondary' }}>{arme.Arme}</TableCell>
                                                                                                    <TableCell sx={{ width: '25%', color: 'text.secondary' }}>{arme.Portée}</TableCell>
                                                                                                    <TableCell sx={{ color: 'text.secondary' }}>{arme["Puissance de feu"]}</TableCell>
                                                                                                </TableRow>
                                                                                            ))}
                                                                                        </TableBody>
                                                                                    </Table>
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        )}
                                                                    </React.Fragment>
                                                                ))}
                                                            </React.Fragment>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </>
                                    );
                                }
                                return null;
                            })()}

                            {/* Tie Break */}
                            <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                                <FormControl component="fieldset" fullWidth>
                                    <FormLabel component="legend">Tie Break</FormLabel>
                                    <RadioGroup
                                        value={tiebreakStates[selectedFormation.id] || ''}
                                        onChange={(e) => handleTiebreakChange(selectedFormation.id, e.target.value)}
                                        sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.85rem' } }}
                                    >
                                        <FormControlLabel value="NA" control={<Radio size="small" />} label="N/A" />
                                        <FormControlLabel value="completement_detruite" control={<Radio size="small" />} label="Complètement détruite" />
                                        <FormControlLabel value="demoralise_moins_de_moitie" control={<Radio size="small" />} label="Démoralisé - moins de 1/2 force" />
                                        <FormControlLabel value="demoralise_plus_de_moitie" control={<Radio size="small" />} label="Démoralisé + plus de 1/2 force" />
                                        <FormControlLabel value="moins_de_moitie_force" control={<Radio size="small" />} label="Moins de 1/2 force" />
                                    </RadioGroup>
                                </FormControl>

                                {tiebreakStates[selectedFormation.id] && tiebreakStates[selectedFormation.id] !== 'NA' && (
                                    <Box sx={{ mt: 1, p: 0.5, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
                                        <Typography variant="body2">
                                            <b>Valeur Tie Break : {calculateTiebreakValue(selectedFormation)} pts</b>
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDetail}>Fermer</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </Container>
    );
}

export default ListPreviewPage;
