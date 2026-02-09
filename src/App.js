import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ArmyListProvider } from './contexts/ArmyListContext';
import ListBuilderPage from './data/pages/ListBuilderPage';
import CodexSelectorPage from './data/pages/CodexSelectorPage';

// ✅ Import direct des codex
import codexOrks from './data/codexes/gargants-orkimedes.json';
import codexTau from './data/codexes/empire-tau.json';
import codexEldarsNoirs from './data/codexes/eldars-noirs.json';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4a7c59',
    },
  },
});

// ✅ Mapping des codex
const CODEX_MAP = {
  'gargants_orkimedes': codexOrks,
  'empire_tau': codexTau,
  'eldars_noirs': codexEldarsNoirs,
};

function App() {
  const [selectedCodexId, setSelectedCodexId] = useState(null);
  const [codex, setCodex] = useState(null);

  useEffect(() => {
    if (!selectedCodexId) return;

    // Charger le codex depuis le mapping
    const codexData = CODEX_MAP[selectedCodexId];
    if (codexData) {
      setCodex(codexData);
    } else {
      console.error('Codex non trouvé:', selectedCodexId);
    }
  }, [selectedCodexId]);

  const handleSelectCodex = (codexId) => {
    setSelectedCodexId(codexId);
  };

  const handleRetourSelection = () => {
    setSelectedCodexId(null);
    setCodex(null);
  };

  if (!selectedCodexId) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CodexSelectorPage onSelectCodex={handleSelectCodex} />
      </ThemeProvider>
    );
  }

  if (!codex) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* Bouton retour */}
      <Box sx={{ position: 'fixed', top: 16, left: 16, zIndex: 1000 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleRetourSelection}
        >
          Changer de codex
        </Button>
      </Box>

      <ArmyListProvider codex={codex}>
        <ListBuilderPage codex={codex} />
      </ArmyListProvider>
    </ThemeProvider>
  );
}

export default App;