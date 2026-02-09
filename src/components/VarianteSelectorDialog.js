import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  RadioGroup,
  Radio,
  FormControlLabel
} from '@mui/material';

function VarianteSelectorDialog({ open, onClose, formation, onConfirm }) {
  // ✅ Initialiser avec une valeur par défaut vide (string vide = standard)
  const [selectedVariante, setSelectedVariante] = useState('');

  // ✅ Réinitialiser quand le dialog s'ouvre
  useEffect(() => {
    if (open) {
      setSelectedVariante('');
    }
  }, [open]);

  if (!formation) return null;

  const hasVariantes = formation.variantes && formation.variantes.length > 0;

  const handleConfirm = () => {
    console.log('🟢 Dialog - selectedVariante:', selectedVariante);
    console.log('🟢 Dialog - type:', typeof selectedVariante);

    const valueToSend = selectedVariante === '' ? null : selectedVariante;
    console.log('🟢 Dialog - valeur envoyée:', valueToSend);

    onConfirm(valueToSend);
    setSelectedVariante('');
    onClose();
  };

  const handleCancel = () => {
    setSelectedVariante('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        {formation?.name}
      </DialogTitle>

      <DialogContent dividers>
        {!hasVariantes && (
          <Typography variant="body2" color="textSecondary">
            Cette formation n'a pas de variantes.
          </Typography>
        )}

        {hasVariantes && (
          <>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Choisissez une taille pour cette formation :
            </Typography>

            <RadioGroup
              value={selectedVariante}
              onChange={(e) => setSelectedVariante(e.target.value)}
            >
              {/* Option standard (sans variante) */}
              <FormControlLabel
                value=""
                control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="body1">
                        Standard
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formation.unites.map(u => `${u.nombre}x ${u.name || u.id}`).join(', ')}
                      </Typography>
                    </Box>
                    <Chip label={`${formation.cout} pts`} size="small" />
                  </Box>
                }
              />

              {/* Variantes */}
              {formation.variantes.map(variante => (
                <FormControlLabel
                  key={variante.id}
                  value={variante.id}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body1">
                          {variante.name}
                        </Typography>
                        {variante.multiplicateur && (
                          <Typography variant="caption" color="textSecondary">
                            {formation.unites.map(u =>
                              `${Math.round(u.nombre * variante.multiplicateur)}x ${u.name || u.id}`
                            ).join(', ')}
                          </Typography>
                        )}
                      </Box>
                      <Chip label={`${variante.cout} pts`} size="small" color="primary" />
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleCancel}>Annuler</Button>
        <Button onClick={handleConfirm} variant="contained">
          Ajouter
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default VarianteSelectorDialog;