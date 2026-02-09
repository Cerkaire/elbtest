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
    // ✅ AJOUTE CES LOGS
    useEffect(() => {
        if (open && amelioration) {
            console.log('🟣 QuantiteSelectorDialog ouverte');
            console.log('🟣 amelioration:', amelioration);
            console.log('🟣 formation:', formation);
            console.log('🟣 formation.unites:', formation?.unites);

            if (amelioration.type_remplacement) {
                console.log('🟣 remplace_unites:', amelioration.type_remplacement.remplace_unites);

                const unitesRemplacables = formation?.unites?.filter(unite => {
                    console.log('🟣 Vérif unité:', unite.uniteId, 'remplace?', unite.remplace);
                    return amelioration.type_remplacement.remplace_unites.includes(unite.uniteId) && !unite.remplace;
                }) || [];

                console.log('🟣 Unités remplaçables trouvées:', unitesRemplacables);
            }

            setQuantite(amelioration.min || 1);
        }
    }, [open, amelioration, formation]);
    useEffect(() => {
        if (open && amelioration) {
            // Initialiser avec le minimum ou 1
            setQuantite(amelioration.min || 1);
        }
    }, [open, amelioration]);

    if (!amelioration) return null;

    const min = amelioration.min || 0;
    const max = amelioration.max || 1;

    // ✅ Calculer le nombre max de remplacements possibles
    let maxPossible = max;
    if (amelioration.type_remplacement && formation) {
        const unitesRemplacables = formation.unites?.filter(unite =>
            amelioration.type_remplacement.remplace_unites.includes(unite.uniteId) &&
            !unite.remplace
        ) || [];
        maxPossible = Math.min(max, unitesRemplacables.length);
    }

    const handleConfirm = () => {
        if (quantite < min || quantite > maxPossible) {
            alert(`La quantité doit être entre ${min} et ${maxPossible}`);
            return;
        }
        onConfirm(quantite);
        onClose();
    };

    const coutTotal = (amelioration.cout || 0) * quantite;

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
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom fontWeight="bold">
                        Quantité
                    </Typography>
                    <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                        Min: {min} | Max: {maxPossible}
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

                {amelioration.cout_par_unite && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        Coût : {amelioration.cout} pts × {quantite} = <strong>{coutTotal} pts</strong>
                    </Alert>
                )}

                {amelioration.type_remplacement && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        ⚠️ Ceci remplacera <strong>{quantite}</strong> unité(s) existante(s)
                        {formation && (
                            <Box sx={{ mt: 1 }}>
                                <Typography variant="caption" display="block">
                                    Unités remplaçables disponibles : {maxPossible}
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
                    disabled={quantite < min || quantite > maxPossible}
                >
                    Confirmer
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default QuantiteSelectorDialog;