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

// configOverride : passe directement une config (pour composition_synaptique / composition_essaims)
// dialogTitle    : titre personnalisé quand configOverride est utilisé
function CompositionPersonnaliseeDialog({ open, onClose, formationDef, onConfirm, overrideTotal, configOverride, dialogTitle }) {
    const [composition, setComposition] = useState({});
    const [error, setError] = useState('');

    const config = configOverride || formationDef?.composition_personnalisee;

    useEffect(() => {
        if (open && config) {
            const init = {};
            config.options.forEach(opt => { init[opt.id] = 0; });
            setComposition(init);
            setError('');
        }
    }, [open, config]);

    if (!config) return null;

    const total = Object.values(composition).reduce((sum, val) => sum + val, 0);

    const minTotal = overrideTotal || config.min_total || config.total || 0;
    const maxTotal = overrideTotal || config.max_total || config.total || 0;
    const isValid = total >= minTotal && total <= maxTotal;

    // Coût supplémentaire apporté par cette composition (options payantes)
    const coutAdditionnel = config.options.reduce((sum, opt) => {
        return sum + (opt.cout || 0) * (composition[opt.id] || 0);
    }, 0);

    const handleChange = (optionId, value) => {
        const numValue = parseInt(value) || 0;
        const option = config.options.find(o => o.id === optionId);
        if (numValue < (option.min || 0) || numValue > option.max) return;
        setComposition(prev => ({ ...prev, [optionId]: numValue }));
    };

    const handleConfirm = () => {
        if (!isValid) {
            if (total < minTotal) {
                setError(`Vous devez sélectionner au moins ${minTotal} slot(s)`);
            } else {
                setError(`Vous ne pouvez pas sélectionner plus de ${maxTotal} slot(s)`);
            }
            return;
        }

        const unites = [];
        config.options.forEach(option => {
            const count = composition[option.id];
            if (count > 0) {
                const nombreFig = count * (option.nombre_par_slot || 1);
                unites.push({
                    id: genererID(),
                    uniteId: option.unitId,
                    nom: option.name,
                    nombre: nombreFig,
                    options: [],
                    ...(option.tags?.length && { tags: option.tags })
                });
            }
        });

        onConfirm(unites, coutAdditionnel);
        onClose();
    };

    function genererID() {
        return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    const hasPaidOptions = config.options.some(o => (o.cout || 0) > 0);
    const title = dialogTitle || formationDef?.name || '';

    const formationDescription = formationDef?.description;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ pb: 0 }}>
                <Typography variant="h6">{title}</Typography>
                {formationDescription && (
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                        {formationDescription}
                    </Typography>
                )}
                {config.description && (
                    <Typography variant="body2" color="primary" fontWeight="medium" sx={{ mt: 0.5 }}>
                        {config.description}
                    </Typography>
                )}
            </DialogTitle>

            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {/* Total et coût */}
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body2" fontWeight="bold">
                            Total : {total} / {minTotal === maxTotal ? maxTotal : `${minTotal}–${maxTotal}`}
                        </Typography>
                        {hasPaidOptions && coutAdditionnel > 0 && (
                            <Chip label={`+${coutAdditionnel} pts`} size="small" color="primary" />
                        )}
                    </Box>

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

                {/* Options */}
                {config.options.map(option => (
                    <Box key={option.id} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                            <Typography variant="body2">
                                {option.name}
                                {option.max > 0 && ` (max ${option.max})`}
                            </Typography>
                            {(option.tags || []).map(tag => (
                                <Chip key={tag} label={tag} size="small" variant="outlined" color="default" />
                            ))}
                            {(option.cout || 0) > 0 && (
                                <Chip label={`${option.cout} pts/slot`} size="small" variant="outlined" />
                            )}
                        </Box>
                        <TextField
                            type="number"
                            size="small"
                            fullWidth
                            value={composition[option.id] || 0}
                            onChange={(e) => handleChange(option.id, e.target.value)}
                            inputProps={{ min: option.min || 0, max: option.max }}
                        />
                    </Box>
                ))}

                {!isValid && total > 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        {total < minTotal
                            ? `Il vous reste ${minTotal - total} slot(s) à sélectionner`
                            : `Vous avez sélectionné ${total - maxTotal} slot(s) en trop`
                        }
                    </Alert>
                )}

                {isValid && total > 0 && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        ✓ Configuration valide ({total} slot{total > 1 ? 's' : ''})
                        {hasPaidOptions && coutAdditionnel > 0 && ` — +${coutAdditionnel} pts`}
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
