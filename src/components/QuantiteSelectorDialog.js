import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    TextField,
    Alert,
    Chip
} from '@mui/material';

function QuantiteSelectorDialog({ open, onClose, amelioration, formation, onConfirm }) {
    const [quantite, setQuantite] = useState(1);
    const [distribution, setDistribution] = useState({});

    const tailleLot = amelioration?.type_remplacement?.taille_lot || 1;

    // Calculer les types remplacables disponibles dans la formation
    const typesRemplacables = [];
    if (amelioration?.type_remplacement && formation) {
        const remplace_unites = amelioration.type_remplacement.remplace_unites || [];
        (formation.unites || []).forEach(unite => {
            if (remplace_unites.includes(unite.uniteId) && !unite.remplace) {
                const existing = typesRemplacables.find(t => t.uniteId === unite.uniteId);
                if (existing) {
                    existing.nombre += (unite.nombre || 1);
                } else {
                    typesRemplacables.push({
                        uniteId: unite.uniteId,
                        nom: unite.nom,
                        nombre: unite.nombre || 1
                    });
                }
            }
        });
    }

    const isMultiType = typesRemplacables.length > 1;

    useEffect(() => {
        if (open && amelioration) {
            setQuantite(amelioration.min || 1);

            if (isMultiType) {
                const init = {};
                typesRemplacables.forEach(t => {
                    init[t.uniteId] = 0;
                });
                setDistribution(init);
            }
        }
    }, [open, amelioration, formation]);

    if (!amelioration) return null;

    const min = amelioration.min || 0;
    const max = amelioration.max || 1;

    // Calculer le nombre max de remplacements possibles (en lots)
    let maxPossible = max;
    if (amelioration.type_remplacement && formation) {
        const totalRemplacables = typesRemplacables.reduce((total, t) => total + t.nombre, 0);
        const maxParUnites = Math.floor(totalRemplacables / tailleLot);
        maxPossible = Math.min(max, maxParUnites);
    }

    // Total de la distribution
    const totalDistribution = Object.values(distribution).reduce((sum, val) => sum + val, 0);

    const handleDistributionChange = (uniteId, delta) => {
        setDistribution(prev => {
            const current = prev[uniteId] || 0;
            const type = typesRemplacables.find(t => t.uniteId === uniteId);
            const maxForType = type ? type.nombre : 0;
            const newVal = Math.max(0, Math.min(maxForType, current + delta));

            // Vérifier que le total ne dépasse pas maxPossible
            const newTotal = totalDistribution - current + newVal;
            if (newTotal > maxPossible) return prev;

            return { ...prev, [uniteId]: newVal };
        });
    };

    const handleConfirm = () => {
        if (isMultiType) {
            onConfirm(distribution);
        } else {
            onConfirm(quantite);
        }
        onClose();
    };

    const effectiveQuantite = isMultiType ? totalDistribution : quantite;
    const unitesRemplacees = effectiveQuantite * tailleLot;
    const coutTotal = (amelioration.cout || 0) * effectiveQuantite;
    const isValid = isMultiType
        ? (totalDistribution >= min && totalDistribution <= maxPossible)
        : (quantite >= min && quantite <= maxPossible);

    // Label pour l'unité de sélection
    const lotLabel = tailleLot > 1 ? `paire${effectiveQuantite > 1 ? 's' : ''}` : '';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>
                {amelioration.name}
                {amelioration.description && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                        {amelioration.description}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent dividers>
                {isMultiType ? (
                    /* Mode distribution : un sélecteur par type d'unité */
                    <Box>
                        <Typography variant="body2" gutterBottom fontWeight="bold">
                            Choisir les unités à remplacer
                        </Typography>
                        <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                            Total : {totalDistribution} / {min === maxPossible ? maxPossible : `${min}-${maxPossible}`}
                        </Typography>

                        {typesRemplacables.map(type => (
                            <Box key={type.uniteId} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body2">
                                        {type.nom}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Disponibles : {type.nombre}
                                    </Typography>
                                </Box>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleDistributionChange(type.uniteId, -1)}
                                    disabled={(distribution[type.uniteId] || 0) <= 0}
                                    sx={{ minWidth: 36 }}
                                >
                                    −
                                </Button>

                                <Typography sx={{ minWidth: 24, textAlign: 'center' }}>
                                    {distribution[type.uniteId] || 0}
                                </Typography>

                                <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleDistributionChange(type.uniteId, 1)}
                                    disabled={
                                        (distribution[type.uniteId] || 0) >= type.nombre ||
                                        totalDistribution >= maxPossible
                                    }
                                    sx={{ minWidth: 36 }}
                                >
                                    +
                                </Button>
                            </Box>
                        ))}
                    </Box>
                ) : (
                    /* Mode simple : un seul sélecteur de quantité */
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom fontWeight="bold">
                            {tailleLot > 1 ? `Nombre de paires` : 'Quantité'}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                            Min: {min} | Max: {maxPossible}
                            {tailleLot > 1 && ` (${tailleLot} unités par paire)`}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setQuantite(Math.max(min, quantite - 1))}
                                disabled={quantite <= min}
                            >
                                −
                            </Button>

                            <TextField
                                type="number"
                                value={quantite}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || min;
                                    setQuantite(Math.max(min, Math.min(maxPossible, val)));
                                }}
                                inputProps={{
                                    min: min,
                                    max: maxPossible,
                                    style: { textAlign: 'center' }
                                }}
                                sx={{ width: '80px' }}
                                size="small"
                            />

                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => setQuantite(Math.min(maxPossible, quantite + 1))}
                                disabled={quantite >= maxPossible}
                            >
                                +
                            </Button>
                        </Box>
                    </Box>
                )}

                {amelioration.cout_par_unite && (
                    <Alert severity="info" sx={{ mb: 2, mt: 2 }}>
                        Coût : {amelioration.cout} pts × {effectiveQuantite} {lotLabel} = <strong>{coutTotal} pts</strong>
                    </Alert>
                )}

                {amelioration.type_remplacement && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Ceci remplacera <strong>{unitesRemplacees}</strong> unité(s) existante(s)
                        {formation && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block">
                                    Unités remplaçables disponibles : {typesRemplacables.reduce((t, r) => t + r.nombre, 0)}
                                </Typography>
                            </Box>
                        )}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={!isValid}
                >
                    Confirmer
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default QuantiteSelectorDialog;
