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
    Slider,
    Chip
} from '@mui/material';

function CompositionPersonnaliseeDialog({ open, onClose, formationDef, onConfirm }) {
    const [composition, setComposition] = useState({});
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && formationDef?.composition_personnalisee) {
            // Initialiser avec 0 pour chaque option
            const init = {};
            formationDef.composition_personnalisee.options.forEach(opt => {
                init[opt.id] = 0;
            });
            setComposition(init);
            setError('');
        }
    }, [open, formationDef]);

    if (!formationDef?.composition_personnalisee) return null;

    const config = formationDef.composition_personnalisee;
    const total = Object.values(composition).reduce((sum, val) => sum + val, 0);

    // ✅ Support min_total et max_total (ou total fixe pour rétrocompatibilité)
    const minTotal = config.min_total || config.total || 0;
    const maxTotal = config.max_total || config.total || 0;
    const isValid = total >= minTotal && total <= maxTotal;

    const handleChange = (optionId, value) => {
        const numValue = parseInt(value) || 0;
        const option = config.options.find(o => o.id === optionId);

        if (numValue < option.min || numValue > option.max) return;

        setComposition(prev => ({
            ...prev,
            [optionId]: numValue
        }));
    };

    const handleConfirm = () => {
        if (!isValid) {
            if (total < minTotal) {
                setError(`Vous devez sélectionner au moins ${minTotal} unités`);
            } else {
                setError(`Vous ne pouvez pas sélectionner plus de ${maxTotal} unités`);
            }
            return;
        }

        // Convertir en format unités
        const unites = [];
        config.options.forEach(option => {
            const count = composition[option.id];
            if (count > 0) {
                console.log('🟢 Option:', option);
                console.log('🟢 option.id:', option.id);
                console.log('🟢 option.unitId:', option.unitId);

                unites.push({
                    id: genererID(),              // ✅ ID unique de l'instance
                    uniteId: option.unitId,       // ✅ IMPORTANT : Type d'unité (pour les remplacements)
                    nom: option.name,
                    nombre: count,
                    options: []
                });
            }
        });

        console.log('🟢 Unités finales:', unites);
        onConfirm(unites);
        onClose();
    };

    // ✅ Ajoute cette fonction helper
    function genererID() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // ✅ Calculer le coût total
    const coutTotal = formationDef.cout_par_unite
        ? formationDef.cout * total
        : formationDef.cout;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                {formationDef.name}
                <Typography variant="body2" color="textSecondary">
                    {config.description}
                </Typography>
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Affichage total avec barre de progression */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom fontWeight="bold">
                        Total : {total} / {minTotal === maxTotal ? maxTotal : `${minTotal}-${maxTotal}`}
                        {formationDef.cout_par_unite && (
                            <Chip label={`${coutTotal} pts`} size="small" color="primary" sx={{ ml: 1 }} />
                        )}
                    </Typography>

                    {minTotal !== maxTotal && (
                        <Slider
                            value={total}
                            min={0}
                            max={maxTotal}
                            marks={[
                                { value: minTotal, label: `Min ${minTotal}` },
                                { value: maxTotal, label: `Max ${maxTotal}` }
                            ]}
                            disabled
                            sx={{ mt: 1 }}
                        />
                    )}
                </Box>

                {/* Sélection par type */}
                {config.options.map(option => (
                    <Box key={option.id} sx={{ mb: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            {option.name}
                            {option.max > 0 && ` (max ${option.max})`}
                        </Typography>
                        <TextField
                            type="number"
                            size="small"
                            fullWidth
                            value={composition[option.id] || 0}
                            onChange={(e) => handleChange(option.id, e.target.value)}
                            inputProps={{
                                min: option.min,
                                max: option.max
                            }}
                        />
                    </Box>
                ))}

                {/* Alertes de validation */}
                {!isValid && total > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        {total < minTotal
                            ? `Il vous reste ${minTotal - total} unité(s) à sélectionner`
                            : `Vous avez sélectionné ${total - maxTotal} unité(s) en trop`
                        }
                    </Alert>
                )}

                {isValid && total > 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        ✓ Configuration valide ({total} unités)
                    </Alert>
                )}
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleConfirm} variant="contained" disabled={!isValid}>
                    Valider
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default CompositionPersonnaliseeDialog;