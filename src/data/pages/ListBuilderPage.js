import React, { useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Alert,
    AlertTitle
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useArmyList } from '../../contexts/ArmyListContext';
import VarianteSelectorDialog from '../../components/VarianteSelectorDialog';
import CompositionPersonnaliseeDialog from '../../components/CompositionPersonnaliseeDialog';
import QuantiteSelectorDialog from '../../components/QuantiteSelectorDialog';

function ListBuilderPage({ codex }) {
    const {
        liste,
        validation,
        validator,
        ajouterFormation,
        supprimerFormation,
        selectionnerItem,
        ajouterAmelioration,
        supprimerAmelioration,
        calculerCoutTotal
    } = useArmyList();

    // ✅ États pour les dialogs
    const [groupeExpand, setGroupeExpand] = useState(null);
    const [formationExpanded, setFormationExpanded] = useState({});

    const [varianteSelectorOpen, setVarianteSelectorOpen] = useState(false);
    const [currentFormationForVariante, setCurrentFormationForVariante] = useState(null);

    const [compositionDialogOpen, setCompositionDialogOpen] = useState(false);
    const [currentFormationForComposition, setCurrentFormationForComposition] = useState(null);

    const [quantiteSelectorOpen, setQuantiteSelectorOpen] = useState(false);
    const [currentAmeliorationForQuantite, setCurrentAmeliorationForQuantite] = useState(null);
    const [currentFormationForQuantite, setCurrentFormationForQuantite] = useState(null);

    // ✅ Fonctions helpers
    const toggleFormation = (formationId) => {
        setFormationExpanded(prev => ({
            ...prev,
            [formationId]: !prev[formationId]
        }));
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

    const trouverAmeliorationsDansCodex = (formationId) => {
        for (const groupe of codex.groupes) {
            const formation = groupe.formations.find(f => f.id === formationId);
            if (formation && formation.ameliorations) {
                return formation.ameliorations.map(amelioId =>
                    codex.ameliorations.find(a => a.id === amelioId)
                ).filter(Boolean);
            }
        }
        return [];
    };

    const calculerCoutFormation = (formation) => {
        let cout = formation.cout;

        // Ajouter coût des items
        formation.unites?.forEach(unite => {
            unite.options?.forEach(option => {
                if (option.itemSelectionne) {
                    const items = trouverItemsDansCodex(formation.formationId, unite.uniteId, option.optionId);
                    const item = items.find(i => i.id === option.itemSelectionne);
                    if (item) cout += item.cout;
                }
            });
        });

        // Ajouter coût des améliorations
        formation.ameliorations?.forEach(amelio => {
            const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
            if (amelioDef) {
                const quantite = amelio.quantite || 1;
                cout += amelioDef.cout * quantite;
            }
        });

        return cout;
    };

    // ✅ Handlers pour les dialogs
    const handleConfirmVariante = (varianteId) => {
        if (currentFormationForVariante) {
            ajouterFormation(currentFormationForVariante.id, varianteId);
            setCurrentFormationForVariante(null);
        }
    };

    const handleConfirmComposition = (unites) => {
        if (currentFormationForComposition) {
            ajouterFormation(currentFormationForComposition.id, null, unites);
            setCurrentFormationForComposition(null);
        }
    };

    const handleConfirmQuantite = (quantite) => {
        if (currentFormationForQuantite && currentAmeliorationForQuantite) {
            ajouterAmelioration(
                currentFormationForQuantite.id,
                currentAmeliorationForQuantite.id,
                quantite
            );
            setCurrentAmeliorationForQuantite(null);
            setCurrentFormationForQuantite(null);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* ========== HEADER ========== */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {codex.codex.name}
                </Typography>
                <Typography variant="h5" color="textSecondary">
                    {liste.nom}
                </Typography>
                <Chip label={`${calculerCoutTotal()} pts`} color="primary" sx={{ mt: 1 }} />
            </Box>

            {/* ========== VALIDATION ALERTS ========== */}
            {validation?.errors?.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    <AlertTitle>Erreurs de validation</AlertTitle>
                    {validation.errors.map((err, i) => (
                        <div key={i}>• {err.error}</div>
                    ))}
                </Alert>
            )}

            {validation?.warnings?.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>Avertissements</AlertTitle>
                    {validation.warnings.map((warn, i) => (
                        <div key={i}>• {warn.error}</div>
                    ))}
                </Alert>
            )}

            {validation?.infos?.length > 0 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {validation.infos.map((info, i) => (
                        <div key={i}>• {info.info}</div>
                    ))}
                </Alert>
            )}

            {/* ========== AJOUTER UNE FORMATION ========== */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Ajouter une formation
                </Typography>

                {codex.groupes.map(groupe => (
                    <Accordion
                        key={groupe.id}
                        expanded={groupeExpand === groupe.id}
                        onChange={() => setGroupeExpand(groupeExpand === groupe.id ? null : groupe.id)}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography>{groupe.name}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {groupe.formations.map(formation => {
                                    // ✅ Vérifier si la formation peut être ajoutée
                                    const canAdd = validator?.canAddFormation(liste, formation.id);
                                    const isDisabled = canAdd && !canAdd.valid;

                                    return (
                                        <Button
                                            key={formation.id}
                                            variant="outlined"
                                            startIcon={<AddIcon />}
                                            disabled={isDisabled}
                                            onClick={() => {
                                                // Vérifier composition personnalisée
                                                if (formation.composition_personnalisee) {
                                                    if (formation.composition_personnalisee.type === 'choix_multiples') {
                                                        setCurrentFormationForComposition(formation);
                                                        setCompositionDialogOpen(true);
                                                    }
                                                }
                                                // Vérifier variantes
                                                else if (formation.variantes && formation.variantes.length > 0) {
                                                    setCurrentFormationForVariante(formation);
                                                    setVarianteSelectorOpen(true);
                                                }
                                                // Formation simple
                                                else {
                                                    ajouterFormation(formation.id);
                                                }
                                            }}
                                            size="small"
                                            sx={{
                                                ...(isDisabled && {
                                                    opacity: 0.5,
                                                    cursor: 'not-allowed'
                                                })
                                            }}
                                        >
                                            {formation.name} ({formation.cout} pts)
                                            {isDisabled && (
                                                <Chip
                                                    label="Indisponible"
                                                    size="small"
                                                    color="error"
                                                    sx={{ ml: 1 }}
                                                />
                                            )}
                                        </Button>
                                    );
                                })}
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Paper>

            {/* ========== LISTE DES FORMATIONS ========== */}
            <Box>
                <Typography variant="h6" gutterBottom>
                    Mes formations ({liste.formations.length})
                </Typography>

                {liste.formations.length === 0 && (
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography color="textSecondary">
                            Aucune formation. Ajoutez-en une ci-dessus.
                        </Typography>
                    </Paper>
                )}

                {liste.formations.map(formation => (
                    <Accordion
                        key={formation.id}
                        expanded={!!formationExpanded[formation.id]}
                        onChange={() => toggleFormation(formation.id)}
                        sx={{ mb: 1 }}
                    >
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            sx={{
                                bgcolor: 'action.hover',
                                '&:hover': { bgcolor: 'action.selected' }
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="h6">
                                        {formation.nom}
                                    </Typography>
                                    {formation.varianteName && (
                                        <Chip
                                            label={formation.varianteName}
                                            size="small"
                                            color="secondary"
                                        />
                                    )}
                                </Box>
                                <Chip
                                    label={`${calculerCoutFormation(formation)} pts`}
                                    color="primary"
                                    size="small"
                                />
                            </Box>
                        </AccordionSummary>

                        <AccordionDetails>
                            <Box>
                                {/* ========== UNITÉS ========== */}
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="subtitle2" gutterBottom color="textSecondary">
                                        Composition :
                                    </Typography>

                                    {formation.unites?.map(unite => (
                                        <Box
                                            key={unite.id}
                                            sx={{
                                                ml: 2,
                                                mb: 2,
                                                opacity: unite.remplace ? 0.5 : 1,
                                                textDecoration: unite.remplace ? 'line-through' : 'none'
                                            }}
                                        >
                                            <Typography
                                                variant="body1"
                                                gutterBottom
                                                fontWeight="medium"
                                                color={unite.est_remplacement ? 'primary.main' : 'inherit'}
                                            >
                                                {unite.nombre}x {unite.nom}
                                                {unite.est_remplacement && (
                                                    <Chip label="Remplacement" size="small" color="primary" sx={{ ml: 1 }} />
                                                )}
                                            </Typography>

                                            {/* Options */}
                                            {unite.options?.map(option => {
                                                const items = trouverItemsDansCodex(formation.formationId, unite.uniteId, option.optionId);

                                                return (
                                                    <FormControl
                                                        fullWidth
                                                        key={option.optionId}
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                    >
                                                        <InputLabel>
                                                            {option.nom}
                                                            {items.length > 0 && items[0].requis && ' *'}
                                                        </InputLabel>
                                                        <Select
                                                            value={option.itemSelectionne || ''}
                                                            label={option.nom}
                                                            onChange={(e) => selectionnerItem(formation.id, unite.id, option.optionId, e.target.value)}
                                                        >
                                                            <MenuItem value="">
                                                                <em>-- Aucun --</em>
                                                            </MenuItem>
                                                            {items.map(item => (
                                                                <MenuItem key={item.id} value={item.id}>
                                                                    {item.name} {item.cout > 0 && `(${item.cout} pts)`}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                );
                                            })}
                                        </Box>
                                    ))}
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* ========== AMÉLIORATIONS ========== */}
                                <Box>
                                    <Typography variant="subtitle2" gutterBottom color="textSecondary">
                                        Améliorations :
                                    </Typography>

                                    {formation.ameliorations?.length === 0 && (
                                        <Typography variant="body2" color="textSecondary" sx={{ ml: 2 }}>
                                            Aucune
                                        </Typography>
                                    )}

                                    <Box sx={{ ml: 2, mb: 2 }}>
                                        {formation.ameliorations?.map(amelio => {
                                            const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                                            const quantite = amelio.quantite || 1;
                                            const coutTotal = (amelioDef?.cout || 0) * quantite;

                                            return (
                                                <Chip
                                                    key={amelio.id}
                                                    label={`${quantite > 1 ? `${quantite}x ` : ''}${amelioDef?.name} (${coutTotal} pts)`}
                                                    onDelete={() => supprimerAmelioration(formation.id, amelio.id)}
                                                    sx={{ m: 0.5 }}
                                                    size="small"
                                                />
                                            );
                                        })}
                                    </Box>

                                    <Box sx={{ ml: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {trouverAmeliorationsDansCodex(formation.formationId).map(amelio => {
                                            // ✅ Vérifier si l'amélioration nécessite une quantité
                                            const needsQuantity = (amelio.min !== undefined && amelio.max !== undefined) ||
                                                amelio.type_remplacement;

                                            return (
                                                <Button
                                                    key={amelio.id}
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        if (needsQuantity) {
                                                            setCurrentAmeliorationForQuantite(amelio);
                                                            setCurrentFormationForQuantite(formation);
                                                            setQuantiteSelectorOpen(true);
                                                        } else {
                                                            ajouterAmelioration(formation.id, amelio.id);
                                                        }
                                                    }}
                                                >
                                                    + {amelio.name} ({amelio.cout} pts)
                                                </Button>
                                            );
                                        })}
                                    </Box>
                                </Box>

                                <Divider sx={{ my: 2 }} />

                                {/* ========== ACTIONS ========== */}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => supprimerFormation(formation.id)}
                                    >
                                        Supprimer la formation
                                    </Button>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                ))}
            </Box>

            {/* ========== DIALOGS ========== */}

            {/* Dialog sélection de variante */}
            <VarianteSelectorDialog
                open={varianteSelectorOpen}
                onClose={() => {
                    setVarianteSelectorOpen(false);
                    setCurrentFormationForVariante(null);
                }}
                formation={currentFormationForVariante}
                onConfirm={handleConfirmVariante}
            />

            {/* Dialog composition personnalisée */}
            <CompositionPersonnaliseeDialog
                open={compositionDialogOpen}
                onClose={() => {
                    setCompositionDialogOpen(false);
                    setCurrentFormationForComposition(null);
                }}
                formationDef={currentFormationForComposition}
                onConfirm={handleConfirmComposition}
            />

            {/* Dialog sélection de quantité */}
            <QuantiteSelectorDialog
                open={quantiteSelectorOpen}
                onClose={() => {
                    setQuantiteSelectorOpen(false);
                    setCurrentAmeliorationForQuantite(null);
                    setCurrentFormationForQuantite(null);
                }}
                amelioration={currentAmeliorationForQuantite}
                formation={currentFormationForQuantite}
                onConfirm={handleConfirmQuantite}
            />
        </Container>
    );
}

export default ListBuilderPage;