import React from 'react';
import { Box, Button } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from 'react-router-dom';
import { useArmyList } from '../../contexts/ArmyListContext';
import caracData from '../stats/carac.json';

const trouverStats = (factionName, uniteName) => {
    const factionEntry = caracData.find(
        f => f.faction.toLowerCase() === factionName.toLowerCase()
    );
    if (!factionEntry) return null;
    const stats = factionEntry.stat;
    let found = stats.find(s => s.Nom === uniteName);
    if (found) return found;
    const lower = uniteName.toLowerCase();
    found = stats.find(s => s.Nom.toLowerCase() === lower);
    if (found) return found;
    found = stats.find(
        s => s.Nom.toLowerCase().includes(lower) || lower.includes(s.Nom.toLowerCase())
    );
    return found || null;
};

const thStyle = {
    padding: '4px 6px',
    textAlign: 'left',
    fontWeight: 'bold',
    borderBottom: '2px solid #999',
    backgroundColor: '#f0f0f0',
    fontSize: '9pt'
};
const tdStyle = { padding: '3px 6px', verticalAlign: 'top', fontSize: '9pt' };

function ListPrintPage({ codex }) {
    const { codexId } = useParams();
    const navigate = useNavigate();
    const { liste, calculerCoutTotal } = useArmyList();

    const factionName = codex.codex.faction;

    const trouverItemsDansCodex = (formationId, uniteId, optionId) => {
        for (const groupe of codex.groupes) {
            const formation = groupe.formations.find(f => f.id === formationId);
            if (formation) {
                const unite = formation.unites?.find(u => u.id === uniteId);
                if (unite?.options) {
                    const option = unite.options.find(o => o.id === optionId);
                    if (option) return option.items || [];
                }
            }
        }
        return [];
    };

    const calculerCoutFormation = (formation) => {
        let cout = formation.cout;
        formation.unites?.forEach(unite => {
            unite.options?.forEach(option => {
                if (option.itemSelectionne) {
                    const items = trouverItemsDansCodex(formation.formationId, unite.uniteId, option.optionId);
                    const item = items.find(i => i.id === option.itemSelectionne);
                    if (item) cout += item.cout;
                }
            });
        });
        formation.ameliorations?.forEach(amelio => {
            const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
            if (amelioDef) {
                cout += amelioDef.cout_par_unite
                    ? amelioDef.cout * (amelio.quantite || 1)
                    : amelioDef.cout;
            }
        });
        return cout;
    };

    const collecterToutesLesUnites = () => {
        const seen = new Set();
        const unites = [];
        liste.formations.forEach(formation => {
            (formation.unites || []).filter(u => !u.remplace).forEach(u => {
                if (seen.has(u.uniteId)) return;
                seen.add(u.uniteId);
                const stats = trouverStats(factionName, u.nom);
                if (stats) unites.push({ key: u.uniteId, stats });
            });
            (formation.ameliorations || []).forEach(amelio => {
                const amelioDef = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                amelioDef?.unites?.forEach(au => {
                    if (seen.has(au.id)) return;
                    seen.add(au.id);
                    const stats = trouverStats(factionName, au.name);
                    if (stats) unites.push({ key: au.id, stats });
                });
            });
        });
        return unites;
    };

    const toutesLesUnites = collecterToutesLesUnites();
    const today = new Date().toLocaleDateString('fr-FR');

    const blm = liste.formations.length > 0
        ? liste.formations.reduce((max, f) =>
            calculerCoutFormation(f) > calculerCoutFormation(max) ? f : max
        )
        : null;

    return (
        <>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    header { display: none !important; }
                    .bottom-nav-bar { display: none !important; }
                    @page { size: A4 portrait; margin: 15mm; }
                    @page landscape-page { size: A4 landscape; margin: 10mm; }
                    .page-break { page-break-before: always; }
                    .landscape-page { page: landscape-page; }
                    body { font-size: 11pt; }
                    .print-container { padding: 0 !important; box-shadow: none !important; }
                }
                @media screen {
                    .print-container {
                        max-width: 210mm;
                        margin: 0 auto;
                        padding: 10mm 15mm;
                        background: white;
                        box-shadow: 0 0 15px rgba(0,0,0,0.2);
                        min-height: 297mm;
                    }
                }
            `}</style>

            {/* Barre de contrôle (écran seulement) */}
            <Box
                className="no-print"
                sx={{
                    p: 1.5,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Button
                    size="small"
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(`/builder/${codexId}`)}
                >
                    Retour
                </Button>
                <Button
                    size="small"
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={() => window.print()}
                >
                    Imprimer
                </Button>
            </Box>

            <div className="print-container">

                {/* ========== PAGE 1 : LISTE DÉTAILLÉE ========== */}
                <div>
                    {/* En-tête */}
                    <div style={{ borderBottom: '3px solid #333', marginBottom: '12px', paddingBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <img
                                src={`${process.env.PUBLIC_URL}/assets/images/logo.png`}
                                alt="Epic List Builder"
                                style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                            />
                            <h1 style={{ fontSize: '18pt', margin: 0 }}>{codex.codex.name}</h1>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <h2 style={{ fontSize: '13pt', fontWeight: 'normal', margin: 0 }}>{liste.nom}</h2>
                            <span style={{ fontSize: '9pt', color: '#666' }}>{today}</span>
                        </div>
                        <div style={{ marginTop: '4px', fontSize: '11pt' }}>
                            <strong>{calculerCoutTotal()} pts</strong>
                            <span style={{ color: '#666', marginLeft: '12px' }}>{liste.formations.length} formation{liste.formations.length > 1 ? 's' : ''}</span>
                            {blm && (
                                <span style={{ marginLeft: '12px', color: '#c62828', fontWeight: 'bold' }}>
                                    BLM : {blm.nom} ({calculerCoutFormation(blm)} pts)
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Formations */}
                    {liste.formations.map((formation, idx) => {
                        const cout = calculerCoutFormation(formation);
                        return (
                            <div
                                key={formation.id}
                                style={{
                                    marginBottom: '10px',
                                    paddingBottom: '8px',
                                    borderBottom: '1px solid #ddd'
                                }}
                            >
                                {/* Nom + coût */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                    <span style={{ fontSize: '11pt', fontWeight: 'bold' }}>
                                        {idx + 1}. {formation.nom}
                                        {formation.varianteName && (
                                            <span style={{ fontWeight: 'normal', fontSize: '9pt', color: '#555', marginLeft: '6px' }}>
                                                ({formation.varianteName})
                                            </span>
                                        )}
                                    </span>
                                    <span style={{ fontSize: '10pt', fontWeight: 'bold', whiteSpace: 'nowrap', marginLeft: '8px' }}>
                                        {cout} pts
                                    </span>
                                </div>

                                {/* Composition */}
                                <div style={{ marginLeft: '16px', marginTop: '3px', fontSize: '9pt', color: '#333' }}>
                                    {formation.unites?.filter(u => !u.remplace).map(u => (
                                        <span key={u.id} style={{ marginRight: '14px' }}>
                                            {u.nombre > 1 ? `${u.nombre}× ` : ''}{u.nom}
                                        </span>
                                    ))}
                                </div>

                                {/* Améliorations */}
                                {formation.ameliorations?.length > 0 && (
                                    <div style={{ marginLeft: '16px', marginTop: '2px', fontSize: '9pt', color: '#555', fontStyle: 'italic' }}>
                                        {formation.ameliorations.map(amelio => {
                                            const def = codex.ameliorations.find(a => a.id === amelio.ameliorationId);
                                            if (!def) return null;
                                            const q = amelio.quantite || 1;
                                            const suffix = amelio.choixName ? ` : ${amelio.choixName}` : '';
                                            const coutAmelio = def.cout_par_unite ? def.cout * q : def.cout;
                                            return (
                                                <span key={amelio.id} style={{ marginRight: '10px' }}>
                                                    + {q > 1 ? `${q}× ` : ''}{def.name}{suffix} ({coutAmelio} pts)
                                                </span>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ========== PAGE 2 : CARACTÉRISTIQUES ========== */}
                {toutesLesUnites.length > 0 && (
                    <div className="page-break landscape-page">
                        <div style={{ borderBottom: '3px solid #333', marginBottom: '12px', paddingBottom: '6px' }}>
                            <h2 style={{ fontSize: '16pt', margin: 0 }}>Caractéristiques des unités</h2>
                            <p style={{ fontSize: '9pt', color: '#666', margin: '2px 0 0 0' }}>
                                {codex.codex.name} — {liste.nom}
                            </p>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Nom</th>
                                    <th style={thStyle}>Type</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Vit.</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>Blind.</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>CC</th>
                                    <th style={{ ...thStyle, textAlign: 'center' }}>FF</th>
                                    <th style={thStyle}>Armement</th>
                                    <th style={thStyle}>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                {toutesLesUnites.map(({ key, stats }) => (
                                    <tr key={key} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                        <td style={{ ...tdStyle, fontWeight: 'bold' }}>{stats.Nom}</td>
                                        <td style={tdStyle}>{stats.Type}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{stats.Vitesse}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{stats.Blindage}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{stats.CC}</td>
                                        <td style={{ ...tdStyle, textAlign: 'center' }}>{stats.FF}</td>
                                        <td style={tdStyle}>
                                            {stats.armes?.map((arme, i) => (
                                                <div key={i} style={{ fontSize: '8pt' }}>
                                                    <em>{arme.Arme}</em>{' '}
                                                    <span style={{ color: '#555' }}>{arme.Portée}</span>{' — '}
                                                    {arme['Puissance de feu']}
                                                </div>
                                            ))}
                                        </td>
                                        <td style={{ ...tdStyle, fontStyle: 'italic', fontSize: '8pt', color: '#555' }}>
                                            {stats.Notes}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            </div>
        </>
    );
}

export default ListPrintPage;
