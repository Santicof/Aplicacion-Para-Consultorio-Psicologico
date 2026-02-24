import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VerTurnos.css';

function VerTurnos() {
  const navigate = useNavigate();
  const [turnos, setTurnos] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos, hoy, proximos
  const [profesionalFiltro, setProfesionalFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [modalCancelar, setModalCancelar] = useState({ visible: false, turno: null });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [turnosRes, profesionalesRes] = await Promise.all([
        axios.get('/api/turnos'),
        axios.get('/api/profesionales')
      ]);
      
      setTurnos(turnosRes.data);
      setProfesionales(profesionalesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      mostrarMensaje('error', 'Error al cargar los turnos');
    } finally {
      setCargando(false);
    }
  };

  const cancelarTurno = async (turnoId) => {
    setModalCancelar({ visible: false, turno: null });

    try {
      await axios.delete(`/api/turnos/${turnoId}`);
      mostrarMensaje('success', 'Turno cancelado exitosamente');
      cargarDatos();
    } catch (error) {
      console.error('Error al cancelar turno:', error);
      mostrarMensaje('error', 'Error al cancelar el turno');
    }
  };

  const abrirModalCancelar = (turno) => {
    setModalCancelar({ visible: true, turno });
  };

  const cerrarModalCancelar = () => {
    setModalCancelar({ visible: false, turno: null });
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const obtenerNombreProfesional = (profesionalId) => {
    const prof = profesionales.find(p => p.id === profesionalId);
    return prof ? prof.nombre : 'Profesional no encontrado';
  };

  const obtenerEspecialidadProfesional = (profesionalId) => {
    const prof = profesionales.find(p => p.id === profesionalId);
    return prof ? prof.especialidad : '';
  };

  const formatearFecha = (fecha) => {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const esHoy = (fecha) => {
    const hoy = new Date().toISOString().split('T')[0];
    return fecha === hoy;
  };

  const esFuturo = (fecha) => {
    const hoy = new Date().toISOString().split('T')[0];
    return fecha >= hoy;
  };

  const turnosFiltrados = turnos.filter(turno => {
    // Filtro por profesional
    if (profesionalFiltro !== 'todos' && turno.profesionalId !== parseInt(profesionalFiltro)) {
      return false;
    }

    // Filtro por búsqueda de nombre de paciente
    if (busqueda.trim() !== '') {
      const nombrePaciente = (turno.paciente?.nombre || '').toLowerCase();
      const terminoBusqueda = busqueda.toLowerCase().trim();
      if (!nombrePaciente.includes(terminoBusqueda)) {
        return false;
      }
    }

    // Filtro por fecha
    if (filtro === 'hoy') {
      return esHoy(turno.fecha);
    } else if (filtro === 'proximos') {
      return esFuturo(turno.fecha);
    }
    
    return true;
  }).sort((a, b) => {
    // Ordenar por fecha y hora
    if (a.fecha !== b.fecha) {
      return a.fecha.localeCompare(b.fecha);
    }
    return a.hora.localeCompare(b.hora);
  });

  const agruparTurnosPorFecha = () => {
    const grupos = {};
    turnosFiltrados.forEach(turno => {
      if (!grupos[turno.fecha]) {
        grupos[turno.fecha] = [];
      }
      grupos[turno.fecha].push(turno);
    });
    return grupos;
  };

  const turnosAgrupados = agruparTurnosPorFecha();

  const handleCerrarSesion = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  return (
    <div className="ver-turnos-page">
      <div className="container">
        <div className="page-header">
          <h2 className="page-title">Panel de Turnos - Administrador</h2>
          <button onClick={handleCerrarSesion} className="btn btn-secondary">
            Cerrar Sesión
          </button>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`mensaje mensaje-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Filtros */}
        <div className="filtros-container card">
          <div className="filtro-grupo filtro-busqueda">
            <label>Buscar por nombre del paciente:</label>
            <input
              type="text"
              placeholder="Ej: Juan Pérez..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-busqueda"
            />
            {busqueda && (
              <button 
                className="btn-limpiar-busqueda"
                onClick={() => setBusqueda('')}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filtro-grupo">
            <label>Filtrar por fecha:</label>
            <div className="filtro-botones">
              <button
                className={`filtro-btn ${filtro === 'todos' ? 'activo' : ''}`}
                onClick={() => setFiltro('todos')}
              >
                Todos
              </button>
              <button
                className={`filtro-btn ${filtro === 'hoy' ? 'activo' : ''}`}
                onClick={() => setFiltro('hoy')}
              >
                Hoy
              </button>
              <button
                className={`filtro-btn ${filtro === 'proximos' ? 'activo' : ''}`}
                onClick={() => setFiltro('proximos')}
              >
                Próximos
              </button>
            </div>
          </div>

          <div className="filtro-grupo">
            <label>Filtrar por profesional:</label>
            <select
              value={profesionalFiltro}
              onChange={(e) => setProfesionalFiltro(e.target.value)}
              className="filtro-select"
            >
              <option value="todos">Todos los profesionales</option>
              {profesionales.map(prof => (
                <option key={prof.id} value={prof.id}>{prof.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="estadisticas">
          <div className="estadistica-card card">
            <div className="estadistica-numero">{turnos.length}</div>
            <div className="estadistica-label">Total de turnos</div>
          </div>
          <div className="estadistica-card card">
            <div className="estadistica-numero">
              {turnos.filter(t => esHoy(t.fecha)).length}
            </div>
            <div className="estadistica-label">Turnos hoy</div>
          </div>
          <div className="estadistica-card card">
            <div className="estadistica-numero">
              {turnos.filter(t => esFuturo(t.fecha)).length}
            </div>
            <div className="estadistica-label">Turnos próximos</div>
          </div>
        </div>

        {/* Lista de turnos */}
        {cargando ? (
          <div className="cargando-container">
            <div className="cargando">Cargando turnos...</div>
          </div>
        ) : turnosFiltrados.length === 0 ? (
          <div className="sin-turnos card">
            <div className="sin-turnos-icono">📅</div>
            <h3>No hay turnos</h3>
            <p>No se encontraron turnos con los filtros seleccionados</p>
          </div>
        ) : (
          <div className="turnos-agrupados">
            {Object.entries(turnosAgrupados).map(([fecha, turnosDia]) => (
              <div key={fecha} className="grupo-fecha">
                <h3 className="fecha-titulo">
                  {formatearFecha(fecha)}
                  {esHoy(fecha) && <span className="badge-hoy">HOY</span>}
                  <span className="fecha-contador">({turnosDia.length} {turnosDia.length === 1 ? 'turno' : 'turnos'})</span>
                </h3>
                
                <div className="turnos-lista">
                  {turnosDia.map((turno) => (
                    <div key={turno.id} className="turno-card card fade-in">
                      <div className="turno-hora">
                        <div className="hora-grande">{turno.hora}</div>
                      </div>
                      
                      <div className="turno-info">
                        <div className="turno-profesional">
                          <strong>{obtenerNombreProfesional(turno.profesionalId)}</strong>
                          <span className="turno-especialidad">
                            {obtenerEspecialidadProfesional(turno.profesionalId)}
                          </span>
                        </div>
                        
                        <div className="turno-paciente">
                          <div className="paciente-dato">
                            <span className="dato-icono">👤</span>
                            <span>{turno.paciente.nombre}</span>
                          </div>
                          <div className="paciente-dato">
                            <span className="dato-icono">📱</span>
                            <span>{turno.paciente.telefono}</span>
                          </div>
                          {turno.paciente.email && (
                            <div className="paciente-dato">
                              <span className="dato-icono">✉️</span>
                              <span>{turno.paciente.email}</span>
                            </div>
                          )}
                          {turno.paciente.motivo && (
                            <div className="paciente-motivo">
                              <strong>Motivo:</strong> {turno.paciente.motivo}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="turno-acciones">
                        <span className={`estado-badge estado-${turno.estado}`}>
                          {turno.estado}
                        </span>
                        <button
                          className="btn-cancelar"
                          onClick={() => abrirModalCancelar(turno)}
                          title="Cancelar turno"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de confirmación de cancelación */}
        {modalCancelar.visible && modalCancelar.turno && (
          <div className="modal-overlay" onClick={cerrarModalCancelar}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>¿Cancelar este turno?</h3>
                <button className="modal-close" onClick={cerrarModalCancelar}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="turno-info-modal">
                  <div className="info-item">
                    <span className="info-label">Paciente:</span>
                    <span className="info-value">{modalCancelar.turno.paciente.nombre}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Profesional:</span>
                    <span className="info-value">{obtenerNombreProfesional(modalCancelar.turno.profesionalId)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Fecha:</span>
                    <span className="info-value">{formatearFecha(modalCancelar.turno.fecha)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Hora:</span>
                    <span className="info-value">{modalCancelar.turno.hora}</span>
                  </div>
                </div>
                
                <p className="modal-advertencia">
                  Esta acción no se puede deshacer. El horario quedará disponible nuevamente.
                </p>
              </div>

              <div className="modal-footer">
                <button 
                  className="btn-modal btn-cancelar-modal" 
                  onClick={() => cancelarTurno(modalCancelar.turno.id)}
                >
                  Sí, cancelar turno
                </button>
                <button 
                  className="btn-modal btn-volver" 
                  onClick={cerrarModalCancelar}
                >
                  No, volver
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerTurnos;
