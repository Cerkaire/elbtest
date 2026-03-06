import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Outlet, useOutletContext, useSearchParams } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { ArmyListProvider } from './contexts/ArmyListContext';
import BottomNav from './shared/components/Layout/BottomNav';
import ListBuilderPage from './data/pages/ListBuilderPage';
import ListPreviewPage from './data/pages/ListPreviewPage';
import ListPrintPage from './data/pages/ListPrintPage';
import CodexSelectorPage from './data/pages/CodexSelectorPage';
import ReglesPage from './data/pages/RulesPage';
import MesListesPageComponent from './data/pages/MesListesPage';
import RulesPage from './data/pages/RulesPage';

// Import direct des codex
import codexOrks from './data/codexes/gargants-orkimedes.json';
import codexOrksGhazghkull from './data/codexes/orks-ghazghkull.json';
import codexTau from './data/codexes/empire-tau.json';
import codexEldarsNoirs from './data/codexes/eldars-noirs.json';
import codexEldarsBielTan from './data/codexes/eldars-biel-tan.json';
import codexAdeptusAstartes from './data/codexes/adeptus-astartes.json';
import codexTyranides from './data/codexes/tyranides.json';
import codexBloodAngels from './data/codexes/blood-angels.json';
import codexDarkAngels from './data/codexes/dark-angels.json';
import codexLegionDacier from './data/codexes/legion-dacier.json';
import codexDeathKorps from './data/codexes/death-korps-of-krieg.json';
import codexParasElyseens from './data/codexes/paras-elyseens.json';
import codexVostroyens from './data/codexes/premier-nes-vostroyens.json';
import codexSororitas from './data/codexes/adeptus-sororitas.json';
import codexArbites from './data/codexes/adeptus-arbites.json';
import codexChevaliers from './data/codexes/chevaliers-imperiaux.json';
import codexMechanicus from './data/codexes/adeptus-mechanicus.json';
import codexImperialFist from './data/codexes/imperial-fist.json';
import codexRavenGuard from './data/codexes/raven-guard.json';
import codexBlackTemplar from './data/codexes/black-templar.json';
import codexSpaceWolves from './data/codexes/space-wolves.json';
import codexWhiteScars from './data/codexes/white-scars.json';
import codexSalamanders from './data/codexes/salamanders.json';
import codexNecrons from './data/codexes/necrons.json';
import codexSquats from './data/codexes/squats.json';
import codexBlackLegion from './data/codexes/black-legion.json';
import codexThousandSons from './data/codexes/thousand-sons.json';
import codexDeathGuard from './data/codexes/death-guard.json';
import codexWorldEaters from './data/codexes/world-eaters.json';
import codexIronWarriors from './data/codexes/iron-warriors.json';
import codexEgaresDamnes from './data/codexes/egares-et-damnes.json';
import codexLegionTitanique from './data/codexes/legion-titanique.json';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4a7c59',
    },
  },
});

// Mapping des codex
const CODEX_MAP = {
  'gargants_orkimedes': codexOrks,
  'orks_ghazghkull': codexOrksGhazghkull,
  'empire_tau': codexTau,
  'eldars_noirs': codexEldarsNoirs,
  'eldars_biel_tan': codexEldarsBielTan,
  'adeptus_astartes': codexAdeptusAstartes,
  'tyranides': codexTyranides,
  'blood_angels': codexBloodAngels,
  'dark_angels': codexDarkAngels,
  'legion_dacier': codexLegionDacier,
  'death_korps_krieg': codexDeathKorps,
  'paras_elyseens': codexParasElyseens,
  'premier_nes_vostroyens': codexVostroyens,
  'adeptus_sororitas': codexSororitas,
  'adeptus_arbites': codexArbites,
  'chevaliers_imperiaux': codexChevaliers,
  'adeptus_mechanicus': codexMechanicus,
  'imperial_fist': codexImperialFist,
  'raven_guard': codexRavenGuard,
  'black_templar': codexBlackTemplar,
  'space_wolves': codexSpaceWolves,
  'white_scars': codexWhiteScars,
  'salamanders': codexSalamanders,
  'necrons': codexNecrons,
  'squats': codexSquats,
  'black_legion': codexBlackLegion,
  'thousand_sons': codexThousandSons,
  'death_guard': codexDeathGuard,
  'world_eaters': codexWorldEaters,
  'iron_warriors': codexIronWarriors,
  'egares_et_damnes': codexEgaresDamnes,
  'legion_titanique': codexLegionTitanique
};

// Page Home avec navigation vers le builder
function HomePage() {
  const navigate = useNavigate();

  const handleSelectCodex = (codexId) => {
    navigate(`/builder/${codexId}`);
  };


  return <CodexSelectorPage onSelectCodex={handleSelectCodex} />;
}

// Layout partagé pour builder et preview (ArmyListProvider commun)
function BuilderLayout() {
  const { codexId } = useParams();
  const [searchParams] = useSearchParams();
  const initialListId = searchParams.get('loadListId');
  const codex = CODEX_MAP[codexId];

  if (!codex) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        Codex non trouvé : {codexId}
      </div>
    );
  }

  return (
    <ArmyListProvider codex={codex} initialListId={initialListId}>
      <Outlet context={{ codex }} />
    </ArmyListProvider>
  );
}

// Wrappers pour passer le codex depuis le contexte Outlet
function BuilderPage() {
  const { codex } = useOutletContext();
  return <ListBuilderPage codex={codex} />;
}

function PreviewPage() {
  const { codex } = useOutletContext();
  return <ListPreviewPage codex={codex} />;
}

function PrintPage() {
  const { codex } = useOutletContext();
  return <ListPrintPage codex={codex} />;
}

// Page Mes Listes
function MesListesPage() {
  return <MesListesPageComponent codexMap={CODEX_MAP} />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <BottomNav />
          <Box sx={{ pb: 9 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/mes-listes" element={<MesListesPage />} />
              <Route path="/builder/:codexId" element={<BuilderLayout />}>
                <Route index element={<BuilderPage />} />
                <Route path="preview" element={<PreviewPage />} />
                <Route path="print" element={<PrintPage />} />
              </Route>
              <Route path="/rules" element={<RulesPage />} />
            </Routes>
          </Box>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
