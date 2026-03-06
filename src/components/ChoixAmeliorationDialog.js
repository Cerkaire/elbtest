import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    RadioGroup,
    Radio,
    FormControlLabel,
    Chip
} from '@mui/material';

function ChoixAmeliorationDialog({ open, onClose, amelioration, onConfirm }) {
    const [selectedChoix, setSelectedChoix] = useState('');

    useEffect(() => {
        if (open) setSelectedChoix('');
    }, [open]);

    if (!amelioration?.choix) return null;

    const handleConfirm = () => {
        if (!selectedChoix) return;
        const choixDef = amelioration.choix.find(c => c.id === selectedChoix);
        onConfirm(selectedChoix, choixDef?.name || selectedChoix);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>{amelioration.name}</DialogTitle>

            <DialogContent dividers>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Choisissez un type :
                </Typography>

                <RadioGroup
                    value={selectedChoix}
                    onChange={(e) => setSelectedChoix(e.target.value)}
                >
                    {amelioration.choix.map(choix => (
                        <FormControlLabel
                            key={choix.id}
                            value={choix.id}
                            control={<Radio />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1">{choix.name}</Typography>
                                    {choix.limiteOptionGlobal && (
                                        <Chip label="0-1 armée" size="small" color="warning" variant="outlined" />
                                    )}
                                </Box>
                            }
                        />
                    ))}
                </RadioGroup>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>Annuler</Button>
                <Button onClick={handleConfirm} variant="contained" disabled={!selectedChoix}>
                    Ajouter
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ChoixAmeliorationDialog;
