import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const mapping = {
    '/feed': 0,
    '/search': 1,
    '/log-workout': 2,
    '/groups': 3,
    '/profile': 4,
  };
  const [value, setValue] = React.useState(mapping[location.pathname] || 0);

  const handleChange = (_, newValue) => {
    setValue(newValue);
    const paths = ['/feed', '/search', '/log-workout', '/groups', '/profile'];
    navigate(paths[newValue]);
  };

  return (
    <Paper 
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} 
      elevation={3}
    >
      <BottomNavigation value={value} onChange={handleChange}>
        <BottomNavigationAction label="Home" icon={<HomeIcon />} />
        <BottomNavigationAction label="Search" icon={<SearchIcon />} />
        <BottomNavigationAction label="Log" icon={<FitnessCenterIcon />} />
        <BottomNavigationAction label="Groups" icon={<GroupIcon />} />
        <BottomNavigationAction label="Profile" icon={<PersonIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
