import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestNotificationPermission, getNotificationPermission, subscribeToWebPush, syncToServer } from '../utils/notifications';
import { importData, getHabits, getCompletions } from '../utils/storage';

export default function Settings() {
  const navigate = useNavigate();
  const [importMsg, setImportMsg] = useState('');
  const [notifStatus, setNotifStatus] = useState(getNotificationPermission());

  const handleRequestNotif = async () => {
    const result = await requestNotificationPermission();
    setNotifStatus(result);

    if (result === 'granted') {
      // Subscribe to web push immediately after permission granted
      try {
        const sub = await subscribeToWebPush();
        if (sub) {
          // Also sync habits so server knows what to send
          const habits = getHabits();
          await syncToServer(habits, getCompletions());
          setImportMsg('✅ Notificaciones activadas y registradas en el servidor.');
        } else {
          setImportMsg('✅ Notificaciones activadas. (Push en background puede no estar disponible en este dispositivo)');
        }
      } catch (err) {
        setImportMsg('✅ Notificaciones activadas localmente.');
      }
    } else if (result === 'not-supported') {
      setImportMsg('Para activar notificaciones, instala la app en tu pantalla de inicio primero.');
    } else {
      setImportMsg('Permisos denegados. Actívalos desde Ajustes del iPhone > Notificaciones.');
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importData(ev.target.result);
        setImportMsg('✅ Datos importados correctamente. Recarga la app.');
      } catch {
        setImportMsg('❌ Error al importar. Verifica el archivo.');
      }
    };
    reader.readAsText(file);
  };

  const notifLabel = {
    granted: '✅ Activadas',
    denied: '❌ Denegadas',
    default: '⚠️ No configuradas',
    'not-supported': '⚠️ Instala la app en pantalla de inicio',
  }[notifStatus] || notifStatus;

  return (
    <div className="page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver
        </button>
        <h1 className="page-title" style={{ fontSize: 20 }}>Ajustes</h1>
      </div>

      <div className="form-section">
        <label className="form-label">Notificaciones</label>
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 16,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 14, marginBottom: 12 }}>
            Estado: <strong style={{ color: 'var(--accent)' }}>{notifLabel}</strong>
          </div>

          {notifStatus === 'not-supported' && (
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>
              Safari en iPhone solo soporta notificaciones cuando la app está instalada como PWA.<br/><br/>
              1. Abre esta página en Safari<br/>
              2. Toca el botón compartir ⬆️<br/>
              3. Selecciona "Agregar a pantalla de inicio"<br/>
              4. Abre la app desde el ícono y vuelve aquí
            </div>
          )}

          {notifStatus === 'default' && (
            <button className="btn btn-primary" style={{ padding: '12px 16px', fontSize: 14 }} onClick={handleRequestNotif}>
              🔔 Activar notificaciones
            </button>
          )}

          {notifStatus === 'granted' && (
            <button className="btn btn-ghost" style={{ padding: '12px 16px', fontSize: 14 }} onClick={handleRequestNotif}>
              🔄 Re-registrar en servidor
            </button>
          )}

          {notifStatus === 'denied' && (
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
              Ve a <strong>Ajustes del iPhone &gt; Notificaciones</strong> y activa las notificaciones para esta app.
            </p>
          )}
        </div>

        {importMsg && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-glow)',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--accent)',
            marginBottom: 10,
          }}>
            {importMsg}
          </div>
        )}
      </div>

      <div className="divider" />

      <div className="form-section">
        <label className="form-label">Datos</label>
        <div style={{
          background: 'var(--bg3)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          padding: 16,
          marginBottom: 10,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Importar backup</div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
            Restaura tus datos desde un archivo de exportación.
          </div>
          <label style={{
            display: 'inline-block',
            background: 'var(--bg4)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 16px',
            fontSize: 14,
            cursor: 'pointer',
            color: 'var(--text2)',
          }}>
            📥 Seleccionar archivo
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </label>
        </div>
      </div>

      <div className="divider" />

      <div style={{ padding: '0 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Habit Tracker Gogo</p>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>
          Todos los datos se guardan localmente en tu dispositivo.
        </p>
      </div>
    </div>
  );
}
