import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Typography,
  Box
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import ListAltIcon from '@mui/icons-material/ListAlt';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import PreviewIcon from '@mui/icons-material/Preview';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../../../contexts/AuthContext';
import LoginDialog from '../../../components/LoginDialog';

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [loginOpen, setLoginOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  // Detect if we're on a builder route and extract codexId
  const builderMatch = location.pathname.match(/^\/builder\/([^/]+)/);
  const isOnBuilder = !!builderMatch;
  const codexId = builderMatch ? builderMatch[1] : null;
  const isOnPreview = location.pathname.endsWith('/preview');

  const getActiveTab = () => {
    if (location.pathname === '/') return 'home';
    if (isOnPreview) return 'preview';
    if (location.pathname === '/mes-listes' || location.pathname.startsWith('/builder')) return 'list';
    if (location.pathname === '/rules') return 'rules';
    return 'home';
  };

  const handleTabChange = (event, newValue) => {
    if (newValue === 'home') navigate('/');
    else if (newValue === 'list') navigate(isOnBuilder ? `/builder/${codexId}` : '/mes-listes');
    else if (newValue === 'preview') navigate(`/builder/${codexId}/preview`);
    else if (newValue === 'rules') navigate('/rules');
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    try {
      await logout();
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  };

  return (
    <>
      {/* Top bar with login/profile */}
      <AppBar position="fixed" color="default" elevation={1} sx={{ top: 0 }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 48 }}>
          {/* Logo cliquable → accueil */}
          <Box
            component="img"
            src={`${process.env.PUBLIC_URL}/assets/images/logo.png`}
            alt="Epic List Builder"
            onClick={() => navigate('/')}
            sx={{ height: 36, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
          />
          {user ? (
            <>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar
                  src={user.photoURL}
                  sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
                >
                  {user.email?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem disabled>
                  <Typography variant="body2">{user.email}</Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>Déconnexion</MenuItem>
              </Menu>
            </>
          ) : (
            <IconButton onClick={() => setLoginOpen(true)} color="inherit">
              <LoginIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Spacer for top bar */}
      <Box sx={{ height: 48 }} />

      {/* Bottom navigation */}
      <Paper
        className="bottom-nav-bar"
        sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}
        elevation={3}
      >
        <BottomNavigation
          value={getActiveTab()}
          onChange={handleTabChange}
          showLabels
        >
          <BottomNavigationAction value="home" label="Home" icon={<HomeIcon />} />
          <BottomNavigationAction value="list" label={isOnBuilder ? "Builder" : "Mes Listes"} icon={<ListAltIcon />} />
          {isOnBuilder && <BottomNavigationAction value="preview" label="Aperçu" icon={<PreviewIcon />} />}
          <BottomNavigationAction value="rules" label="Règles" icon={<MenuBookIcon />} />
        </BottomNavigation>
      </Paper>


      {/* Login dialog */}
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}

export default BottomNav;