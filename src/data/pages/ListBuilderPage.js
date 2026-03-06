import React, { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
    Container,
    Box,
    Typography,
    Button,
    Paper,
    Select,
    MenuItem,
    Menu,
    FormControl,
    InputLabel,
    Chip,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Alert,
    AlertTitle,
    Snackbar,
    TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useParams } from 'react-router-dom';
import { useArmyList } from '../../contexts/ArmyListContext';
import { useAuth } from '../../contexts/AuthContext';
import VarianteSelectorDialog from '../../components/VarianteSelectorDialog';
import CompositionPersonnaliseeDialog from '../../components/CompositionPersonnaliseeDialog';
import QuantiteSelectorDialog from '../../components/QuantiteSelectorDialog';
import ChoixAmeliorationDialog from '../../components/ChoixAmeliorationDialog';

function ListBuilderPage({ codex }) {
    const {
        liste,
        validation,
        validator,
        ajouterFormation,
        dupliquerFormation,
        supprimerFormation,
        selectionnerItem,
        ajouterAmelioration,
        supprimerAmelioration,
        calculerCoutTotal,
        sauvegarderListe,
        renommerListe,
        reordonnerFormations
    } = useArmyList();

    const { user } = useAuth();
    const navigate = useNavigate();
    const { codexId } = useParams();

    // ✅ États pour sauvegarde et édition nom
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [editingName, setEditingName] = useState(false);
    const [tempName, setTempName] = useState('');

    const handleSave = async () => {
        await sauvegarderListe(user);
        setSnackbar({ open: true, message: 'Liste sauvegardee !' });
    };

    const handleStartEditName = () => {
        setTempName(liste.nom);
        setEditingName(true);
    };

    const handleConfirmName = () => {
        if (tempName.trim()) {
            renommerListe(tempName.trim());
        }
        setEditingName(false);
    };

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
    );

    const handleDragEnd = ({ active, over }) => {
        if (over && active.id !== over.id) {
            reordonnerFormations(active.id, over.id);
        }
    };

    // ✅ États pour les dialogs
    const [groupeExpand, setGroupeExpand] = useState(null);
    const [formationExpanded, setFormationExpanded] = useState({});

    const [varianteSelectorOpen, setVarianteSelectorOpen] = useState(false);
    const [currentFormationForVariante, setCurrentFormationForVariante] = useState(null);

    const [compositionDialogOpen, setCompositionDialogOpen] = useState(false);
    const [currentFormationForComposition, setCurrentFormationForComposition] = useState(null);
    const [pendingVarianteId, setPendingVarianteId] = useState(null);
    const [compositionOverrideTotal, setCompositionOverrideTotal] = useState(null);

    // ✅ Dialog composition synaptique (unités synaptiques libres)
    const [synaptiqueDialogOpen, setSynaptiqueDialogOpen] = useState(false);
    const [currentFormationForSynaptique, setCurrentFormationForSynaptique] = useState(null);

    // ✅ Dialog essaims (sélection obligatoire min/max)
    const [essaimDialogOpen, setEssaimDialogOpen] = useState(false);
    const [currentFormationForEssaims, setCurrentFormationForEssaims] = useState(null);

    // ✅ Accumulation entre les étapes de dialogue
    const [pendingUnites, setPendingUnites] = useState([]);
    const [pendingCout, setPendingCout] = useState(null);

    const [quantiteSelectorOpen, setQuantiteSelectorOpen] = useState(false);
    const [currentAmeliorationForQuantite, setCurrentAmeliorationForQuantite] = useState(null);
    const [currentFormationForQuantite, setCurrentFormationForQuantite] = useState(null);

    const [choixDialogOpen, setChoixDialogOpen] = useState(false);
    const [currentAmeliorationForChoix, setCurrentAmeliorationForChoix] = useState(null);
    const [currentFormationForChoix, setCurrentFormationForChoix] = useState(null);

    const [compoAmelioOpen, setCompoAmelioOpen] = useState(false);
    const [currentAmeliorationForCompo, setCurrentAmeliorationForCompo] = useState(null);
    const [currentFormationForCompoAmelio, setCurrentFormationForCompoAmelio] = useState(null);

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
                if (amelioDef.cout_par_unite) {
                    const quantite = amelio.quantite || 1;
                    cout += amelioDef.cout * quantite;
                } else {
                    cout += amelioDef.cout;
                }
            }
        });

        return cout;
    };

    // ✅ Helpers pour enchaîner les dialogs après variante/synaptique/composition
    const ouvrirSynaptique = (formation, varianteId = null) => {
        setPendingVarianteId(varianteId);
        setPendingUnites([]);
        setPendingCout(formation.cout);
        setCurrentFormationForSynaptique(formation);
        setSynaptiqueDialogOpen(true);
    };

    const ouvrirComposition = (formation, varianteId = null, overrideTotal = null) => {
        setPendingVarianteId(varianteId);
        setPendingUnites([]);
        setPendingCout(formation.cout);
        setCompositionOverrideTotal(overrideTotal);
        setCurrentFormationForComposition(formation);
        setCompositionDialogOpen(true);
    };

    const ouvrirEssaims = (formation, varianteId = null, unitesAccumulees = [], coutAccumule = null) => {
        setPendingVarianteId(varianteId);
        setPendingUnites(unitesAccumulees);
        setPendingCout(coutAccumule ?? formation.cout);
        setCurrentFormationForEssaims(formation);
        setEssaimDialogOpen(true);
    };

    // ✅ Handlers pour les dialogs
    const handleConfirmVariante = (varianteId) => {
        if (!currentFormationForVariante) return;
        const formation = currentFormationForVariante;
        setCurrentFormationForVariante(null);

        const variante = varianteId ? formation.variantes?.find(v => v.id === varianteId) : null;
        const coutVariante = variante?.cout ?? formation.cout;

        if (formation.composition_synaptique) {
            setPendingCout(coutVariante);
            ouvrirSynaptique(formation, varianteId);
        } else if (formation.composition_personnalisee) {
            const total = variante?.total_composition || formation.composition_personnalisee.total;
            ouvrirComposition(formation, varianteId, total);
        } else if (formation.composition_essaims) {
            ouvrirEssaims(formation, varianteId, [], coutVariante);
        } else {
            ajouterFormation(formation.id, varianteId);
        }
    };

    const handleConfirmSynaptique = (unites, coutAdd) => {
        if (!currentFormationForSynaptique) return;
        const formation = currentFormationForSynaptique;
        setCurrentFormationForSynaptique(null);

        if (formation.composition_essaims) {
            ouvrirEssaims(formation, pendingVarianteId, unites, pendingCout);
        } else {
            ajouterFormation(formation.id, pendingVarianteId, unites, pendingCout);
        }
    };

    const handleConfirmComposition = (unites, coutAdd) => {
        if (!currentFormationForComposition) return;
        const formation = currentFormationForComposition;
        setCurrentFormationForComposition(null);
        setCompositionOverrideTotal(null);

        if (formation.composition_essaims) {
            ouvrirEssaims(formation, pendingVarianteId, unites, (pendingCout ?? formation.cout) + coutAdd);
        } else {
            ajouterFormation(formation.id, pendingVarianteId, unites);
            setPendingVarianteId(null);
        }
    };

    const handleConfirmEssaims = (essaimUnites, coutAdd) => {
        if (!currentFormationForEssaims) return;
        const formation = currentFormationForEssaims;
        setCurrentFormationForEssaims(null);

        const allUnites = [...pendingUnites, ...essaimUnites];
        const totalCout = (pendingCout ?? formation.cout) + coutAdd;

        ajouterFormation(formation.id, pendingVarianteId, allUnites, totalCout);
        setPendingVarianteId(null);
        setPendingUnites([]);
        setPendingCout(null);
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

    const handleConfirmChoix = (choixId, choixName) => {
        if (currentFormationForChoix && currentAmeliorationForChoix) {
            ajouterAmelioration(
                currentFormationForChoix.id,
                currentAmeliorationForChoix.id,
                1,
                choixId,
                choixName
            );
            setCurrentAmeliorationForChoix(null);
            setCurrentFormationForChoix(null);
        }
    };

    const handleConfirmCompositionAmelio = (unites) => {
        if (currentFormationForCompoAmelio && currentAmeliorationForCompo) {
            ajouterAmelioration(
                currentFormationForCompoAmelio.id,
                currentAmeliorationForCompo.id,
                1,
                null,
                null,
                unites
            );
            setCurrentAmeliorationForCompo(null);
            setCurrentFormationForCompoAmelio(null);
        }
    };

    // ===== COPIE =====
    const [copyMenuAnchor, setCopyMenuAnchor] = useState(null);
    const [copyConfirm, setCopyConfirm] = useState('');

    const buildCopyData = () => {
        const blm = liste.formations.length > 0
            ? liste.formations.reduce((max, f) => calculerCoutFormation(f) > calculerCoutFormation(max) ? f : max)
            : null;
        return { blm };
    };

    const handleCopyDiscord = () => {
        const { blm } = buildCopyData();
        const blmCout = blm ? calculerCoutFormation(blm) : 0;
        const content = [
            `## Liste ${codex.codex.name} ${calculerCoutTotal()} pts`,
            `Nombre de formations ***${liste.formations.length}***`,
            blm ? `***BLM : ${blm.nom} ${blmCout} pts***` : '',
            '',
            ...liste.formations.map(formation => {
                const cout = calculerCoutFormation(formation);
                const amelios = (formation.ameliorations || []).map(amelio => {
                    const def = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                    if (!def) return '';
                    const q = amelio.quantite || 1;
                    const suffix = amelio.choixName ? ` : ${amelio.choixName}` : '';
                    const coutAmelio = def.cout_par_unite ? def.cout * q : def.cout;
                    return `  - ${q > 1 ? `${q}x ` : ''}${def.name}${suffix} - ${coutAmelio} pts`;
                }).filter(Boolean).join('\r');
                return `- ***${formation.nom} - ${cout} pts***\r${amelios}`;
            })
        ].filter(l => l !== null).join('\r');

        navigator.clipboard.writeText(content)
            .then(() => { setCopyConfirm('discord'); setTimeout(() => setCopyConfirm(''), 2000); })
            .catch(console.error);
        setCopyMenuAnchor(null);
    };

    const handleCopyElo = () => {
        const { blm } = buildCopyData();
        const blmCout = blm ? calculerCoutFormation(blm) : 0;
        const content = [
            `Liste : ${codex.codex.name} - ${calculerCoutTotal()} pts`,
            `Nombre de formations: ${liste.formations.length}`,
            blm ? `BLM: ${blm.nom} - ${blmCout} pts` : '',
            '',
            ...liste.formations.map(formation => {
                const cout = calculerCoutFormation(formation);
                const amelios = (formation.ameliorations || []).map(amelio => {
                    const def = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                    if (!def) return '';
                    const q = amelio.quantite || 1;
                    const suffix = amelio.choixName ? ` : ${amelio.choixName}` : '';
                    const coutAmelio = def.cout_par_unite ? def.cout * q : def.cout;
                    return `  - ${q > 1 ? `${q}x ` : ''}${def.name}${suffix} - ${coutAmelio} pts`;
                }).filter(Boolean).join('\n');
                return `- ${formation.nom} - ${cout} pts\n${amelios}`;
            })
        ].filter(l => l !== null).join('\n');

        navigator.clipboard.writeText(content)
            .then(() => { setCopyConfirm('elo'); setTimeout(() => setCopyConfirm(''), 2000); })
            .catch(console.error);
        setCopyMenuAnchor(null);
    };

    const blmId = liste.formations.length > 0
        ? liste.formations.reduce((max, f) =>
            calculerCoutFormation(f) > calculerCoutFormation(max) ? f : max
        ).id
        : null;

    return (
        <Container maxWidth="lg" sx={{ pt: 2, pb: 2 }}>
            {/* ========== HEADER ========== */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" gutterBottom>
                    {codex.codex.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {editingName ? (
                        <>
                            <TextField
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                size="small"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmName();
                                    if (e.key === 'Escape') setEditingName(false);
                                }}
                            />
                            <IconButton size="small" onClick={handleConfirmName}>
                                <CheckIcon />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <Typography variant="h5" color="textSecondary">
                                {liste.nom}
                            </Typography>
                            <IconButton size="small" onClick={handleStartEditName}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                    <Chip label={`${calculerCoutTotal()} pts`} color="primary" />
                    <Chip label={`${liste.formations.length} formation${liste.formations.length > 1 ? 's' : ''}`} variant="outlined" />
                    {blmId && (
                        <Chip
                            label={`BLM : ${liste.formations.find(f => f.id === blmId)?.nom}`}
                            size="small"
                            color="error"
                            variant="outlined"
                        />
                    )}
                    <IconButton
                        color="primary"
                        onClick={handleSave}
                        title="Sauvegarder la liste"
                        size="small"
                    >
                        <SaveIcon />
                    </IconButton>
                    <IconButton
                        color="primary"
                        onClick={() => navigate(`/builder/${codexId}/preview`)}
                        title="Aperçu de la liste"
                        size="small"
                    >
                        <VisibilityIcon />
                    </IconButton>
                    <IconButton
                        color="primary"
                        onClick={() => navigate(`/builder/${codexId}/print`)}
                        title="Imprimer la liste"
                        size="small"
                    >
                        <PrintIcon />
                    </IconButton>
                    <IconButton
                        color={copyConfirm ? 'success' : 'primary'}
                        onClick={(e) => setCopyMenuAnchor(e.currentTarget)}
                        title="Copier la liste"
                        size="small"
                    >
                        <ContentCopyIcon />
                    </IconButton>
                    <Menu
                        anchorEl={copyMenuAnchor}
                        open={Boolean(copyMenuAnchor)}
                        onClose={() => setCopyMenuAnchor(null)}
                    >
                        <MenuItem onClick={handleCopyDiscord}>
                            {copyConfirm === 'discord' ? '✓ Copié !' : 'Copier pour Discord'}
                        </MenuItem>
                        <MenuItem onClick={handleCopyElo}>
                            {copyConfirm === 'elo' ? '✓ Copié !' : 'Copier pour ELO'}
                        </MenuItem>
                    </Menu>
                </Box>
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
                                                if (formation.variantes && formation.variantes.length > 0) {
                                                    setCurrentFormationForVariante(formation);
                                                    setVarianteSelectorOpen(true);
                                                } else if (formation.composition_synaptique) {
                                                    ouvrirSynaptique(formation);
                                                } else if (formation.composition_personnalisee) {
                                                    ouvrirComposition(formation);
                                                } else if (formation.composition_essaims) {
                                                    ouvrirEssaims(formation);
                                                } else {
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

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={liste.formations.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {liste.formations.map(formation => (
                    <SortableFormationItem key={formation.id} id={formation.id}>
                    <Accordion
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
                                    <DragHandle />
                                    <Typography variant="h6">
                                        {formation.nom}
                                    </Typography>
                                    {formation.id === blmId && (
                                        <Chip
                                            label="BLM"
                                            size="small"
                                            color="error"
                                            variant="outlined"
                                            title="Brigade de la Liste Maîtresse (formation la plus coûteuse)"
                                        />
                                    )}
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
                                                {unite.instanceIndex
                                                    ? `${unite.nom} (${unite.instanceIndex}/${unite.instanceTotal})`
                                                    : `${unite.nombre}x ${unite.nom}`}
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
                                            const choixSuffix = amelio.choixName ? ` : ${amelio.choixName}` : '';
                                            const compoSuffix = amelio.unitesComposition?.length
                                                ? ` : ${amelio.unitesComposition.map(u => `${u.nombre}x ${u.nom}`).join(', ')}`
                                                : '';

                                            return (
                                                <Chip
                                                    key={amelio.id}
                                                    label={`${quantite > 1 ? `${quantite}x ` : ''}${amelioDef?.name}${choixSuffix}${compoSuffix} (${coutTotal} pts)`}
                                                    onDelete={() => supprimerAmelioration(formation.id, amelio.id)}
                                                    sx={{ m: 0.5 }}
                                                    size="small"
                                                />
                                            );
                                        })}
                                    </Box>

                                    <Box sx={{ ml: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                        {trouverAmeliorationsDansCodex(formation.formationId).map(amelio => {
                                            const needsQuantity = (amelio.min !== undefined && amelio.max !== undefined) ||
                                                amelio.type_remplacement;

                                            return (
                                                <Button
                                                    key={amelio.id}
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => {
                                                        if (amelio.choix) {
                                                            setCurrentAmeliorationForChoix(amelio);
                                                            setCurrentFormationForChoix(formation);
                                                            setChoixDialogOpen(true);
                                                        } else if (amelio.composition_personnalisee) {
                                                            setCurrentAmeliorationForCompo(amelio);
                                                            setCurrentFormationForCompoAmelio(formation);
                                                            setCompoAmelioOpen(true);
                                                        } else if (needsQuantity) {
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
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                        startIcon={<ContentCopyIcon />}
                                        onClick={() => dupliquerFormation(formation.id)}
                                    >
                                        Dupliquer
                                    </Button>
                                    <Button
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => supprimerFormation(formation.id)}
                                    >
                                        Supprimer
                                    </Button>
                                </Box>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                    </SortableFormationItem>
                ))}
                    </SortableContext>
                </DndContext>
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
                    setPendingVarianteId(null);
                    setCompositionOverrideTotal(null);
                }}
                formationDef={currentFormationForComposition}
                onConfirm={handleConfirmComposition}
                overrideTotal={compositionOverrideTotal}
            />

            {/* Dialog composition synaptique (unités synaptiques libres) */}
            <CompositionPersonnaliseeDialog
                open={synaptiqueDialogOpen}
                onClose={() => {
                    setSynaptiqueDialogOpen(false);
                    setCurrentFormationForSynaptique(null);
                    setPendingVarianteId(null);
                    // Ne pas réinitialiser pendingUnites/pendingCout ici :
                    // si on confirme, ouvrirEssaims les a déjà remplis avant que onClose soit appelé
                    // si on annule, ils seront réinitialisés au prochain ouvrirSynaptique/ouvrirEssaims
                }}
                formationDef={currentFormationForSynaptique}
                configOverride={currentFormationForSynaptique?.composition_synaptique}
                dialogTitle={currentFormationForSynaptique?.name}
                onConfirm={handleConfirmSynaptique}
            />

            {/* Dialog sélection d'essaims (min/max obligatoire) */}
            <CompositionPersonnaliseeDialog
                open={essaimDialogOpen}
                onClose={() => {
                    setEssaimDialogOpen(false);
                    setCurrentFormationForEssaims(null);
                    setPendingVarianteId(null);
                    setPendingUnites([]);
                    setPendingCout(null);
                }}
                formationDef={currentFormationForEssaims}
                configOverride={currentFormationForEssaims?.composition_essaims}
                dialogTitle={currentFormationForEssaims?.name}
                onConfirm={handleConfirmEssaims}
            />

            {/* Dialog composition amélioration (ex: Blindés T'au) */}
            <CompositionPersonnaliseeDialog
                open={compoAmelioOpen}
                onClose={() => {
                    setCompoAmelioOpen(false);
                    setCurrentAmeliorationForCompo(null);
                    setCurrentFormationForCompoAmelio(null);
                }}
                configOverride={currentAmeliorationForCompo?.composition_personnalisee}
                dialogTitle={currentAmeliorationForCompo?.name}
                onConfirm={handleConfirmCompositionAmelio}
            />

            {/* Dialog choix d'amélioration */}
            <ChoixAmeliorationDialog
                open={choixDialogOpen}
                onClose={() => {
                    setChoixDialogOpen(false);
                    setCurrentAmeliorationForChoix(null);
                    setCurrentFormationForChoix(null);
                }}
                amelioration={currentAmeliorationForChoix}
                onConfirm={handleConfirmChoix}
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

            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ open: false, message: '' })}
                message={snackbar.message}
            />
        </Container>
    );
}

const DragListenersContext = React.createContext(null);

function SortableFormationItem({ id, children }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    return (
        <DragListenersContext.Provider value={listeners}>
            <div
                ref={setNodeRef}
                style={{
                    transform: CSS.Transform.toString(transform),
                    transition,
                    opacity: isDragging ? 0.5 : 1,
                    position: 'relative',
                    zIndex: isDragging ? 1 : 'auto'
                }}
                {...attributes}
            >
                {children}
            </div>
        </DragListenersContext.Provider>
    );
}

function DragHandle() {
    const listeners = React.useContext(DragListenersContext);
    return (
        <IconButton
            size="small"
            sx={{ cursor: 'grab', color: 'text.disabled', mr: 0.5, touchAction: 'none' }}
            {...listeners}
            onClick={e => e.stopPropagation()}
        >
            <DragIndicatorIcon fontSize="small" />
        </IconButton>
    );
}

export default ListBuilderPage;