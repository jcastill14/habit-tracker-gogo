import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getHabits, getWeekDates, formatDate, toggleCompletion,
  isCompleted, getWeeklyProgress
} from '../utils/storage';
import { requestNotificationPermission } from '../utils/notifications';

const DAY_LABELS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [weekDates, setWeekDates] = useState([]);
  const [completions, setCompletions] = useState({});
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [toast, setToast] = useState({ msg: '', visible: false });

  const today = formatDate(new Date());

  const reload = useCallback(() => {
    setHabits(getHabits());
  }, []);

  useEffect(() => {
    reload();
    // Show notification banner if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      setShowNotifBanner(true);
    }
  }, [reload]);

  useEffect(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    setWeekDates(getWeekDates(ref));
  }, [weekOffset]);

  useEffect(() => {
    // Build completions map for current week
    const map = {};
    habits.forEach((h) => {
      weekDates.forEach((d) => {
        const ds = formatDate(d);
        map[`${h.id}_${ds}`] = isCompleted(h.id, ds);
      });
    });
    setCompletions(map);
  }, [habits, weekDates]);

  const handleToggle = (e, habitId, dateStr) => {
    e.stopPropagation();
    const d = new Date(dateStr + 'T00:00:00');
    const todayD = new Date(today + 'T00:00:00');
    if (d > todayD) return; // can't mark future
    toggleCompletion(habitId, dateStr);
    setCompletions((prev) => ({
      ...prev,
      [`${habitId}_${dateStr}`]: !prev[`${habitId}_${dateStr}`],
    }));

    const newVal = !completions[`${habitId}_${dateStr}`];
    if (newVal) {
      const h = habits.find((x) => x.id === habitId);
      showToast(`${h?.emoji} ¡Hábito completado!`);
    }
  };

  const showToast = (msg) => {
    setToast({ msg, visible: true });
    setTimeout(() => setToast({ msg: '', visible: false }), 2000);
  };

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      setShowNotifBanner(false);
      showToast('✅ Notificaciones activadas');
    } else {
      setShowNotifBanner(false);
    }
  };

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'Semana actual';
    if (weekOffset === -1) return 'Semana pasada';
    if (weekDates.length === 0) return '';
    const start = weekDates[0];
    const end = weekDates[6];
    const fmt = (d) => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    return `${fmt(start)} - ${fmt(end)}`;
  };

  const isFuture = (dateStr) => {
    return new Date(dateStr + 'T00:00:00') > new Date(today + 'T00:00:00');
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Bienvenido</h1>
          <p className="page-subtitle">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <button
          className="back-btn"
          onClick={() => navigate('/settings')}
          style={{ gap: 0 }}
          aria-label="Ajustes"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>

      {showNotifBanner && (
        <div className="notif-banner" onClick={handleEnableNotifications}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span>Activa notificaciones para recordatorios de tus hábitos</span>
        </div>
      )}

      {/* Week Selector */}
      <div className="week-selector">
        <button onClick={() => setWeekOffset((o) => o - 1)} aria-label="Semana anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span>{getWeekLabel()}</span>
        <button
          onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
          aria-label="Semana siguiente"
          style={{ opacity: weekOffset >= 0 ? 0.3 : 1 }}
          disabled={weekOffset >= 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🌱</div>
          <div className="empty-title">Sin hábitos todavía</div>
          <p className="empty-desc">
            Presiona el botón <strong>+</strong> para agregar tu primer hábito y comenzar a trackear tu progreso.
          </p>
        </div>
      ) : (
        habits.map((habit) => {
          const weeklyDone = getWeeklyProgress(habit.id, weekDates);
          const onTrack = weeklyDone >= habit.goal;
          return (
            <div
              key={habit.id}
              className="habit-card"
              style={{ '--card-color': habit.color }}
              onClick={() => navigate(`/habit/${habit.id}`)}
            >
              <div className="habit-card-header">
                <div className="habit-name">
                  <span className="habit-emoji">{habit.emoji}</span>
                  {habit.name}
                </div>
                <div className="habit-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </div>

              <div className="week-grid">
                {weekDates.map((date, i) => {
                  const ds = formatDate(date);
                  const done = completions[`${habit.id}_${ds}`];
                  const isToday = ds === today;
                  const future = isFuture(ds);
                  return (
                    <div key={ds} className="week-day">
                      <span className="day-label">{DAY_LABELS[i]}</span>
                      <div
                        className={`day-circle${isToday ? ' today' : ''}${done ? ' completed' : ''}${future ? ' future' : ''}`}
                        onClick={(e) => !future && handleToggle(e, habit.id, ds)}
                      >
                        {done && <CheckIcon />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="habit-footer">
                <div className={`progress-pill${onTrack ? ' on-track' : ''}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  {weeklyDone}/{habit.goal}
                </div>
              </div>
            </div>
          );
        })
      )}

      <div className={`toast${toast.visible ? ' visible' : ''}`}>{toast.msg}</div>
    </div>
  );
}
