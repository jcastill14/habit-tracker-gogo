import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getHabits, createHabit, addHabit, updateHabit, deleteHabit
} from '../utils/storage';
import {
  requestNotificationPermission, scheduleHabitNotifications, clearScheduledNotifications
} from '../utils/notifications';

const EMOJIS = ['💪', '📚', '🧘', '🏃', '💧', '🥗', '😴', '✍️', '🎯', '🎸', '🎨', '💻', '🌿', '🧹', '💊', '🚴', '🏋️', '🧠', '🌅', '🙏', '❤️', '⭐', '🔥', '✨'];

const COLORS = [
  '#00e5a0', '#6b8aff', '#ff6b9d', '#ffd166', '#ff8c42',
  '#a8e6cf', '#c9b1ff', '#ff9a9e', '#43e97b', '#fa709a',
  '#4facfe', '#f093fb', '#f5576c', '#4ade80', '#f59e0b',
];

export default function AddEditHabit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('⭐');
  const [color, setColor] = useState('#00e5a0');
  const [goal, setGoal] = useState(5);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifTime, setNotifTime] = useState('09:00');
  const [endOfDay, setEndOfDay] = useState(true);
  const [endOfDayTime, setEndOfDayTime] = useState('21:00');
  const [streakAlert, setStreakAlert] = useState(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const h = getHabits().find((x) => x.id === id);
      if (h) {
        setName(h.name);
        setEmoji(h.emoji);
        setColor(h.color);
        setGoal(h.goal);
        if (h.notifications) {
          setNotifEnabled(h.notifications.enabled || false);
          setNotifTime(h.notifications.time || '09:00');
          setEndOfDay(h.notifications.endOfDayAlert !== false);
          setEndOfDayTime(h.notifications.endOfDayTime || '21:00');
          setStreakAlert(h.notifications.streakAlertDays || 3);
        }
      }
    }
  }, [id, isEdit]);

  const handleToggleNotif = async (val) => {
    if (val && Notification.permission !== 'granted') {
      const result = await requestNotificationPermission();
      if (result !== 'granted') return;
    }
    setNotifEnabled(val);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    setLoading(true);

    const notifications = {
      enabled: notifEnabled,
      time: notifTime,
      endOfDayAlert: endOfDay,
      endOfDayTime,
      streakAlertDays: parseInt(streakAlert),
    };

    if (isEdit) {
      updateHabit(id, { name: name.trim(), emoji, color, goal: parseInt(goal), notifications });
      const updated = getHabits().find((x) => x.id === id);
      clearScheduledNotifications(id);
      if (updated) scheduleHabitNotifications(updated);
    } else {
      const h = createHabit(name.trim(), emoji, color);
      h.goal = parseInt(goal);
      h.notifications = notifications;
      addHabit(h);
      scheduleHabitNotifications(h);
    }
    navigate('/');
  };

  const handleDelete = () => {
    if (window.confirm(`¿Eliminar el hábito "${name}"? Se perderá todo el historial.`)) {
      clearScheduledNotifications(id);
      deleteHabit(id);
      navigate('/');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
        <h1 className="page-title" style={{ fontSize: 20 }}>
          {isEdit ? 'Editar hábito' : 'Nuevo hábito'}
        </h1>
      </div>

      {/* Name */}
      <div className="form-section">
        <label className="form-label">Nombre del hábito</label>
        <input
          className="form-input"
          placeholder="Ej: Ejercicio, Leer, Meditar..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />
      </div>

      {/* Emoji */}
      <div className="form-section">
        <label className="form-label">Icono</label>
        <div className="emoji-grid">
          {EMOJIS.map((e) => (
            <button
              key={e}
              className={`emoji-btn${emoji === e ? ' selected' : ''}`}
              onClick={() => setEmoji(e)}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <div className="form-section">
        <label className="form-label">Color</label>
        <div className="color-grid">
          {COLORS.map((c) => (
            <div
              key={c}
              className={`color-swatch${color === c ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
      </div>

      {/* Goal */}
      <div className="form-section">
        <label className="form-label">Meta semanal (días)</label>
        <div className="form-row">
          {[1, 2, 3, 4, 5, 6, 7].map((n) => (
            <button
              key={n}
              onClick={() => setGoal(n)}
              style={{
                flex: 1,
                padding: '12px 4px',
                background: goal === n ? color : 'var(--bg3)',
                border: `1px solid ${goal === n ? color : 'var(--border)'}`,
                borderRadius: 10,
                color: goal === n ? 'var(--bg)' : 'var(--text2)',
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="form-section">
        <label className="form-label">Notificaciones</label>

        <div className="toggle-row">
          <div className="toggle-info">
            <div className="toggle-title">Activar recordatorios</div>
            <div className="toggle-desc">Recibe notificaciones para este hábito</div>
          </div>
          <button
            className={`toggle${notifEnabled ? ' on' : ''}`}
            onClick={() => handleToggleNotif(!notifEnabled)}
          />
        </div>

        {notifEnabled && (
          <>
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 10 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>Hora del recordatorio diario</label>
              <input
                type="time"
                className="form-input"
                value={notifTime}
                onChange={(e) => setNotifTime(e.target.value)}
                style={{ padding: '10px 12px' }}
              />
            </div>

            <div className="toggle-row">
              <div className="toggle-info">
                <div className="toggle-title">Recordatorio fin del día</div>
                <div className="toggle-desc">Si no completaste el hábito</div>
              </div>
              <button
                className={`toggle${endOfDay ? ' on' : ''}`}
                onClick={() => setEndOfDay(!endOfDay)}
              />
            </div>

            {endOfDay && (
              <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14, marginBottom: 10 }}>
                <label className="form-label" style={{ marginBottom: 6 }}>Hora del recordatorio nocturno</label>
                <input
                  type="time"
                  className="form-input"
                  value={endOfDayTime}
                  onChange={(e) => setEndOfDayTime(e.target.value)}
                  style={{ padding: '10px 12px' }}
                />
              </div>
            )}

            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: 14 }}>
              <label className="form-label" style={{ marginBottom: 6 }}>
                Alerta si no se completa después de X días
              </label>
              <div className="form-row">
                {[2, 3, 5, 7].map((n) => (
                  <button
                    key={n}
                    onClick={() => setStreakAlert(n)}
                    style={{
                      flex: 1,
                      padding: '10px 4px',
                      background: streakAlert === n ? color : 'var(--bg4)',
                      border: `1px solid ${streakAlert === n ? color : 'var(--border)'}`,
                      borderRadius: 10,
                      color: streakAlert === n ? 'var(--bg)' : 'var(--text2)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {n}d
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="form-section">
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim() || loading}>
          {isEdit ? 'Guardar cambios' : 'Crear hábito'}
        </button>
      </div>

      {isEdit && (
        <div className="form-section">
          <button className="btn btn-danger" onClick={handleDelete}>
            Eliminar hábito
          </button>
        </div>
      )}
    </div>
  );
}
