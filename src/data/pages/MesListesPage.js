import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    CardActions,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { loadAllListes, deleteListe } from '../../services/listStorageService';

function MesListesPage({ codexMap }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [listes, setListes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [listeASupprimer, setListeASupprimer] = useState(null);

    useEffect(() => {
        loadAllListes(user).then(lists => {
            setListes(lists);
            setLoading(false);
        });
    }, [user]);

    const getCodexName = (codexId) => {
        const codex = codexMap[codexId];
        return codex?.codex?.name || codexId;
    };

    const handleCharger = (liste) => {
        navigate(`/builder/${liste.codexId}?loadListId=${liste.id}`);
    };

    const handleDemanderSuppression = (liste) => {
        setListeASupprimer(liste);
        setDeleteDialogOpen(true);
    };

    const handleConfirmerSuppression = async () => {
        if (listeASupprimer) {
            await deleteListe(listeASupprimer.id, user);
            setListes(prev => prev.filter(l => l.id !== listeASupprimer.id));
        }
        setDeleteDialogOpen(false);
        setListeASupprimer(null);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Typography>Chargement...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography variant="h4" gutterBottom>
                Mes listes
            </Typography>

            {listes.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Aucune liste sauvegardee
                    </Typography>
                    <Typography color="textSecondary">
                        Construisez une liste dans le builder puis sauvegardez-la pour la retrouver ici.
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {listes.map(liste => (
                        <Grid item xs={12} sm={6} md={4} key={liste.id}>
                            <Card variant="outlined">
                                <CardContent>
                                    <Typography variant="h6" noWrap>
                                        {liste.nom}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {getCodexName(liste.codexId)}
                                    </Typography>
                                    <Typography variant="body2" color="primary" sx={{ mt: 1 }}>
                                        {liste.totalPoints || 0} pts
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                                        Modifiee le {formatDate(liste.dateModification)}
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button
                                        size="small"
                                        startIcon={<PlayArrowIcon />}
                                        onClick={() => handleCharger(liste)}
                                    >
                                        Charger
                                    </Button>
                                    <Button
                                        size="small"
                                        color="error"
                                        startIcon={<DeleteIcon />}
                                        onClick={() => handleDemanderSuppression(liste)}
                                    >
                                        Supprimer
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Supprimer la liste</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Voulez-vous vraiment supprimer la liste "{listeASupprimer?.nom}" ?
                        Cette action est irreversible.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Annuler</Button>
                    <Button onClick={handleConfirmerSuppression} color="error">
                        Supprimer
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}

export default MesListesPage;
