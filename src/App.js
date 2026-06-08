import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import HabitDetail from './components/HabitDetail';
import AddEditHabit from './components/AddEditHabit';
import History from './components/History';
import Report from './components/Report';
import Settings from './components/Settings';
import {
  registerServiceWorker,
  scheduleAllHabitNotifications,
  checkStreakAlerts,
  subscribeToWebPush,
  syncToServer,
  getNotificationPermission,
} from './utils/notifications';
import { getHabits, getCompletions, getStreak, isCompleted, formatDate } from './utils/storage';
import './styles/global.css';

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isReport = location.pathname === '/report';

  return (
    <nav className="bottom-nav">
      <button className={`nav-btn ${isHome ? 'active' : ''}`} onClick={() => navigate('/')} aria-label="Inicio">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9,22 9,12 15,12 15,22"/>
        </svg>
        <span>Inicio</span>
      </button>

      <button className="nav-btn add-btn" onClick={() => navigate('/add')} aria-label="Agregar hábito">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <button className={`nav-btn ${isReport ? 'active' : ''}`} onClick={() => navigate('/report')} aria-label="Reportes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span>Reporte</span>
      </button>
    </nav>
  );
}

function App() {
  const [habitsLoaded, setHabitsLoaded] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await registerServiceWorker();
        const habits = getHabits();

        if (habits.length > 0) {
          scheduleAllHabitNotifications(habits);
          checkStreakAlerts(habits, getStreak, isCompleted, formatDate);
        }

        // Only try push if notifications are supported and granted
        const permission = getNotificationPermission();
        if (permission === 'granted') {
          await subscribeToWebPush();
          await syncToServer(habits, getCompletions());
        }
      } catch (err) {
        console.error('App init error:', err);
      } finally {
        setHabitsLoaded(true);
      }
    };
    init();
  }, []);

  if (!habitsLoaded) return null;

  return (
    <Router>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/habit/:id" element={<HabitDetail />} />
          <Route path="/add" element={<AddEditHabit />} />
          <Route path="/edit/:id" element={<AddEditHabit />} />
          <Route path="/history/:id" element={<History />} />
          <Route path="/report" element={<Report />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <NavBar />
      </div>
    </Router>
  );
}

export default App;
