import { useState, useEffect } from 'react';
import axios from 'axios';
import './GestionBloqueos.css';

function GestionBloqueos() {
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState('');
  const [bloqueos, setBloqueos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(false);
  
  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    fecha: '',
    horaInicio: '08:00',
    horaFin: '19:00',
    motivo: 'OCUPADO',
    descripcion: ''
  });

  useEffect(() => {
    cargarProfesionales();
  }, []);

  useEffect(() => {
    if (profesionalSeleccionado) {
      cargarBloqueos();
    }
  }, [profesionalSeleccionado]);

  const cargarProfesionales = async () => {
    try {
      const response = await axios.get('/api/profesionales');
      setProfesionales(response.data);
      if (response.data.length > 0) {
        setProfesionalSeleccionado(response.data[0].id);
      }
    } catch (error) {
      console.error('Error al cargar profesionales:', error);
    }
  };

  const cargarBloqueos = async () => {
    if (!profesionalSeleccionado) return;
    
    setCargando(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];
      const tresMeses = new Date();
      tresMeses.setMonth(tresMeses.getMonth() + 3);
      const fin = tresMeses.toISOString().split('T')[0];

      const response = await axios.get(
        `/api/horarios-bloqueados/profesional/${profesionalSeleccionado}/rango`,
        { params: { fechaInicio: hoy, fechaFin: fin } }
      );
      setBloqueos(response.data);
    } catch (error) {
      console.error('Error al cargar bloqueos:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/api/horarios-bloqueados', {
        profesionalId: parseInt(profesionalSeleccionado),
        ...nuevoBloqueo
      });
      
      alert('✅ Horario bloqueado correctamente');
      setNuevoBloqueo({
        fecha: '',
        horaInicio: '08:00',
        horaFin: '19:00',
        motivo: 'OCUPADO',
        descripcion: ''
      });
      setMostrarFormulario(false);
      cargarBloqueos();
    } catch (error) {
      console.error('Error al crear bloqueo:', error);
      alert('❌ Error al bloquear horario');
    }
  };

  const bloquearDiaCompleto = async () => {
    const fecha = prompt('Ingrese la fecha a bloquear (YYYY-MM-DD):');
    if (!fecha) return;

    const motivo = prompt('Motivo (VACACIONES / OCUPADO / OTRO):') || 'OCUPADO';
    const descripcion = prompt('Descripción (opcional):') || '';

    try {
      await axios.post('/api/horarios-bloqueados/bloquear-dia-completo', null, {
        params: {
          profesionalId: profesionalSeleccionado,
          fecha,
          motivo,
          descripcion
        }
      });
      
      alert('✅ Día bloqueado completamente');
      cargarBloqueos();
    } catch (error) {
      console.error('Error al bloquear día:', error);
      alert('❌ Error al bloquear el día');
    }
  };

  const eliminarBloqueo = async (id) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;

    try {
      await axios.delete(`/api/horarios-bloqueados/${id}`);
      alert('✅ Bloqueo eliminado');
      cargarBloqueos();
    } catch (error) {
      console.error('Error al eliminar bloqueo:', error);
      alert('❌ Error al eliminar bloqueo');
    }
  };

  const getMotivoColor = (motivo) => {
    switch (motivo) {
      case 'VACACIONES': return '#ff9800';
      case 'OCUPADO': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getMotivoIcono = (motivo) => {
    switch (motivo) {
      case 'VACACIONES': return '🏖️';
      case 'OCUPADO': return '🚫';
      default: return '⚠️';
    }
  };

  return (
    <div className="gestion-bloqueos-container">
      <div className="gestion-bloqueos-header">
        <h1>🚫 Gestión de Horarios Bloqueados</h1>
        <p>Bloquea horarios por vacaciones, ocupación u otros motivos</p>
      </div>

      <div className="gestion-bloqueos-content">
        <div className="bloqueos-controls">
          <div className="control-group">
            <label>Profesional:</label>
            <select 
              value={profesionalSeleccionado}
              onChange={(e) => setProfesionalSeleccionado(e.target.value)}
            >
              {profesionales.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.nombre} - {prof.especialidad}
                </option>
              ))}
            </select>
          </div>

          <div className="control-actions">
            <button 
              className="btn-primary"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              {mostrarFormulario ? '❌ Cancelar' : '➕ Bloquear Horario'}
            </button>
            
            <button 
              className="btn-warning"
              onClick={bloquearDiaCompleto}
            >
              📅 Bloquear Día Completo
            </button>
          </div>
        </div>

        {mostrarFormulario && (
          <div className="bloqueo-formulario">
            <h3>Nuevo Bloqueo de Horario</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-field">
                  <label>Fecha:</label>
                  <input
                    type="date"
                    value={nuevoBloqueo.fecha}
                    onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, fecha: e.target.value})}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Hora Inicio:</label>
                  <select
                    value={nuevoBloqueo.horaInicio}
                    onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, horaInicio: e.target.value})}
                  >
                    {Array.from({length: 12}, (_, i) => i + 8).map(h => (
                      <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                        {String(h).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Hora Fin:</label>
                  <select
                    value={nuevoBloqueo.horaFin}
                    onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, horaFin: e.target.value})}
                  >
                    {Array.from({length: 12}, (_, i) => i + 8).map(h => (
                      <option key={h} value={`${String(h).padStart(2, '0')}:00`}>
                        {String(h).padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Motivo:</label>
                  <select
                    value={nuevoBloqueo.motivo}
                    onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, motivo: e.target.value})}
                  >
                    <option value="OCUPADO">🚫 Ocupado</option>
                    <option value="VACACIONES">🏖️ Vacaciones</option>
                    <option value="OTRO">⚠️ Otro</option>
                  </select>
                </div>
              </div>

              <div className="form-field full-width">
                <label>Descripción (opcional):</label>
                <textarea
                  value={nuevoBloqueo.descripcion}
                  onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, descripcion: e.target.value})}
                  placeholder="Detalles adicionales..."
                  rows="2"
                />
              </div>

              <button type="submit" className="btn-submit">
                💾 Guardar Bloqueo
              </button>
            </form>
          </div>
        )}

        <div className="bloqueos-lista">
          <h3>Bloqueos Programados</h3>
          
          {cargando ? (
            <p>Cargando...</p>
          ) : bloqueos.length === 0 ? (
            <p className="no-bloqueos">No hay horarios bloqueados</p>
          ) : (
            <div className="bloqueos-grid">
              {bloqueos.map(bloqueo => (
                <div key={bloqueo.id} className="bloqueo-card">
                  <div 
                    className="bloqueo-motivo-badge"
                    style={{ backgroundColor: getMotivoColor(bloqueo.motivo) }}
                  >
                    {getMotivoIcono(bloqueo.motivo)} {bloqueo.motivo}
                  </div>
                  
                  <div className="bloqueo-info">
                    <div className="bloqueo-fecha">
                      📅 {new Date(bloqueo.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    
                    <div className="bloqueo-horas">
                      🕐 {bloqueo.horaInicio} - {bloqueo.horaFin}
                    </div>
                    
                    {bloqueo.descripcion && (
                      <div className="bloqueo-descripcion">
                        💬 {bloqueo.descripcion}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    className="btn-eliminar"
                    onClick={() => eliminarBloqueo(bloqueo.id)}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionBloqueos;
