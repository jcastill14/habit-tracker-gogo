import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getHabits, getWeekDates, formatDate, toggleCompletion,
  isCompleted, getWeeklyProgress, getStreak, getAllTimeStats
} from '../utils/storage';

const DAY_LABELS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

export default function HabitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState(null);
  const [weekDates, setWeekDates] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [, forceUpdate] = useState(0);
  const today = formatDate(new Date());

  useEffect(() => {
    const h = getHabits().find((x) => x.id === id);
    if (!h) { navigate('/'); return; }
    setHabit(h);
  }, [id, navigate]);

  useEffect(() => {
    const ref = new Date();
    ref.setDate(ref.getDate() + weekOffset * 7);
    setWeekDates(getWeekDates(ref));
  }, [weekOffset]);

  if (!habit) return null;

  const stats = getAllTimeStats(habit.id);
  const weeklyDone = getWeeklyProgress(habit.id, weekDates);
  const streak = getStreak(habit.id);

  const handleToggle = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const todayD = new Date(today + 'T00:00:00');
    if (d > todayD) return;
    toggleCompletion(habit.id, dateStr);
    forceUpdate((n) => n + 1);
  };

  const isFuture = (dateStr) => {
    return new Date(dateStr + 'T00:00:00') > new Date(today + 'T00:00:00');
  };

  const getWeekLabel = () => {
    if (weekOffset === 0) return 'Semana actual';
    if (weekOffset === -1) return 'Semana pasada';
    if (!weekDates.length) return '';
    const fmt = (d) => d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
    return `${fmt(weekDates[0])} - ${fmt(weekDates[6])}`;
  };

  // Last 4 weeks mini heatmap
  const last4Weeks = [];
  for (let w = 3; w >= 0; w--) {
    const ref = new Date();
    ref.setDate(ref.getDate() - w * 7);
    last4Weeks.push(getWeekDates(ref));
  }

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
        <button
          className="back-btn"
          onClick={() => navigate(`/edit/${habit.id}`)}
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'transparent' }}
        >
          Editar
        </button>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 36 }}>{habit.emoji}</span>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>
              {habit.name}
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>Meta: {habit.goal} días por semana</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value" style={{ color: habit.color }}>{streak}</div>
          <div className="stat-label">🔥 Racha actual</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: habit.color }}>{stats.total}</div>
          <div className="stat-label">✅ Total completados</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: habit.color }}>{stats.longestStreak}</div>
          <div className="stat-label">🏆 Racha máxima</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: habit.color }}>{weeklyDone}/{habit.goal}</div>
          <div className="stat-label">📅 Esta semana</div>
        </div>
      </div>

      {/* Weekly grid with navigation */}
      <div className="section-head">
        <span className="section-title">Vista Semanal</span>
        <button className="section-action" onClick={() => navigate(`/history/${habit.id}`)}>
          Ver historial
        </button>
      </div>

      <div className="week-selector" style={{ marginBottom: 12 }}>
        <button onClick={() => setWeekOffset((o) => o - 1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span>{getWeekLabel()}</span>
        <button
          onClick={() => setWeekOffset((o) => Math.min(o + 1, 0))}
          style={{ opacity: weekOffset >= 0 ? 0.3 : 1 }}
          disabled={weekOffset >= 0}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <div
        className="habit-card"
        style={{ '--card-color': habit.color, cursor: 'default' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="week-grid">
          {weekDates.map((date, i) => {
            const ds = formatDate(date);
            const done = isCompleted(habit.id, ds);
            const isToday = ds === today;
            const future = isFuture(ds);
            return (
              <div key={ds} className="week-day">
                <span className="day-label">{DAY_LABELS[i]}</span>
                <div
                  className={`day-circle${isToday ? ' today' : ''}${done ? ' completed' : ''}${future ? ' future' : ''}`}
                  onClick={() => !future && handleToggle(ds)}
                >
                  {done && <CheckIcon />}
                </div>
                <span style={{ fontSize: 9, color: 'var(--text3)' }}>
                  {date.getDate()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4-week mini heatmap */}
      <div style={{ padding: '0 16px', marginTop: 8, marginBottom: 24 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Últimas 4 semanas</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {last4Weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)', width: 28, textAlign: 'right', flexShrink: 0 }}>
                S{4 - wi}
              </span>
              <div style={{ display: 'flex', gap: 4 }}>
                {week.map((d) => {
                  const ds = formatDate(d);
                  const done = isCompleted(habit.id, ds);
                  const future = new Date(ds + 'T00:00:00') > new Date(today + 'T00:00:00');
                  return (
                    <div
                      key={ds}
                      className={`heatmap-cell${done ? ' done' : ''}`}
                      style={{
                        '--cell-color': habit.color,
                        opacity: future ? 0.3 : 1,
                        width: 34,
                        height: 34,
                      }}
                      title={ds}
                    >
                      {done ? '✓' : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
