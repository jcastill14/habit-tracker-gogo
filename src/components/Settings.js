import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestNotificationPermission, getNotificationPermission } from '../utils/notifications';
import { importData } from '../utils/storage';

export default function Settings() {
  const navigate = useNavigate();
  const [importMsg, setImportMsg] = useState('');

  const notifStatus = getNotificationPermission();

  const handleRequestNotif = async () => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      setImportMsg('✅ Notificaciones activadas');
    } else if (result === 'not-supported') {
      setImportMsg('Para activar notificaciones, instala la app en tu pantalla de inicio primero.');
    } else {
      setImportMsg('Permisos denegados. Actívalos desde ajustes del navegador.');
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
    denied: '❌ Denegadas - activa en ajustes del navegador',
    default: '⚠️ No configuradas',
    'not-supported': '⚠️ Instala la app en pantalla de inicio para activarlas',
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
          <div style={{ fontSize: 14, marginBottom: 8 }}>
            Estado: <strong style={{ color: 'var(--accent)' }}>{notifLabel}</strong>
          </div>
          {notifStatus === 'not-supported' && (
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 10 }}>
              Safari en iPhone solo soporta notificaciones cuando la app está instalada en la pantalla de inicio como PWA.<br/><br/>
              1. Abre esta página en Safari<br/>
              2. Toca el botón compartir ⬆️<br/>
              3. Selecciona "Agregar a pantalla de inicio"<br/>
              4. Abre la app desde el ícono
            </div>
          )}
          {(notifStatus === 'default' || notifStatus === 'granted') && (
            <button className="btn btn-primary" style={{ padding: '10px 16px', fontSize: 14 }} onClick={handleRequestNotif}>
              {notifStatus === 'granted' ? 'Notificaciones activas ✅' : 'Activar notificaciones'}
            </button>
          )}
          {notifStatus === 'denied' && (
            <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
              Ve a Ajustes del iPhone &gt; Safari &gt; y permite notificaciones para este sitio.
            </p>
          )}
        </div>
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

        {importMsg && (
          <div style={{
            padding: '12px 16px',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent-glow)',
            borderRadius: 10,
            fontSize: 13,
            color: 'var(--accent)',
          }}>
            {importMsg}
          </div>
        )}
      </div>

      <div className="divider" />

      <div style={{ padding: '0 16px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>Habit Tracker Gogo</p>
        <p style={{ fontSize: 12, color: 'var(--text3)' }}>
          Todos los datos se guardan localmente en tu dispositivo.<br/>
          Usa Exportar/Importar para transferir entre dispositivos.
        </p>
      </div>
    </div>
  );
}
