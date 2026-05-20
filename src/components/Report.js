import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHabits, getCompletionsByHabit, getStreak, getAllTimeStats, getWeekDates, formatDate, getWeeklyProgress } from '../utils/storage';

export default function Report() {
  const navigate = useNavigate();
  const [habits, setHabits] = useState([]);
  const [period, setPeriod] = useState('week'); // week | month | all

  useEffect(() => {
    setHabits(getHabits());
  }, []);

  const getCompletionRate = (habitId) => {
    const completions = getCompletionsByHabit(habitId);
    const dates = Object.keys(completions);
    if (!dates.length) return 0;

    const today = new Date();
    let totalDays;
    let doneDays;

    if (period === 'week') {
      const weekDates = getWeekDates();
      totalDays = weekDates.filter((d) => new Date(formatDate(d) + 'T00:00:00') <= today).length;
      doneDays = getWeeklyProgress(habitId, weekDates);
    } else if (period === 'month') {
      const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      totalDays = today.getDate();
      doneDays = dates.filter((d) => {
        const dd = new Date(d + 'T00:00:00');
        return dd >= firstOfMonth && dd <= today;
      }).length;
    } else {
      const firstDate = new Date(Math.min(...dates.map((d) => new Date(d + 'T00:00:00'))));
      const diffDays = Math.ceil((today - firstDate) / (1000 * 60 * 60 * 24)) + 1;
      totalDays = diffDays;
      doneDays = dates.length;
    }

    return totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;
  };

  const totalHabits = habits.length;
  const today = formatDate(new Date());
  const completedToday = habits.filter((h) => {
    const completions = getCompletionsByHabit(h.id);
    return !!completions[today];
  }).length;

  const avgRate = totalHabits > 0
    ? Math.round(habits.reduce((sum, h) => sum + getCompletionRate(h.id), 0) / totalHabits)
    : 0;

  const topHabit = habits.reduce((best, h) => {
    const rate = getCompletionRate(h.id);
    return rate > (best.rate || 0) ? { ...h, rate } : best;
  }, {});

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reporte</h1>
          <p className="page-subtitle">Tu resumen general</p>
        </div>
      </div>

      {habits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <div className="empty-title">Sin datos aún</div>
          <p className="empty-desc">Agrega hábitos y empieza a trackear para ver tu reporte.</p>
        </div>
      ) : (
        <>
          {/* Period selector */}
          <div style={{ padding: '0 16px', marginBottom: 20 }}>
            <div style={{
              display: 'flex',
              background: 'var(--bg3)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 4,
              gap: 4,
            }}>
              {[
                { key: 'week', label: 'Esta semana' },
                { key: 'month', label: 'Este mes' },
                { key: 'all', label: 'Todo' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  style={{
                    flex: 1,
                    padding: '10px 8px',
                    borderRadius: 8,
                    border: 'none',
                    background: period === key ? 'var(--accent)' : 'transparent',
                    color: period === key ? 'var(--bg)' : 'var(--text2)',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Summary cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{completedToday}/{totalHabits}</div>
              <div className="stat-label">✅ Completados hoy</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{avgRate}%</div>
              <div className="stat-label">📈 Tasa promedio</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totalHabits}</div>
              <div className="stat-label">🎯 Hábitos activos</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">
                {topHabit.emoji || '?'}
              </div>
              <div className="stat-label">🏆 Mejor hábito<br /><span style={{ color: 'var(--text)', fontSize: 11 }}>{topHabit.name || ''}</span></div>
            </div>
          </div>

          {/* Per-habit breakdown */}
          <div className="section-head">
            <span className="section-title">Por hábito</span>
          </div>

          <div style={{ padding: '0 16px' }}>
            {habits
              .map((h) => ({ ...h, rate: getCompletionRate(h.id) }))
              .sort((a, b) => b.rate - a.rate)
              .map((h) => {
                const stats = getAllTimeStats(h.id);
                return (
                  <div
                    key={h.id}
                    className="report-habit-row"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/habit/${h.id}`)}
                  >
                    <span style={{ fontSize: 28 }}>{h.emoji}</span>
                    <div className="report-habit-info">
                      <div className="report-habit-name">{h.name}</div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          🔥 {stats.streak} racha
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                          ✅ {stats.total} total
                        </span>
                      </div>
                      <div className="progress-bar-wrap">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${h.rate}%`, '--bar-color': h.color }}
                        />
                      </div>
                    </div>
                    <div className="report-percent" style={{ color: h.color }}>{h.rate}%</div>
                  </div>
                );
              })}
          </div>

          {/* Export data */}
          <div style={{ padding: '24px 16px 0' }}>
            <button
              className="btn btn-ghost"
              onClick={() => {
                const { exportData } = require('../utils/storage');
                const data = exportData();
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gogo-habits-backup.json';
                a.click();
              }}
            >
              📤 Exportar datos (backup)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
