import React, { useState, useEffect } from 'react';
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    CardActionArea,
    Grid,
    Chip
} from '@mui/material';

function CodexSelectorPage({ onSelectCodex }) {
    const [codexList, setCodexList] = useState([]);

    useEffect(() => {
        // Charger la liste des codex disponibles
        const loadCodexList = () => {
            const codexes = [
                {
                    id: 'gargants_orkimedes',
                    name: 'Gargants d\'Orkimedes',
                    faction: 'Orks',
                    color: '#4a7c59',
                    version: 'REV-1.0'
                },
                {
                    id: 'empire_tau',
                    name: 'Empire T\'au',
                    faction: 'Tau',
                    color: '#0080c0',
                    version: 'REV-1.3.1'
                },
                {
                    id: 'eldars_noirs',
                    name: 'Eldars Noirs',
                    faction: 'Eldars Noirs',
                    color: '#6100be',
                    version: '1.2'
                }
            ];
            setCodexList(codexes);
        };

        loadCodexList();
    }, []);

    return (
        <Container maxWidth="lg" sx={{ py: 8 }}>
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography variant="h3" gutterBottom>
                    Epic List Builder
                </Typography>
                <Typography variant="h5" color="textSecondary">
                    Sélectionnez un codex
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {codexList.map(codex => (
                    <Grid item xs={12} sm={6} md={4} key={codex.id}>
                        <Card
                            sx={{
                                height: '100%',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 6
                                }
                            }}
                        >
                            <CardActionArea
                                onClick={() => onSelectCodex(codex.id)}
                                sx={{ height: '100%', p: 2 }}
                            >
                                <CardContent>
                                    <Box
                                        sx={{
                                            width: '100%',
                                            height: 150,
                                            bgcolor: codex.color,
                                            borderRadius: 2,
                                            mb: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                                            {codex.faction}
                                        </Typography>
                                    </Box>

                                    <Typography variant="h6" gutterBottom>
                                        {codex.name}
                                    </Typography>

                                    <Chip
                                        label={codex.version}
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
}

export default CodexSelectorPage;