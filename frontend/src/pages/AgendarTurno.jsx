import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import CalendarioDisponibilidad from '../components/CalendarioDisponibilidad';
import './AgendarTurno.css';

function AgendarTurno() {
  const location = useLocation();
  const profesionalIdPreseleccionado = location.state?.profesionalId;
  const [paso, setPaso] = useState(1);
  const [profesionales, setProfesionales] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [turnoConfirmado, setTurnoConfirmado] = useState(null);
  
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: '',
    telefono: '',
    email: '',
    motivo: ''
  });

  // Cargar profesionales al montar el componente
  useEffect(() => {
    cargarProfesionales();
  }, []);

  // Si hay un profesional preseleccionado, seleccionarlo automáticamente
  useEffect(() => {
    if (profesionalIdPreseleccionado && profesionales.length > 0) {
      const prof = profesionales.find(p => p.id === profesionalIdPreseleccionado);
      if (prof) {
        setProfesionalSeleccionado(prof);
        setPaso(2);
      }
    }
  }, [profesionalIdPreseleccionado, profesionales]);

  // Cargar horarios cuando se selecciona fecha
  useEffect(() => {
    if (profesionalSeleccionado && fechaSeleccionada) {
      cargarHorariosDisponibles();
    }
  }, [profesionalSeleccionado, fechaSeleccionada]);

  const cargarProfesionales = async () => {
    try {
      const response = await axios.get('/api/profesionales');
      setProfesionales(response.data);
    } catch (error) {
      console.error('Error al cargar profesionales:', error);
      mostrarMensaje('error', 'Error al cargar los profesionales');
    }
  };

  const cargarHorariosDisponibles = async () => {
    setCargando(true);
    try {
      const response = await axios.get(
        `/api/horarios-disponibles/${profesionalSeleccionado.id}/${fechaSeleccionada}`
      );
      setHorariosDisponibles(response.data.disponibles);
      setHorariosOcupados(response.data.ocupados);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      mostrarMensaje('error', 'Error al cargar los horarios');
    } finally {
      setCargando(false);
    }
  };

  const seleccionarProfesional = (prof) => {
    setProfesionalSeleccionado(prof);
    setPaso(2);
    setHoraSeleccionada('');
  };

  const seleccionarFecha = (fecha) => {
    setFechaSeleccionada(fecha);
    setHoraSeleccionada('');
  };

  const seleccionarHora = (hora) => {
    setHoraSeleccionada(hora);
    setPaso(3);
  };

  const handleInputChange = (e) => {
    setDatosUsuario({
      ...datosUsuario,
      [e.target.name]: e.target.value
    });
  };

  const confirmarTurno = async (e) => {
    e.preventDefault();
    
    if (!datosUsuario.nombre || !datosUsuario.telefono) {
      mostrarMensaje('error', 'Por favor completa los campos requeridos');
      return;
    }

    setCargando(true);
    try {
      const turnoData = {
        profesionalId: profesionalSeleccionado.id,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        paciente: datosUsuario
      };

      await axios.post('/api/turnos', turnoData);
      
      setTurnoConfirmado({
        profesional: profesionalSeleccionado.nombre,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada
      });
      mostrarMensaje('success', '¡Turno agendado exitosamente!');
    } catch (error) {
      console.error('Error al agendar turno:', error);
      const mensajeError = error.response?.data?.error || 'Error al agendar el turno';
      mostrarMensaje('error', mensajeError);
    } finally {
      setCargando(false);
    }
  };

  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje({ tipo: '', texto: '' }), 5000);
  };

  const resetearFormulario = () => {
    setPaso(1);
    setProfesionalSeleccionado(null);
    setFechaSeleccionada('');
    setHoraSeleccionada('');
    setDatosUsuario({ nombre: '', telefono: '', email: '', motivo: '' });
  };

  const obtenerFechaMinima = () => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  };

  const obtenerFechaMaxima = () => {
    const hoy = new Date();
    const tresMeses = new Date(hoy.setMonth(hoy.getMonth() + 3));
    return tresMeses.toISOString().split('T')[0];
  };

  return (
    <div className="agendar-turno-page">
      <div className="container">
        <h2 className="page-title">Agendar Nuevo Turno</h2>

        {/* Indicador de pasos */}
        <div className="pasos-indicador">
          <div className={`paso ${paso >= 1 ? 'activo' : ''}`}>
            <div className="paso-numero">1</div>
            <div className="paso-texto">Profesional</div>
          </div>
          <div className="paso-linea"></div>
          <div className={`paso ${paso >= 2 ? 'activo' : ''}`}>
            <div className="paso-numero">2</div>
            <div className="paso-texto">Fecha y Hora</div>
          </div>
          <div className="paso-linea"></div>
          <div className={`paso ${paso >= 3 ? 'activo' : ''}`}>
            <div className="paso-numero">3</div>
            <div className="paso-texto">Datos</div>
          </div>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`mensaje mensaje-${mensaje.tipo}`}>
            {mensaje.texto}
          </div>
        )}

        {/* Confirmación de turno */}
        {turnoConfirmado && (
          <div className="confirmacion-turno fade-in">
            <div className="confirmacion-icono">✓</div>
            <h3>¡Turno Confirmado!</h3>
            <div className="confirmacion-detalles">
              <p><strong>Profesional:</strong> {turnoConfirmado.profesional}</p>
              <p><strong>Fecha:</strong> {new Date(turnoConfirmado.fecha + 'T00:00:00').toLocaleDateString('es-AR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
              <p><strong>Hora:</strong> {turnoConfirmado.hora}</p>
            </div>
            <p className="confirmacion-mensaje">
              Te esperamos en el consultorio. Por favor llega 5 minutos antes de tu cita.
            </p>
            <div className="confirmacion-acciones">
              <Link to="/" className="btn btn-primary">
                Volver al Inicio
              </Link>
            </div>
          </div>
        )}

        {/* Paso 1: Seleccionar Profesional */}
        {paso === 1 && (
          <div className="paso-contenido fade-in">
            <h3 className="paso-titulo">Selecciona un profesional</h3>
            <div className="profesionales-lista">
              {profesionales.map((prof) => (
                <div
                  key={prof.id}
                  className="profesional-item card"
                  onClick={() => seleccionarProfesional(prof)}
                >
                  <div className="profesional-info">
                    <h4>{prof.nombre}</h4>
                    <p className="especialidad-texto">{prof.especialidad}</p>
                    {prof.descripcion && (
                      <p className="descripcion-texto">{prof.descripcion}</p>
                    )}
                  </div>
                  <div className="profesional-accion">→</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paso 2: Seleccionar Fecha y Hora */}
        {paso === 2 && (
          <div className="paso-contenido fade-in">
            <div className="seleccion-actual">
              <strong>Profesional:</strong> {profesionalSeleccionado.nombre}
              <button className="btn-cambiar" onClick={() => setPaso(1)}>Cambiar</button>
            </div>

            <h3 className="paso-titulo">Selecciona fecha y horario en el calendario</h3>

            <CalendarioDisponibilidad
              profesionalId={profesionalSeleccionado.id}
              onSeleccionFecha={seleccionarFecha}
              onSeleccionHora={seleccionarHora}
            />
          </div>
        )}

        {/* Paso 3: Datos del paciente */}
        {paso === 3 && !turnoConfirmado && (
          <div className="paso-contenido fade-in">
            <div className="seleccion-actual">
              <div>
                <strong>Profesional:</strong> {profesionalSeleccionado.nombre}<br/>
                <strong>Fecha:</strong> {new Date(fechaSeleccionada + 'T00:00:00').toLocaleDateString('es-AR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}<br/>
                <strong>Hora:</strong> {horaSeleccionada}
              </div>
              <button className="btn-cambiar" onClick={() => setPaso(2)}>Modificar</button>
            </div>

            <h3 className="paso-titulo">Completa tus datos</h3>

            <form onSubmit={confirmarTurno} className="formulario-turno">
              <div className="info-privacidad">
                <p>🔒 Tus datos son confidenciales y solo serán utilizados para gestionar tu turno.</p>
              </div>
              
              <div className="form-group">
                <label>Nombre completo *</label>
                <input
                  type="text"
                  name="nombre"
                  value={datosUsuario.nombre}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Juan Pérez"
                  minLength="3"
                />
              </div>

              <div className="form-group">
                <label>Teléfono * (con código de área)</label>
                <input
                  type="tel"
                  name="telefono"
                  value={datosUsuario.telefono}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: 11 1234-5678"
                  pattern="[0-9\s\-]+"
                />
              </div>

              <div className="form-group">
                <label>Email (opcional)</label>
                <input
                  type="email"
                  name="email"
                  value={datosUsuario.email}
                  onChange={handleInputChange}
                  placeholder="email@ejemplo.com"
                />
              </div>

              <div className="form-group">
                <label>Motivo de la consulta (opcional)</label>
                <textarea
                  name="motivo"
                  value={datosUsuario.motivo}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Breve descripción del motivo de consulta..."
                />
              </div>

              <div className="form-acciones">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPaso(2)}
                >
                  Volver
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={cargando}
                >
                  {cargando ? 'Agendando...' : 'Confirmar Turno'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AgendarTurno;
