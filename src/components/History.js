import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHabits, isCompleted, getCompletionsByHabit } from '../utils/storage';

export default function History() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [habit, setHabit] = useState(null);
  const [months, setMonths] = useState([]);

  useEffect(() => {
    const h = getHabits().find((x) => x.id === id);
    if (!h) { navigate('/'); return; }
    setHabit(h);

    // Build last 6 months
    const completions = getCompletionsByHabit(h.id);
    const today = new Date();
    const result = [];

    for (let m = 5; m >= 0; m--) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const label = d.toLocaleDateString('es', { month: 'long', year: 'numeric' });
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDow = new Date(year, month, 1).getDay(); // 0=sun
      const offset = (firstDow + 6) % 7; // monday-based

      const days = [];
      // Add blank cells for offset
      for (let i = 0; i < offset; i++) days.push(null);
      for (let day = 1; day <= daysInMonth; day++) {
        const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const todayStr = today.toISOString().split('T')[0];
        days.push({
          day,
          ds,
          done: !!completions[ds],
          future: ds > todayStr,
        });
      }
      result.push({ label, days });
    }
    setMonths(result);
  }, [id, navigate]);

  if (!habit) return null;

  const totalDone = Object.keys(getCompletionsByHabit(habit.id)).length;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800 }}>
            {habit.emoji} Historial
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{totalDone} días totales</div>
        </div>
      </div>

      <div style={{ padding: '0 16px 24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {habit.name}
        </h2>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>Últimos 6 meses</p>
      </div>

      {months.map(({ label, days }) => {
        const doneDays = days.filter((d) => d && d.done).length;
        const totalReal = days.filter((d) => d !== null).length;
        return (
          <div key={label} style={{ padding: '0 16px 28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, textTransform: 'capitalize' }}>
                {label}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                {doneDays}/{totalReal} días
              </span>
            </div>

            {/* Day labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 }}>
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d) => (
                <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text3)', fontWeight: 600 }}>
                  {d}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {days.map((cell, i) => {
                if (!cell) {
                  return <div key={`blank-${i}`} style={{ aspectRatio: '1' }} />;
                }
                return (
                  <div
                    key={cell.ds}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 8,
                      background: cell.done
                        ? habit.color
                        : cell.future
                        ? 'transparent'
                        : 'var(--bg3)',
                      border: cell.done
                        ? 'none'
                        : cell.future
                        ? '1px dashed var(--border)'
                        : '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      color: cell.done ? 'var(--bg)' : 'var(--text3)',
                      fontWeight: 600,
                      opacity: cell.future ? 0.3 : 1,
                    }}
                    title={cell.ds}
                  >
                    {cell.day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
