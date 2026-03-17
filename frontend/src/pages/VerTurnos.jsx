import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './VerTurnos.css';

function VerTurnos() {
  const navigate = useNavigate();
  
  // Tab state
  const [tabActiva, setTabActiva] = useState('turnos');
  
  // Estados para gestión de turnos
  const [turnos, setTurnos] = useState([]);
  const [profesionales, setProfesionales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [filtro, setFiltro] = useState('todos'); // todos, hoy, proximos
  const [profesionalFiltro, setProfesionalFiltro] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [modalCancelar, setModalCancelar] = useState({ visible: false, turno: null });
  
  // Estados para gestión de bloqueos
  const [bloqueos, setBloqueos] = useState([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargandoBloqueos, setCargandoBloqueos] = useState(false);
  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    fecha: '',
    horaInicio: '',
    horaFin: '',
    motivo: 'OTRO',
    descripcion: ''
  });
  const [modalDiaCompleto, setModalDiaCompleto] = useState({
    visible: false,
    fecha: '',
    motivo: 'VACACIONES',
    descripcion: ''
  });

  // Estados para calendario de vacaciones
  const [mesActual, setMesActual] = useState(new Date());
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [seleccionandoRango, setSeleccionandoRango] = useState(false);

  // Estados para gestión de profesionales
  const [mostrarFormularioProfesional, setMostrarFormularioProfesional] = useState(false);
  const [profesionalEditando, setProfesionalEditando] = useState(null);
  const [modalEliminarProfesional, setModalEliminarProfesional] = useState({ visible: false, profesional: null });
  const [nuevoProfesional, setNuevoProfesional] = useState({
    nombre: '',
    titulo: '',
    especialidad: '',
    descripcion: '',
    colorCalendario: '9',
    horarios: []
  });

  // Colores disponibles en Google Calendar
  const coloresCalendario = [
    { id: '9', nombre: 'Azul (Arándano)', color: '#5484ed' },
    { id: '10', nombre: 'Verde (Albahaca)', color: '#51b749' },
    { id: '6', nombre: 'Naranja (Mandarina)', color: '#ffb878' },
    { id: '3', nombre: 'Púrpura (Uva)', color: '#dbadff' },
    { id: '11', nombre: 'Rojo (Tomate)', color: '#dc2127' },
    { id: '4', nombre: 'Rosa (Flamingo)', color: '#ff887c' },
    { id: '5', nombre: 'Amarillo (Banana)', color: '#fbd75b' },
    { id: '7', nombre: 'Turquesa (Pavo Real)', color: '#46d6db' },
    { id: '1', nombre: 'Lavanda', color: '#a4bdfc' },
    { id: '2', nombre: 'Verde salvia', color: '#7ae7bf' },
    { id: '8', nombre: 'Grafito', color: '#e1e1e1' }
  ];

  // Estados para gestión de pacientes fijos
  const [pacientesFijos, setPacientesFijos] = useState([]);
  const [mostrarFormularioPacienteFijo, setMostrarFormularioPacienteFijo] = useState(false);
  const [pacienteFijoEditando, setPacienteFijoEditando] = useState(null);
  const [modalEliminarPacienteFijo, setModalEliminarPacienteFijo] = useState({ visible: false, pacienteFijo: null });
  const [nuevoPacienteFijo, setNuevoPacienteFijo] = useState({
    profesionalId: null,
    nombrePaciente: '',
    diasSemana: [],
    hora: '09:00',
    modalidad: 'presencial',
    observaciones: ''
  });

  // Estados para mantenimiento/limpieza
  const [limpiezaPreview, setLimpiezaPreview] = useState(null);
  const [cargandoLimpieza, setCargandoLimpieza] = useState(false);
  const [modalConfirmarLimpieza, setModalConfirmarLimpieza] = useState(false);
  const [resultadoLimpieza, setResultadoLimpieza] = useState(null);

  // Estados para gestión de eventos
  const [eventos, setEventos] = useState([]);
  const [mostrarFormularioEvento, setMostrarFormularioEvento] = useState(false);
  const [eventoEditando, setEventoEditando] = useState(null);
  const [modalEliminarEvento, setModalEliminarEvento] = useState({ visible: false, evento: null });
  const [nuevoEvento, setNuevoEvento] = useState({
    titulo: '',
    descripcion: '',
    fechaEvento: '',
    horarioEvento: '',
    imagenBase64: ''
  });
  const [imagenPreview, setImagenPreview] = useState(null);

  // Estados para Google Calendar
  const [googleCalendarStatus, setGoogleCalendarStatus] = useState(null);
  const [cargandoGoogleCalendar, setCargandoGoogleCalendar] = useState(false);
  const [googleCalendarError, setGoogleCalendarError] = useState(null);

  // Estados para días no laborables
  const [diasNoLaborables, setDiasNoLaborables] = useState({ diasSemana: [], fechasEspecificas: [] });
  const [nuevaFechaNoLaborable, setNuevaFechaNoLaborable] = useState({ fecha: '', descripcion: '' });
  const [cargandoDiasNoLaborables, setCargandoDiasNoLaborables] = useState(false);

  useEffect(() => {
    cargarDatos();
    // Auto-sync Google Calendar al iniciar
    axios.post('/api/turnos/sync').catch(() => {});
    
    // Auto-refresh cada 5 segundos para ver cambios de Google Calendar
    const intervalo = setInterval(() => {
      cargarDatos(true);
    }, 5000);

    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (tabActiva === 'bloqueos' && profesionalSeleccionado) {
      cargarBloqueos();
    }
  }, [tabActiva, profesionalSeleccionado]);

  useEffect(() => {
    if (tabActiva === 'pacientesFijos') {
      cargarPacientesFijos();
    }
  }, [tabActiva]);

  useEffect(() => {
    if (tabActiva === 'diasNoLaborables') {
      cargarDiasNoLaborables();
    }
  }, [tabActiva]);

  useEffect(() => {
    if (tabActiva === 'eventos') {
      cargarEventos();
    }
  }, [tabActiva]);

  const cargarDatos = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    try {
      const [turnosRes, profesionalesRes] = await Promise.all([
        axios.get('/api/turnos'),
        axios.get('/api/profesionales')
      ]);
      
      setTurnos(turnosRes.data);
      setProfesionales(profesionalesRes.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      if (!silencioso) mostrarMensaje('error', 'Error al cargar los turnos');
    } finally {
      if (!silencioso) setCargando(false);
    }
  };

  const sincronizarGoogleCalendar = async () => {
    setSincronizando(true);
    try {
      await axios.post('/api/turnos/sync');
      mostrarMensaje('success', '🔄 Sincronizando con Google Calendar...');
      
      // Esperar 2 segundos y recargar los turnos
      setTimeout(() => {
        cargarDatos();
      }, 2000);
    } catch (error) {
      console.error('Error al sincronizar:', error);
      mostrarMensaje('error', 'Error al sincronizar con Google Calendar');
    } finally {
      setSincronizando(false);
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
      if (error.response && error.response.status === 401) {
        mostrarMensaje('error', 'Sesión expirada. Por favor, inicie sesión nuevamente.');
        setTimeout(() => window.location.href = '/gestion-consultorio-interno', 2000);
      } else {
        mostrarMensaje('error', 'Error al cancelar el turno: ' + (error.response?.data?.message || error.message));
      }
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
    const duracion = tipo === 'error' ? 6000 : 4000;
    setTimeout(() => setMensaje((prev) => prev.texto === texto ? { tipo: '', texto: '' } : prev), duracion);
  };

  const cerrarMensaje = () => setMensaje({ tipo: '', texto: '' });

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
    fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminUser');
    navigate('/');
  };

  // ========== FUNCIONES PARA GESTIÓN DE BLOQUEOS ==========

  const cargarBloqueos = async () => {
    if (!profesionalSeleccionado) return;
    
    setCargandoBloqueos(true);
    try {
      // Obtener bloqueos desde 6 meses atrás hasta 12 meses adelante
      const hoy = new Date();
      const fechaInicio = new Date(hoy);
      fechaInicio.setMonth(fechaInicio.getMonth() - 6);
      const fechaFin = new Date(hoy);
      fechaFin.setMonth(fechaFin.getMonth() + 12);
      
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
      const fechaFinStr = fechaFin.toISOString().split('T')[0];
      
      const response = await axios.get(
        `/api/horarios-bloqueados/profesional/${profesionalSeleccionado}/rango?fechaInicio=${fechaInicioStr}&fechaFin=${fechaFinStr}`
      );
      setBloqueos(response.data);
    } catch (error) {
      console.error('Error al cargar bloqueos:', error);
      mostrarMensaje('error', 'Error al cargar los horarios bloqueados');
    } finally {
      setCargandoBloqueos(false);
    }
  };

  const bloquearDiaCompleto = async () => {
    if (!profesionalSeleccionado) {
      mostrarMensaje('error', 'Debes seleccionar un profesional');
      return;
    }

    // Abrir modal
    setModalDiaCompleto({
      visible: true,
      fecha: '',
      motivo: 'VACACIONES',
      descripcion: ''
    });
  };

  const cerrarModalDiaCompleto = () => {
    setModalDiaCompleto({
      visible: false,
      fecha: '',
      motivo: 'VACACIONES',
      descripcion: ''
    });
  };

  const handleSubmitDiaCompleto = async (e) => {
    e.preventDefault();

    if (!modalDiaCompleto.fecha) {
      mostrarMensaje('error', 'Debes seleccionar una fecha');
      return;
    }

    try {
      const params = new URLSearchParams({
        profesionalId: profesionalSeleccionado,
        fecha: modalDiaCompleto.fecha,
        motivo: modalDiaCompleto.motivo,
        descripcion: modalDiaCompleto.descripcion || ''
      });

      await axios.post(`/api/horarios-bloqueados/bloquear-dia-completo?${params.toString()}`);

      mostrarMensaje('success', '✅ Día completo bloqueado exitosamente');
      cerrarModalDiaCompleto();
      cargarBloqueos();
    } catch (error) {
      console.error('Error al bloquear día:', error);
      mostrarMensaje('error', error.response?.data?.message || 'Error al bloquear el día');
    }
  };

  const agregarBloqueo = async (e) => {
    e.preventDefault();
    
    if (!profesionalSeleccionado) {
      mostrarMensaje('error', 'Debes seleccionar un profesional');
      return;
    }

    try {
      await axios.post('/api/horarios-bloqueados', {
        profesionalId: parseInt(profesionalSeleccionado),
        ...nuevoBloqueo
      });

      mostrarMensaje('success', '✅ Horario bloqueado exitosamente');
      setNuevoBloqueo({
        fecha: '',
        horaInicio: '',
        horaFin: '',
        motivo: 'OTRO',
        descripcion: ''
      });
      setMostrarFormulario(false);
      cargarBloqueos();
    } catch (error) {
      console.error('Error al crear bloqueo:', error);
      mostrarMensaje('error', error.response?.data?.message || 'Error al bloquear el horario');
    }
  };

  const eliminarBloqueo = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este bloqueo?')) return;

    try {
      await axios.delete(`/api/horarios-bloqueados/${id}`);
      mostrarMensaje('success', '✅ Bloqueo eliminado exitosamente');
      cargarBloqueos();
    } catch (error) {
      console.error('Error al eliminar bloqueo:', error);
      mostrarMensaje('error', 'Error al eliminar el bloqueo');
    }
  };

  const obtenerColorMotivo = (motivo) => {
    const colores = {
      VACACIONES: '#ff9800',
      OCUPADO: '#f44336',
      OTRO: '#9e9e9e'
    };
    return colores[motivo] || '#9e9e9e';
  };

  const obtenerEmojiMotivo = (motivo) => {
    const emojis = {
      VACACIONES: '🏖️',
      OCUPADO: '⛔',
      OTRO: '🚫'
    };
    return emojis[motivo] || '🚫';
  };

  // ========== FUNCIONES PARA CALENDARIO ==========

  const obtenerDiasDelMes = (fecha) => {
    const año = fecha.getFullYear();
    const mes = fecha.getMonth();
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const primerDiaSemana = primerDia.getDay();
    
    const dias = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let dia = 1; dia <= diasEnMes; dia++) {
      dias.push(new Date(año, mes, dia));
    }
    
    return dias;
  };

  const formatearMesAño = (fecha) => {
    return fecha.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  const mesAnterior = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 1));
  };

  const seleccionarDia = (fecha) => {
    if (!profesionalSeleccionado) {
      mostrarMensaje('error', 'Primero selecciona un profesional');
      return;
    }

    if (!seleccionandoRango) {
      // Primer clic: iniciar selección
      setFechaInicio(fecha);
      setFechaFin(null);
      setSeleccionandoRango(true);
    } else {
      // Segundo clic: completar rango
      if (fecha < fechaInicio) {
        setFechaFin(fechaInicio);
        setFechaInicio(fecha);
      } else {
        setFechaFin(fecha);
      }
      setSeleccionandoRango(false);
    }
  };

  const esFechaSeleccionada = (fecha) => {
    if (!fechaInicio) return false;
    
    const fechaStr = fecha.toISOString().split('T')[0];
    const inicioStr = fechaInicio.toISOString().split('T')[0];
    
    if (!fechaFin) {
      return fechaStr === inicioStr;
    }
    
    const finStr = fechaFin.toISOString().split('T')[0];
    return fechaStr >= inicioStr && fechaStr <= finStr;
  };

  const limpiarSeleccion = () => {
    setFechaInicio(null);
    setFechaFin(null);
    setSeleccionandoRango(false);
  };

  const bloquearPeriodoCalendario = async () => {
    if (!fechaInicio) {
      mostrarMensaje('error', 'Selecciona al menos un día en el calendario');
      return;
    }

    const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
    const fechaFinStr = fechaFin ? fechaFin.toISOString().split('T')[0] : fechaInicioStr;

    try {
      const fechaActual = new Date(fechaInicio);
      const fechaFinal = fechaFin ? new Date(fechaFin) : new Date(fechaInicio);
      const bloqueos = [];

      // Crear un bloqueo para cada día del rango
      while (fechaActual <= fechaFinal) {
        const params = new URLSearchParams({
          profesionalId: profesionalSeleccionado,
          fecha: fechaActual.toISOString().split('T')[0],
          motivo: 'VACACIONES',
          descripcion: 'Período de vacaciones'
        });

        bloqueos.push(
          axios.post(`/api/horarios-bloqueados/bloquear-dia-completo?${params.toString()}`)
        );

        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      await Promise.all(bloqueos);
      
      const diasBloqueados = bloqueos.length;
      
      // Formatear fechas para el mensaje
      const fechaInicioFormateada = fechaInicio.toLocaleDateString('es-AR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      
      let mensajeExito;
      if (diasBloqueados === 1) {
        mensajeExito = `🎉 ¡Día bloqueado exitosamente! ${fechaInicioFormateada}`;
      } else {
        const fechaFinFormateada = fechaFin.toLocaleDateString('es-AR', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        mensajeExito = `🎉 ¡${diasBloqueados} días bloqueados exitosamente! Del ${fechaInicioFormateada} al ${fechaFinFormateada}`;
      }
      
      mostrarMensaje('success', mensajeExito);
      limpiarSeleccion();
      cargarBloqueos();
    } catch (error) {
      console.error('Error al bloquear período:', error);
      mostrarMensaje('error', '❌ Error al bloquear el período. Por favor intenta nuevamente.');
    }
  };

  const esFechaPasada = (fecha) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return fecha < hoy;
  };

  // ========== FIN FUNCIONES DE CALENDARIO ==========

  const formatearFechaBloqueo = (fecha) => {
    return new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // ========== FIN FUNCIONES DE BLOQUEOS ==========

  // ========== FUNCIONES DE GESTIÓN DE PROFESIONALES ==========

  const cargarProfesionales = async () => {
    try {
      const response = await axios.get('/api/profesionales');
      setProfesionales(response.data);
    } catch (error) {
      console.error('Error al cargar profesionales:', error);
      mostrarMensaje('error', 'Error al cargar profesionales');
    }
  };

  const abrirFormularioProfesional = (profesional = null) => {
    if (profesional) {
      setProfesionalEditando(profesional);
      setNuevoProfesional({
        nombre: profesional.nombre,
        titulo: profesional.titulo || '',
        especialidad: profesional.especialidad,
        descripcion: profesional.descripcion || '',
        colorCalendario: profesional.colorCalendario || '9',
        horarios: profesional.horarios || []
      });
    } else {
      setProfesionalEditando(null);
      setNuevoProfesional({
        nombre: '',
        titulo: '',
        especialidad: '',
        descripcion: '',
        colorCalendario: '9',
        horarios: []
      });
    }
    setMostrarFormularioProfesional(true);
  };

  const cerrarFormularioProfesional = () => {
    setMostrarFormularioProfesional(false);
    setProfesionalEditando(null);
    setNuevoProfesional({
      nombre: '',
      titulo: '',
      especialidad: '',
      descripcion: '',
      colorCalendario: '9',
      horarios: []
    });
  };

  const guardarProfesional = async (e) => {
    e.preventDefault();

    if (!nuevoProfesional.nombre || !nuevoProfesional.especialidad) {
      mostrarMensaje('error', 'Nombre y especialidad son obligatorios');
      return;
    }

    try {
      if (profesionalEditando) {
        // Actualizar
        await axios.put(`/api/profesionales/${profesionalEditando.id}`, nuevoProfesional);
        mostrarMensaje('success', '✅ Profesional actualizado exitosamente');
      } else {
        // Crear
        await axios.post('/api/profesionales', nuevoProfesional);
        mostrarMensaje('success', '✅ Profesional creado exitosamente');
      }
      cerrarFormularioProfesional();
      cargarProfesionales();
    } catch (error) {
      console.error('Error al guardar profesional:', error);
      mostrarMensaje('error', 'Error al guardar el profesional');
    }
  };

  const abrirModalEliminarProfesional = (profesional) => {
    setModalEliminarProfesional({ visible: true, profesional });
  };

  const cerrarModalEliminarProfesional = () => {
    setModalEliminarProfesional({ visible: false, profesional: null });
  };

  const confirmarEliminarProfesional = async () => {
    const { profesional } = modalEliminarProfesional;
    if (!profesional) return;

    try {
      await axios.delete(`/api/profesionales/${profesional.id}`);
      mostrarMensaje('success', '✅ Profesional eliminado exitosamente');
      cerrarModalEliminarProfesional();
      cargarProfesionales();
    } catch (error) {
      console.error('Error al eliminar profesional:', error);
      mostrarMensaje('error', 'Error al eliminar el profesional. Puede que tenga turnos asociados.');
      cerrarModalEliminarProfesional();
    }
  };

  // ========== FIN FUNCIONES DE GESTIÓN DE PROFESIONALES ==========

  // ========== FUNCIONES DE GESTIÓN DE PACIENTES FIJOS ==========

  const cargarPacientesFijos = async () => {
    try {
      const response = await axios.get('/api/pacientes-fijos');
      setPacientesFijos(response.data);
    } catch (error) {
      console.error('Error al cargar pacientes fijos:', error);
      mostrarMensaje('error', 'Error al cargar pacientes fijos');
    }
  };

  const abrirFormularioPacienteFijo = (pacienteFijo = null) => {
    if (pacienteFijo) {
      setPacienteFijoEditando(pacienteFijo);
      setNuevoPacienteFijo({
        profesionalId: pacienteFijo.profesionalId,
        nombrePaciente: pacienteFijo.nombrePaciente,
        diasSemana: pacienteFijo.diasSemana || [],
        hora: pacienteFijo.hora,
        modalidad: pacienteFijo.modalidad,
        observaciones: pacienteFijo.observaciones || ''
      });
    } else {
      setPacienteFijoEditando(null);
      setNuevoPacienteFijo({
        profesionalId: null,
        nombrePaciente: '',
        diasSemana: [],
        hora: '09:00',
        modalidad: 'presencial',
        observaciones: ''
      });
    }
    setMostrarFormularioPacienteFijo(true);
  };

  const cerrarFormularioPacienteFijo = () => {
    setMostrarFormularioPacienteFijo(false);
    setPacienteFijoEditando(null);
    setNuevoPacienteFijo({
      profesionalId: null,
      nombrePaciente: '',
      diasSemana: [],
      hora: '09:00',
      modalidad: 'presencial',
      observaciones: ''
    });
  };

  const guardarPacienteFijo = async (e) => {
    e.preventDefault();

    if (!nuevoPacienteFijo.profesionalId || !nuevoPacienteFijo.nombrePaciente) {
      mostrarMensaje('error', 'Profesional y nombre del paciente son obligatorios');
      return;
    }

    if (nuevoPacienteFijo.diasSemana.length === 0) {
      mostrarMensaje('error', 'Debe seleccionar al menos un día de la semana');
      return;
    }

    try {
      // Asegurarse de que profesionalId sea un número
      const payload = {
        ...nuevoPacienteFijo,
        profesionalId: parseInt(nuevoPacienteFijo.profesionalId, 10)
      };
      
      if (pacienteFijoEditando) {
        // Actualizar
        await axios.put(`/api/pacientes-fijos/${pacienteFijoEditando.id}`, payload);
        mostrarMensaje('success', '✅ Paciente fijo actualizado y sincronizado con Google Calendar');
      } else {
        // Crear
        await axios.post('/api/pacientes-fijos', payload);
        mostrarMensaje('success', '✅ Paciente fijo creado y sincronizado con Google Calendar');
      }
      cerrarFormularioPacienteFijo();
      cargarPacientesFijos();
    } catch (error) {
      console.error('Error al guardar paciente fijo:', error);
      mostrarMensaje('error', 'Error al guardar el paciente fijo');
    }
  };

  const abrirModalEliminarPacienteFijo = (pacienteFijo) => {
    setModalEliminarPacienteFijo({ visible: true, pacienteFijo });
  };

  const cerrarModalEliminarPacienteFijo = () => {
    setModalEliminarPacienteFijo({ visible: false, pacienteFijo: null });
  };

  const confirmarEliminarPacienteFijo = async () => {
    const { pacienteFijo } = modalEliminarPacienteFijo;
    if (!pacienteFijo) return;

    try {
      await axios.delete(`/api/pacientes-fijos/${pacienteFijo.id}`);
      mostrarMensaje('success', '✅ Paciente fijo eliminado y removido de Google Calendar');
      cerrarModalEliminarPacienteFijo();
      cargarPacientesFijos();
    } catch (error) {
      console.error('Error al eliminar paciente fijo:', error);
      mostrarMensaje('error', 'Error al eliminar el paciente fijo');
      cerrarModalEliminarPacienteFijo();
    }
  };

  // ========== FIN FUNCIONES DE GESTIÓN DE PACIENTES FIJOS ==========

  // ========== FUNCIONES DE MANTENIMIENTO/LIMPIEZA ==========

  const cargarPreviewLimpieza = async () => {
    setCargandoLimpieza(true);
    try {
      const response = await axios.get('/api/admin/limpieza/preview');
      setLimpiezaPreview(response.data);
    } catch (error) {
      console.error('Error al cargar preview de limpieza:', error);
      mostrarMensaje('error', 'Error al obtener información de limpieza');
    } finally {
      setCargandoLimpieza(false);
    }
  };

  const ejecutarLimpieza = async () => {
    setCargandoLimpieza(true);
    setModalConfirmarLimpieza(false);
    try {
      const response = await axios.post('/api/admin/limpieza/ejecutar');
      setResultadoLimpieza(response.data);
      mostrarMensaje('success', `✅ Limpieza completada: ${response.data.turnosEliminados} turnos y ${response.data.bloqueosEliminados} bloqueos eliminados`);
      // Recargar datos
      cargarDatos();
      cargarPreviewLimpieza();
    } catch (error) {
      console.error('Error al ejecutar limpieza:', error);
      mostrarMensaje('error', 'Error al ejecutar la limpieza');
    } finally {
      setCargandoLimpieza(false);
    }
  };

  // Cargar preview cuando se activa el tab de mantenimiento
  useEffect(() => {
    if (tabActiva === 'mantenimiento') {
      cargarPreviewLimpieza();
      cargarGoogleCalendarStatus();
    }
  }, [tabActiva]);

  // ========== FIN FUNCIONES DE MANTENIMIENTO ==========

  // ========== FUNCIONES DE DÍAS NO LABORABLES ==========

  const cargarDiasNoLaborables = async () => {
    setCargandoDiasNoLaborables(true);
    try {
      const response = await axios.get('/api/dias-no-laborables');
      setDiasNoLaborables(response.data);
    } catch (error) {
      console.error('Error al cargar días no laborables:', error);
      mostrarMensaje('error', 'Error al cargar días no laborables');
    } finally {
      setCargandoDiasNoLaborables(false);
    }
  };

  const toggleDiaSemana = async (diaSemana) => {
    try {
      const diasActuales = diasNoLaborables.diasSemana || [];
      const nuevosDias = diasActuales.includes(diaSemana)
        ? diasActuales.filter(d => d !== diaSemana)
        : [...diasActuales, diaSemana];
      
      const response = await axios.put('/api/dias-no-laborables/dias-semana', {
        diasSemana: nuevosDias
      });
      
      setDiasNoLaborables(response.data);
      mostrarMensaje('success', '✅ Configuración actualizada');
    } catch (error) {
      console.error('Error al actualizar días de la semana:', error);
      mostrarMensaje('error', 'Error al actualizar configuración');
    }
  };

  const agregarFechaNoLaborable = async (e) => {
    e.preventDefault();
    
    if (!nuevaFechaNoLaborable.fecha) {
      mostrarMensaje('error', 'La fecha es requerida');
      return;
    }
    
    try {
      const response = await axios.post('/api/dias-no-laborables/fechas', nuevaFechaNoLaborable);
      setDiasNoLaborables(response.data);
      setNuevaFechaNoLaborable({ fecha: '', descripcion: '' });
      mostrarMensaje('success', '✅ Fecha bloqueada agregada');
    } catch (error) {
      console.error('Error al agregar fecha:', error);
      mostrarMensaje('error', error.response?.data?.error || 'Error al agregar fecha');
    }
  };

  const eliminarFechaNoLaborable = async (fecha) => {
    if (!confirm('¿Está seguro de eliminar este día bloqueado?')) return;
    
    try {
      const response = await axios.delete(`/api/dias-no-laborables/fechas/${fecha}`);
      setDiasNoLaborables(response.data);
      mostrarMensaje('success', '✅ Fecha bloqueada eliminada');
    } catch (error) {
      console.error('Error al eliminar fecha:', error);
      mostrarMensaje('error', 'Error al eliminar fecha');
    }
  };

  // ========== FIN FUNCIONES DE DÍAS NO LABORABLES ==========

  // ========== FUNCIONES DE GOOGLE CALENDAR ==========

  const cargarGoogleCalendarStatus = async () => {
    setCargandoGoogleCalendar(true);
    setGoogleCalendarError(null);
    try {
      const response = await axios.get('/api/google-calendar/status');
      setGoogleCalendarStatus(response.data);
    } catch (error) {
      console.error('Error al cargar estado de Google Calendar:', error);
      setGoogleCalendarError('No se pudo obtener el estado de Google Calendar');
    } finally {
      setCargandoGoogleCalendar(false);
    }
  };

  const conectarGoogleCalendar = async () => {
    setCargandoGoogleCalendar(true);
    setGoogleCalendarError(null);
    try {
      const response = await axios.get('/api/google-calendar/auth-url');
      if (response.data.authUrl) {
        // Redirigir a Google para autenticación
        window.location.href = response.data.authUrl;
      } else if (response.data.error) {
        setGoogleCalendarError(response.data.error);
      }
    } catch (error) {
      console.error('Error al obtener URL de autorización:', error);
      setGoogleCalendarError('Error al iniciar conexión con Google Calendar');
    } finally {
      setCargandoGoogleCalendar(false);
    }
  };

  const desconectarGoogleCalendar = async () => {
    if (!window.confirm('¿Estás seguro de desconectar Google Calendar? Los turnos existentes no se eliminarán del calendario, pero no se sincronizarán nuevos cambios.')) {
      return;
    }
    
    setCargandoGoogleCalendar(true);
    try {
      await axios.post('/api/google-calendar/disconnect');
      mostrarMensaje('success', 'Google Calendar desconectado');
      cargarGoogleCalendarStatus();
    } catch (error) {
      console.error('Error al desconectar Google Calendar:', error);
      mostrarMensaje('error', 'Error al desconectar Google Calendar');
    } finally {
      setCargandoGoogleCalendar(false);
    }
  };

  const reconectarGoogleCalendar = async () => {
    setCargandoGoogleCalendar(true);
    try {
      const response = await axios.post('/api/google-calendar/reconnect');
      if (response.data.authUrl) {
        window.location.href = response.data.authUrl;
      }
    } catch (error) {
      console.error('Error al reconectar Google Calendar:', error);
      setGoogleCalendarError('Error al reconectar Google Calendar');
    } finally {
      setCargandoGoogleCalendar(false);
    }
  };

  // Verificar parámetros de URL para callback de Google Calendar
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const calendarConnected = urlParams.get('calendar_connected');
    const calendarError = urlParams.get('calendar_error');
    
    if (calendarConnected === 'true') {
      mostrarMensaje('success', '✅ Google Calendar conectado exitosamente');
      // Limpiar parámetros de URL
      window.history.replaceState({}, '', window.location.pathname);
      // Activar tab de mantenimiento y cargar estado
      setTabActiva('mantenimiento');
      cargarGoogleCalendarStatus();
    }
    
    if (calendarError) {
      const errorMessages = {
        'no_code': 'No se recibió código de autorización',
        'exchange_failed': 'Error al procesar la autorización',
        'exception': 'Error inesperado durante la autorización',
        'access_denied': 'Acceso denegado por el usuario'
      };
      setGoogleCalendarError(errorMessages[calendarError] || calendarError);
      setTabActiva('mantenimiento');
    }
  }, []);

  // ========== FIN FUNCIONES DE GOOGLE CALENDAR ==========

  // ========== FUNCIONES DE EVENTOS ==========
  const cargarEventos = async () => {
    try {
      const response = await axios.get('/api/eventos');
      setEventos(response.data);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
    }
  };

  const handleImagenEvento = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      mostrarMensaje('error', 'La imagen no puede superar los 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setNuevoEvento(prev => ({ ...prev, imagenBase64: base64 }));
      setImagenPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const abrirFormularioEvento = (evento = null) => {
    if (evento) {
      setEventoEditando(evento);
      setNuevoEvento({
        titulo: evento.titulo,
        descripcion: evento.descripcion || '',
        fechaEvento: evento.fechaEvento || '',
        horarioEvento: evento.horarioEvento || '',
        imagenBase64: evento.imagenBase64 || ''
      });
      setImagenPreview(evento.imagenBase64 || null);
    } else {
      setEventoEditando(null);
      setNuevoEvento({ titulo: '', descripcion: '', fechaEvento: '', horarioEvento: '', imagenBase64: '' });
      setImagenPreview(null);
    }
    setMostrarFormularioEvento(true);
  };

  const cerrarFormularioEvento = () => {
    setMostrarFormularioEvento(false);
    setEventoEditando(null);
    setNuevoEvento({ titulo: '', descripcion: '', fechaEvento: '', horarioEvento: '', imagenBase64: '' });
    setImagenPreview(null);
  };

  const guardarEvento = async (e) => {
    e.preventDefault();
    if (!nuevoEvento.titulo.trim()) {
      mostrarMensaje('error', 'El título es obligatorio');
      return;
    }
    try {
      const payload = {
        titulo: nuevoEvento.titulo,
        descripcion: nuevoEvento.descripcion,
        fechaEvento: nuevoEvento.fechaEvento,
        horarioEvento: nuevoEvento.horarioEvento,
        imagenBase64: nuevoEvento.imagenBase64
      };
      if (eventoEditando) {
        await axios.put(`/api/eventos/${eventoEditando.id}`, payload);
        mostrarMensaje('success', 'Evento actualizado correctamente');
      } else {
        await axios.post('/api/eventos', payload);
        mostrarMensaje('success', 'Evento creado correctamente');
      }
      cerrarFormularioEvento();
      cargarEventos();
    } catch (error) {
      console.error('Error al guardar evento:', error.response?.data || error);
      mostrarMensaje('error', 'Error al guardar el evento: ' + (error.response?.data?.message || error.message || 'Error desconocido'));
    }
  };

  const toggleEvento = async (id) => {
    try {
      await axios.put(`/api/eventos/${id}/toggle`);
      cargarEventos();
      mostrarMensaje('success', 'Estado del evento actualizado');
    } catch (error) {
      mostrarMensaje('error', 'Error al cambiar estado del evento');
    }
  };

  const eliminarEvento = async (id) => {
    try {
      await axios.delete(`/api/eventos/${id}`);
      setModalEliminarEvento({ visible: false, evento: null });
      cargarEventos();
      mostrarMensaje('success', 'Evento eliminado correctamente');
    } catch (error) {
      mostrarMensaje('error', 'Error al eliminar el evento');
    }
  };
  // ========== FIN FUNCIONES DE EVENTOS ==========

  return (
    <div className="ver-turnos-page">
      <div className="container">
        <div className="page-header">
          <h2 className="page-title">Panel de Administración</h2>
          <div className="header-actions">
            <button onClick={handleCerrarSesion} className="btn btn-secondary">
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Sistema de Tabs */}
        <div className="tabs-container">
          <button 
            className={`tab-btn ${tabActiva === 'turnos' ? 'activa' : ''}`}
            onClick={() => setTabActiva('turnos')}
          >
            📅 Gestión de Turnos
          </button>
          <button 
            className={`tab-btn ${tabActiva === 'bloqueos' ? 'activa' : ''}`}
            onClick={() => setTabActiva('bloqueos')}
          >
            🚫 Horarios Bloqueados
          </button>
          <button 
            className={`tab-btn ${tabActiva === 'calendario' ? 'activa' : ''}`}
            onClick={() => setTabActiva('calendario')}
          >
            🗓️ Calendario Vacaciones
          </button>
          <button 
            className={`tab-btn ${tabActiva === 'diasNoLaborables' ? 'activa' : ''}`}
            onClick={() => setTabActiva('diasNoLaborables')}
          >
            🚫 Días No Laborables
          </button>
          <button 
            className={`tab-btn ${tabActiva === 'pacientesFijos' ? 'activa' : ''}`}
            onClick={() => setTabActiva('pacientesFijos')}
          >
            🔁 Pacientes Fijos
          </button>
          <button 
            className={`tab-btn ${tabActiva === 'profesionales' ? 'activa' : ''}`}
            onClick={() => setTabActiva('profesionales')}
          >
            👥 Profesionales
          </button>
          <button 
            className={`tab-btn ${tabActiva === 'eventos' ? 'activa' : ''}`}
            onClick={() => setTabActiva('eventos')}
          >
            🎉 Eventos
          </button>
          <button 
            className={`tab-btn tab-mantenimiento ${tabActiva === 'mantenimiento' ? 'activa' : ''}`}
            onClick={() => setTabActiva('mantenimiento')}
          >
            ⚙️ Mantenimiento
          </button>
        </div>

        {/* Toast de mensajes global */}
        {mensaje.texto && (
          <div className={`toast-mensaje toast-${mensaje.tipo}`} onClick={cerrarMensaje}>
            <span className="toast-icono">
              {mensaje.tipo === 'success' ? '✅' : mensaje.tipo === 'error' ? '❌' : 'ℹ️'}
            </span>
            <span className="toast-texto">{mensaje.texto}</span>
            <button className="toast-cerrar" onClick={cerrarMensaje}>✕</button>
          </div>
        )}

        {/* Contenido según tab activa */}
        {tabActiva === 'turnos' && (
          // ========== CONTENIDO TAB TURNOS ==========
          <>
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
          </>
        )}

        {tabActiva === 'bloqueos' && (
          // ========== CONTENIDO TAB BLOQUEOS ==========
          <div className="bloqueos-content">
            
            <div className="selector-profesional card">
              <label htmlFor="profesional-bloqueo">Seleccionar Profesional:</label>
              <select
                id="profesional-bloqueo"
                value={profesionalSeleccionado}
                onChange={(e) => setProfesionalSeleccionado(e.target.value)}
                className="select-profesional"
              >
                <option value="">-- Selecciona un profesional --</option>
                {profesionales.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} - {prof.especialidad}
                  </option>
                ))}
              </select>
            </div>

            {profesionalSeleccionado && (
              <>
                {/* Botones de acción */}
                <div className="bloqueos-acciones">
                  <button
                    className="btn btn-primary"
                    onClick={() => setMostrarFormulario(!mostrarFormulario)}
                  >
                    {mostrarFormulario ? '✕ Cancelar' : '➕ Bloquear Horario'}
                  </button>
                  <button
                    className="btn btn-warning"
                    onClick={bloquearDiaCompleto}
                  >
                    📅 Bloquear Día Completo
                  </button>
                </div>

                {/* Formulario de nuevo bloqueo */}
                {mostrarFormulario && (
                  <div className="formulario-bloqueo card fade-in">
                    <h3>Nuevo Bloqueo de Horario</h3>
                    <form onSubmit={agregarBloqueo}>
                      <div className="form-grid">
                        <div className="form-group">
                          <label htmlFor="fecha-bloqueo">Fecha:</label>
                          <input
                            type="date"
                            id="fecha-bloqueo"
                            value={nuevoBloqueo.fecha}
                            onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, fecha: e.target.value})}
                            required
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="hora-inicio">Hora Inicio:</label>
                          <input
                            type="time"
                            id="hora-inicio"
                            value={nuevoBloqueo.horaInicio}
                            onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, horaInicio: e.target.value})}
                            required
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="hora-fin">Hora Fin:</label>
                          <input
                            type="time"
                            id="hora-fin"
                            value={nuevoBloqueo.horaFin}
                            onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, horaFin: e.target.value})}
                            required
                            className="form-input"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="motivo-bloqueo">Motivo:</label>
                          <select
                            id="motivo-bloqueo"
                            value={nuevoBloqueo.motivo}
                            onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, motivo: e.target.value})}
                            className="form-input"
                          >
                            <option value="VACACIONES">🏖️ VACACIONES</option>
                            <option value="OCUPADO">⛔ OCUPADO</option>
                            <option value="OTRO">🚫 OTRO</option>
                          </select>
                        </div>

                        <div className="form-group form-group-full">
                          <label htmlFor="descripcion-bloqueo">Descripción (opcional):</label>
                          <textarea
                            id="descripcion-bloqueo"
                            value={nuevoBloqueo.descripcion}
                            onChange={(e) => setNuevoBloqueo({...nuevoBloqueo, descripcion: e.target.value})}
                            placeholder="Ej: Viaje personal, reunión importante..."
                            className="form-textarea"
                            rows="3"
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn btn-success">
                        ✅ Guardar Bloqueo
                      </button>
                    </form>
                  </div>
                )}

                {/* Lista de bloqueos */}
                {cargandoBloqueos ? (
                  <div className="cargando-container">
                    <div className="cargando">Cargando bloqueos...</div>
                  </div>
                ) : bloqueos.length === 0 ? (
                  <div className="sin-turnos card">
                    <div className="sin-turnos-icono">📋</div>
                    <h3>No hay bloqueos</h3>
                    <p>Este profesional no tiene horarios bloqueados</p>
                  </div>
                ) : (
                  <div className="bloqueos-lista">
                    <h3 className="lista-titulo">Horarios Bloqueados ({bloqueos.length})</h3>
                    <div className="bloqueos-grid">
                      {bloqueos.map((bloqueo) => (
                        <div 
                          key={bloqueo.id} 
                          className="bloqueo-card card fade-in"
                          style={{ borderLeft: `5px solid ${obtenerColorMotivo(bloqueo.motivo)}` }}
                        >
                          <div className="bloqueo-header">
                            <div className="bloqueo-motivo">
                              <span className="motivo-emoji">{obtenerEmojiMotivo(bloqueo.motivo)}</span>
                              <span className="motivo-texto">{bloqueo.motivo}</span>
                            </div>
                            <button
                              className="btn-eliminar-bloqueo"
                              onClick={() => eliminarBloqueo(bloqueo.id)}
                              title="Eliminar bloqueo"
                            >
                              ✕
                            </button>
                          </div>

                          <div className="bloqueo-info">
                            <div className="bloqueo-dato">
                              <span className="dato-icono">📅</span>
                              <span className="dato-texto">{formatearFechaBloqueo(bloqueo.fecha)}</span>
                            </div>
                            
                            {bloqueo.horaInicio && bloqueo.horaFin && (
                              <div className="bloqueo-dato">
                                <span className="dato-icono">🕐</span>
                                <span className="dato-texto">{bloqueo.horaInicio} - {bloqueo.horaFin}</span>
                              </div>
                            )}

                            {!bloqueo.horaInicio && !bloqueo.horaFin && (
                              <div className="bloqueo-dato">
                                <span className="dato-icono">📅</span>
                                <span className="dato-texto badge-dia-completo">DÍA COMPLETO</span>
                              </div>
                            )}

                            {bloqueo.descripcion && (
                              <div className="bloqueo-descripcion">
                                <strong>Descripción:</strong> {bloqueo.descripcion}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {tabActiva === 'calendario' && (
          <div className="calendario-content">

            <div className="selector-profesional card">
              <label htmlFor="profesional-calendario">Seleccionar Profesional:</label>
              <select
                id="profesional-calendario"
                value={profesionalSeleccionado}
                onChange={(e) => setProfesionalSeleccionado(e.target.value)}
                className="select-profesional"
              >
                <option value="">-- Selecciona un profesional --</option>
                {profesionales.map(prof => (
                  <option key={prof.id} value={prof.id}>
                    {prof.nombre} - {prof.especialidad}
                  </option>
                ))}
              </select>
            </div>

            {profesionalSeleccionado && (
              <>
                <div className="calendario-instrucciones card">
                  <h3>📌 Instrucciones:</h3>
                  <ul>
                    <li>🖱️ <strong>Clic en un día</strong> para seleccionar un día individual</li>
                    <li>📅 <strong>Clic en dos días</strong> para seleccionar un rango de fechas</li>
                    <li>✅ Presiona <strong>"Bloquear Período"</strong> para confirmar</li>
                    <li>🔄 Presiona <strong>"Limpiar Selección"</strong> para empezar de nuevo</li>
                  </ul>
                </div>

                <div className="calendario-card card">
                  {/* Navegación del calendario */}
                  <div className="calendario-header">
                    <button 
                      onClick={mesAnterior}
                      className="btn-nav-calendario"
                      title="Mes anterior"
                    >
                      ⬅️
                    </button>
                    <h3 className="mes-actual">{formatearMesAño(mesActual)}</h3>
                    <button 
                      onClick={mesSiguiente}
                      className="btn-nav-calendario"
                      title="Mes siguiente"
                    >
                      ➡️
                    </button>
                  </div>

                  {/* Información de selección */}
                  {fechaInicio && (
                    <div className="seleccion-info">
                      {fechaFin ? (
                        <p>
                          📅 Período seleccionado: <strong>{fechaInicio.toLocaleDateString('es-AR')}</strong> hasta <strong>{fechaFin.toLocaleDateString('es-AR')}</strong>
                        </p>
                      ) : (
                        <p>
                          📅 Fecha seleccionada: <strong>{fechaInicio.toLocaleDateString('es-AR')}</strong>
                          {seleccionandoRango && <span className="texto-ayuda"> (Selecciona el día final del rango)</span>}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Días de la semana */}
                  <div className="calendario-dias-semana">
                    <div className="dia-semana">Dom</div>
                    <div className="dia-semana">Lun</div>
                    <div className="dia-semana">Mar</div>
                    <div className="dia-semana">Mié</div>
                    <div className="dia-semana">Jue</div>
                    <div className="dia-semana">Vie</div>
                    <div className="dia-semana">Sáb</div>
                  </div>

                  {/* Grid de días */}
                  <div className="calendario-grid">
                    {obtenerDiasDelMes(mesActual).map((fecha, index) => {
                      if (!fecha) {
                        return <div key={`empty-${index}`} className="dia-vacio"></div>;
                      }

                      const esSeleccionado = esFechaSeleccionada(fecha);
                      const esPasado = esFechaPasada(fecha);
                      const esHoy = fecha.toDateString() === new Date().toDateString();

                      return (
                        <div
                          key={index}
                          className={`dia-calendario ${esSeleccionado ? 'seleccionado' : ''} ${esPasado ? 'pasado' : ''} ${esHoy ? 'hoy' : ''}`}
                          onClick={() => !esPasado && seleccionarDia(fecha)}
                        >
                          {fecha.getDate()}
                        </div>
                      );
                    })}
                  </div>

                  {/* Acciones del calendario */}
                  <div className="calendario-acciones">
                    <button
                      className="btn btn-success"
                      onClick={bloquearPeriodoCalendario}
                      disabled={!fechaInicio}
                    >
                      ✅ Bloquear Período
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={limpiarSeleccion}
                      disabled={!fechaInicio && !fechaFin}
                    >
                      🔄 Limpiar Selección
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tabActiva === 'diasNoLaborables' && (
          <div className="dias-no-laborables-content">
            <div className="section-header">
              <h3 className="section-title">🚫 Gestión de Días No Laborables</h3>
              <p className="section-description">
                Configure los días en que el consultorio no atiende. Los clientes no podrán agendar turnos en estos días.
              </p>
            </div>

            {cargandoDiasNoLaborables ? (
              <div className="loading">Cargando configuración...</div>
            ) : (
              <>
                {/* Días de la semana no laborables */}
                <div className="card">
                  <h4 className="subsection-title">📅 Días de la Semana No Laborables</h4>
                  <p className="help-text">
                    Seleccione los días de la semana en que el consultorio NO atiende (por ejemplo: domingos)
                  </p>
                  
                  <div className="dias-semana-grid">
                    {[
                      { valor: 'SUNDAY', nombre: 'Domingo', emoji: '☀️' },
                      { valor: 'MONDAY', nombre: 'Lunes', emoji: '📅' },
                      { valor: 'TUESDAY', nombre: 'Martes', emoji: '📅' },
                      { valor: 'WEDNESDAY', nombre: 'Miércoles', emoji: '📅' },
                      { valor: 'THURSDAY', nombre: 'Jueves', emoji: '📅' },
                      { valor: 'FRIDAY', nombre: 'Viernes', emoji: '📅' },
                      { valor: 'SATURDAY', nombre: 'Sábado', emoji: '🌙' }
                    ].map(dia => (
                      <button
                        key={dia.valor}
                        className={`dia-semana-btn ${diasNoLaborables.diasSemana?.includes(dia.valor) ? 'bloqueado' : ''}`}
                        onClick={() => toggleDiaSemana(dia.valor)}
                      >
                        <span className="dia-emoji">{dia.emoji}</span>
                        <span className="dia-nombre">{dia.nombre}</span>
                        {diasNoLaborables.diasSemana?.includes(dia.valor) && (
                          <span className="dia-estado">🚫 Bloqueado</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fechas específicas no laborables */}
                <div className="card">
                  <h4 className="subsection-title">📆 Fechas Específicas No Laborables</h4>
                  <p className="help-text">
                    Agregue días específicos como feriados, eventos especiales, etc.
                  </p>

                  <form onSubmit={agregarFechaNoLaborable} className="form-fecha-no-laborable">
                    <div className="form-row">
                      <div className="form-group">
                        <label>Fecha</label>
                        <input
                          type="date"
                          value={nuevaFechaNoLaborable.fecha}
                          onChange={(e) => setNuevaFechaNoLaborable({
                            ...nuevaFechaNoLaborable,
                            fecha: e.target.value
                          })}
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>
                      <div className="form-group form-group-large">
                        <label>Descripción (opcional)</label>
                        <input
                          type="text"
                          value={nuevaFechaNoLaborable.descripcion}
                          onChange={(e) => setNuevaFechaNoLaborable({
                            ...nuevaFechaNoLaborable,
                            descripcion: e.target.value
                          })}
                          placeholder="Ej: Día de la Independencia, Evento especial..."
                        />
                      </div>
                      <button type="submit" className="btn btn-primary">
                        ➕ Agregar Fecha
                      </button>
                    </div>
                  </form>

                  {diasNoLaborables.fechasEspecificas.length === 0 ? (
                    <div className="empty-state">
                      <p>No hay fechas específicas bloqueadas</p>
                    </div>
                  ) : (
                    <div className="fechas-no-laborables-list">
                      <table className="tabla-fechas">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {diasNoLaborables.fechasEspecificas
                            .sort((a, b) => {
                              const fechaA = typeof a === 'string' ? a : a.fecha;
                              const fechaB = typeof b === 'string' ? b : b.fecha;
                              return fechaA.localeCompare(fechaB);
                            })
                            .map((item, index) => {
                              const fecha = typeof item === 'string' ? item : item.fecha;
                              const descripcion = typeof item === 'string' ? '' : item.descripcion;
                              const fechaObj = new Date(fecha + 'T00:00:00');
                              
                              return (
                                <tr key={index}>
                                  <td>
                                    <strong>{fechaObj.toLocaleDateString('es-AR', { 
                                      weekday: 'long', 
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}</strong>
                                  </td>
                                  <td>{descripcion || <em className="sin-descripcion">Sin descripción</em>}</td>
                                  <td>
                                    <button
                                      className="btn btn-danger btn-small"
                                      onClick={() => eliminarFechaNoLaborable(fecha)}
                                    >
                                      🗑️ Eliminar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Información importante */}
                <div className="info-card card">
                  <h5>ℹ️ Información Importante</h5>
                  <ul className="info-list">
                    <li>✅ Los días bloqueados no aparecerán disponibles en el calendario de agendar turno</li>
                    <li>✅ Los clientes no podrán seleccionar estos días al agendar turnos</li>
                    <li>✅ Los días de la semana bloqueados se aplican de forma recurrente</li>
                    <li>✅ Las fechas específicas solo se bloquean para ese día en particular</li>
                    <li>⚠️ Los turnos ya agendados en días bloqueados NO se cancelan automáticamente</li>
                  </ul>
                </div>
              </>
            )}
          </div>
        )}

        {tabActiva === 'pacientesFijos' && (
          <div className="pacientes-fijos-content">
            <div className="pacientes-fijos-header-section">
              <div className="pacientes-fijos-intro">
                <div className="intro-icon">🔁</div>
                <div className="intro-text">
                  <h3>Pacientes Fijos</h3>
                  <p>Gestiona los turnos recurrentes semanales. Se sincronizan automáticamente con Google Calendar.</p>
                </div>
              </div>
              <button 
                className="btn btn-primary btn-nuevo-paciente"
                onClick={() => abrirFormularioPacienteFijo()}
              >
                <span className="btn-icon-left">➕</span>
                Nuevo Paciente Fijo
              </button>
            </div>

            {mostrarFormularioPacienteFijo && (
              <div className="paciente-fijo-formulario card">
                <div className="formulario-header">
                  <h4>{pacienteFijoEditando ? '✏️ Editar Paciente Fijo' : '➕ Nuevo Paciente Fijo'}</h4>
                  <button 
                    type="button" 
                    className="btn-cerrar-form"
                    onClick={cerrarFormularioPacienteFijo}
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={guardarPacienteFijo} className="formulario-paciente-fijo">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="profesional-paciente-fijo">
                        <span className="label-icon">👨‍⚕️</span> Profesional
                      </label>
                      <select
                        id="profesional-paciente-fijo"
                        value={nuevoPacienteFijo.profesionalId}
                        onChange={(e) => setNuevoPacienteFijo({...nuevoPacienteFijo, profesionalId: e.target.value})}
                        className="form-input"
                        required
                      >
                        <option value="">Seleccione un profesional</option>
                        {profesionales.map(prof => (
                          <option key={prof.id} value={prof.id}>{prof.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="nombre-paciente-fijo">
                        <span className="label-icon">👤</span> Nombre del Paciente
                      </label>
                      <input
                        type="text"
                        id="nombre-paciente-fijo"
                        value={nuevoPacienteFijo.nombrePaciente}
                        onChange={(e) => setNuevoPacienteFijo({...nuevoPacienteFijo, nombrePaciente: e.target.value})}
                        placeholder="Ej: Juan Pérez"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group form-group-dias">
                    <label>
                      <span className="label-icon">📅</span> Días de la Semana
                    </label>
                    <div className="dias-checkboxes">
                      {['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'].map(dia => (
                        <label key={dia} className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={nuevoPacienteFijo.diasSemana.includes(dia)}
                            onChange={(e) => {
                              const dias = [...nuevoPacienteFijo.diasSemana];
                              if (e.target.checked) {
                                dias.push(dia);
                              } else {
                                const index = dias.indexOf(dia);
                                if (index > -1) dias.splice(index, 1);
                              }
                              setNuevoPacienteFijo({...nuevoPacienteFijo, diasSemana: dias});
                            }}
                          />
                          <span className="dia-abrev">{dia.substring(0, 3)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="hora-paciente-fijo">
                        <span className="label-icon">🕐</span> Hora
                      </label>
                      <select
                        id="hora-paciente-fijo"
                        value={nuevoPacienteFijo.hora}
                        onChange={(e) => setNuevoPacienteFijo({...nuevoPacienteFijo, hora: e.target.value})}
                        className="form-input"
                        required
                      >
                        {Array.from({length: 12}, (_, i) => i + 8).map(hora => (
                          <option key={hora} value={`${hora.toString().padStart(2, '0')}:00`}>
                            {hora.toString().padStart(2, '0')}:00
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="modalidad-paciente-fijo">
                        <span className="label-icon">📍</span> Modalidad
                      </label>
                      <select
                        id="modalidad-paciente-fijo"
                        value={nuevoPacienteFijo.modalidad}
                        onChange={(e) => setNuevoPacienteFijo({...nuevoPacienteFijo, modalidad: e.target.value})}
                        className="form-input"
                        required
                      >
                        <option value="presencial">🏢 Presencial</option>
                        <option value="virtual">💻 Virtual</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="observaciones-paciente-fijo">
                      <span className="label-icon">📝</span> Observaciones (opcional)
                    </label>
                    <textarea
                      id="observaciones-paciente-fijo"
                      value={nuevoPacienteFijo.observaciones}
                      onChange={(e) => setNuevoPacienteFijo({...nuevoPacienteFijo, observaciones: e.target.value})}
                      placeholder="Notas adicionales..."
                      className="form-textarea"
                      rows="2"
                    />
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success btn-guardar">
                      💾 {pacienteFijoEditando ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={cerrarFormularioPacienteFijo}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="pacientes-fijos-lista">
              <div className="lista-header">
                <h4>
                  <span className="lista-icon">📋</span>
                  Listado de Pacientes Fijos
                  <span className="badge-count">{pacientesFijos.length}</span>
                </h4>
              </div>
              
              {pacientesFijos.length > 0 ? (
                <div className="pacientes-fijos-grid">
                  {pacientesFijos.map(pf => (
                    <div key={pf.id} className="paciente-fijo-card">
                      <div className="pf-card-header">
                        <div className="pf-avatar">
                          {pf.nombrePaciente.charAt(0).toUpperCase()}
                        </div>
                        <div className="pf-nombre-container">
                          <h5 className="pf-nombre">{pf.nombrePaciente}</h5>
                          <span className="pf-profesional">{pf.nombreProfesional}</span>
                        </div>
                        <div className="pf-acciones">
                          <button 
                            className="btn-icon-small btn-editar"
                            onClick={() => abrirFormularioPacienteFijo(pf)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-icon-small btn-eliminar"
                            onClick={() => abrirModalEliminarPacienteFijo(pf)}
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="pf-card-body">
                        <div className="pf-detalle">
                          <span className="pf-detalle-icon">📅</span>
                          <span className="pf-dias">
                            {pf.diasSemana && pf.diasSemana.length > 0 
                              ? pf.diasSemana.map(d => d.substring(0, 3)).join(' • ') 
                              : pf.diaSemana}
                          </span>
                        </div>
                        <div className="pf-detalle">
                          <span className="pf-detalle-icon">🕐</span>
                          <span className="pf-hora">{pf.hora} hs</span>
                        </div>
                        <div className="pf-detalle">
                          <span className="pf-detalle-icon">{pf.modalidad === 'presencial' ? '🏢' : '💻'}</span>
                          <span className={`pf-modalidad ${pf.modalidad}`}>
                            {pf.modalidad.charAt(0).toUpperCase() + pf.modalidad.slice(1)}
                          </span>
                        </div>
                        {pf.observaciones && (
                          <div className="pf-observaciones">
                            <span className="pf-detalle-icon">📝</span>
                            <span>{pf.observaciones}</span>
                          </div>
                        )}
                      </div>
                      {pf.googleEventId && (
                        <div className="pf-card-footer">
                          <span className="sync-badge">✅ Sincronizado con Google Calendar</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <h5>No hay pacientes fijos registrados</h5>
                  <p>Los pacientes fijos permiten agendar turnos recurrentes semanales.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => abrirFormularioPacienteFijo()}
                  >
                    ➕ Agregar primer paciente fijo
                  </button>
                </div>
              )}
            </div>

            {/* Modal de confirmación para eliminar paciente fijo */}
            {modalEliminarPacienteFijo.visible && modalEliminarPacienteFijo.pacienteFijo && (
              <div className="modal-overlay" onClick={cerrarModalEliminarPacienteFijo}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>¿Eliminar este paciente fijo?</h3>
                    <button className="modal-close" onClick={cerrarModalEliminarPacienteFijo}>✕</button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="turno-info-modal">
                      <div className="info-item">
                        <span className="info-label">Paciente:</span>
                        <span className="info-value">{modalEliminarPacienteFijo.pacienteFijo.nombrePaciente}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Profesional:</span>
                        <span className="info-value">{modalEliminarPacienteFijo.pacienteFijo.nombreProfesional}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Día:</span>
                        <span className="info-value">
                          {modalEliminarPacienteFijo.pacienteFijo.diasSemana && modalEliminarPacienteFijo.pacienteFijo.diasSemana.length > 0
                            ? modalEliminarPacienteFijo.pacienteFijo.diasSemana.map(d => d.charAt(0) + d.slice(1).toLowerCase()).join(', ')
                            : modalEliminarPacienteFijo.pacienteFijo.diaSemana} a las {modalEliminarPacienteFijo.pacienteFijo.hora}
                        </span>
                      </div>
                    </div>
                    
                    <p className="modal-advertencia">
                      ⚠️ Esta acción eliminará el turno recurrente semanal y también lo removerá de Google Calendar. Los horarios quedarán disponibles para nuevos turnos.
                    </p>
                  </div>

                  <div className="modal-footer">
                    <button 
                      className="btn-modal btn-cancelar-modal" 
                      onClick={confirmarEliminarPacienteFijo}
                    >
                      Sí, eliminar paciente fijo
                    </button>
                    <button 
                      className="btn-modal btn-volver" 
                      onClick={cerrarModalEliminarPacienteFijo}
                    >
                      No, volver
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tabActiva === 'profesionales' && (
          <div className="profesionales-content">
            <div className="profesionales-header card">
              <h3>Gestión de Profesionales</h3>
              <button 
                className="btn btn-success"
                onClick={() => abrirFormularioProfesional()}
              >
                ➕ Nuevo Profesional
              </button>
            </div>

            {mostrarFormularioProfesional && (
              <div className="profesional-formulario card">
                <h4>{profesionalEditando ? 'Editar Profesional' : 'Nuevo Profesional'}</h4>
                <form onSubmit={guardarProfesional}>
                  <div className="form-group">
                    <label htmlFor="nombre-profesional">Nombre completo: *</label>
                    <input
                      type="text"
                      id="nombre-profesional"
                      value={nuevoProfesional.nombre}
                      onChange={(e) => setNuevoProfesional({...nuevoProfesional, nombre: e.target.value})}
                      placeholder="Ej: Jimena A. Cofman"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="titulo-profesional">Título:</label>
                    <input
                      type="text"
                      id="titulo-profesional"
                      value={nuevoProfesional.titulo}
                      onChange={(e) => setNuevoProfesional({...nuevoProfesional, titulo: e.target.value})}
                      placeholder="Ej: Lic., Dr., Dra., etc."
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="especialidad-profesional">Especialidad: *</label>
                    <input
                      type="text"
                      id="especialidad-profesional"
                      value={nuevoProfesional.especialidad}
                      onChange={(e) => setNuevoProfesional({...nuevoProfesional, especialidad: e.target.value})}
                      placeholder="Ej: Psicóloga Infanto-Juvenil"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="descripcion-profesional">Descripción:</label>
                    <textarea
                      id="descripcion-profesional"
                      value={nuevoProfesional.descripcion}
                      onChange={(e) => setNuevoProfesional({...nuevoProfesional, descripcion: e.target.value})}
                      placeholder="Descripción breve del profesional..."
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="color-profesional">🎨 Color en Google Calendar:</label>
                    <div className="color-selector">
                      {coloresCalendario.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          className={`color-option ${nuevoProfesional.colorCalendario === c.id ? 'selected' : ''}`}
                          style={{ backgroundColor: c.color }}
                          onClick={() => setNuevoProfesional({...nuevoProfesional, colorCalendario: c.id})}
                          title={c.nombre}
                        >
                          {nuevoProfesional.colorCalendario === c.id && '✓'}
                        </button>
                      ))}
                    </div>
                    <small className="form-hint">
                      Este color se usará para identificar los turnos de este profesional en Google Calendar
                    </small>
                  </div>

                  <div className="form-group">
                    <label>📅 Días y horarios de trabajo:</label>
                    <div className="horarios-selector">
                      {['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'].map(dia => {
                        const horarioExistente = (nuevoProfesional.horarios || []).find(h => h.startsWith(dia + ':'));
                        const activo = !!horarioExistente;
                        const horaInicio = horarioExistente ? horarioExistente.split(':')[1] + ':' + horarioExistente.split(':')[2]?.split('-')[0] : '09:00';
                        const horaFin = horarioExistente ? horarioExistente.split('-')[1] : '18:00';
                        
                        return (
                          <div key={dia} className={`horario-dia-row ${activo ? 'activo' : ''}`}>
                            <label className="horario-dia-check">
                              <input
                                type="checkbox"
                                checked={activo}
                                onChange={(e) => {
                                  let nuevosHorarios = [...(nuevoProfesional.horarios || [])];
                                  if (e.target.checked) {
                                    nuevosHorarios.push(`${dia}:09:00-18:00`);
                                  } else {
                                    nuevosHorarios = nuevosHorarios.filter(h => !h.startsWith(dia + ':'));
                                  }
                                  setNuevoProfesional({...nuevoProfesional, horarios: nuevosHorarios});
                                }}
                              />
                              <span className="dia-nombre">{dia.charAt(0) + dia.slice(1).toLowerCase()}</span>
                            </label>
                            {activo && (
                              <div className="horario-horas">
                                <input
                                  type="time"
                                  value={horaInicio}
                                  onChange={(e) => {
                                    const nuevosHorarios = (nuevoProfesional.horarios || []).map(h => 
                                      h.startsWith(dia + ':') ? `${dia}:${e.target.value}-${horaFin}` : h
                                    );
                                    setNuevoProfesional({...nuevoProfesional, horarios: nuevosHorarios});
                                  }}
                                  className="input-hora"
                                />
                                <span className="hora-separador">a</span>
                                <input
                                  type="time"
                                  value={horaFin}
                                  onChange={(e) => {
                                    const nuevosHorarios = (nuevoProfesional.horarios || []).map(h => 
                                      h.startsWith(dia + ':') ? `${dia}:${horaInicio}-${e.target.value}` : h
                                    );
                                    setNuevoProfesional({...nuevoProfesional, horarios: nuevosHorarios});
                                  }}
                                  className="input-hora"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <small className="form-hint">
                      Seleccioná los días que trabaja el profesional y configurá el horario de cada día
                    </small>
                  </div>

                  <div className="form-actions">
                    <button type="submit" className="btn btn-success">
                      💾 {profesionalEditando ? 'Actualizar' : 'Guardar'} Profesional
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={cerrarFormularioProfesional}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="profesionales-lista">
              <h4>Lista de Profesionales ({profesionales.length})</h4>
              <div className="profesionales-grid">
                {profesionales.map(prof => (
                  <div key={prof.id} className="profesional-item card">
                    <div className="profesional-info">
                      <h5>{prof.nombre}</h5>
                      <p className="profesional-especialidad">{prof.especialidad}</p>
                      {prof.descripcion && (
                        <p className="profesional-descripcion">{prof.descripcion}</p>
                      )}
                      <div className="profesional-color-badge">
                        <span 
                          className="color-indicator" 
                          style={{ backgroundColor: coloresCalendario.find(c => c.id === prof.colorCalendario)?.color || '#5484ed' }}
                        ></span>
                        <span className="color-label">
                          {coloresCalendario.find(c => c.id === prof.colorCalendario)?.nombre || 'Azul'}
                        </span>
                      </div>
                      {prof.horarios && prof.horarios.length > 0 && (
                        <div className="profesional-horarios-badge">
                          <span className="horarios-titulo">📅 Horarios:</span>
                          {prof.horarios.map((h, idx) => {
                            const partes = h.split(':');
                            const dia = partes[0].charAt(0) + partes[0].slice(1).toLowerCase();
                            const horas = h.substring(h.indexOf(':') + 1);
                            return (
                              <span key={idx} className="horario-badge">
                                {dia}: {horas}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="profesional-acciones">
                      <button 
                        className="btn-icon btn-editar"
                        onClick={() => abrirFormularioProfesional(prof)}
                        title="Editar profesional"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-eliminar"
                        onClick={() => abrirModalEliminarProfesional(prof)}
                        title="Eliminar profesional"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
                
                {profesionales.length === 0 && (
                  <div className="mensaje-vacio">
                    <p>No hay profesionales registrados.</p>
                    <p>Haz clic en "Nuevo Profesional" para agregar uno.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal de confirmación para eliminar profesional */}
            {modalEliminarProfesional.visible && modalEliminarProfesional.profesional && (
              <div className="modal-overlay" onClick={cerrarModalEliminarProfesional}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>¿Eliminar este profesional?</h3>
                    <button className="modal-close" onClick={cerrarModalEliminarProfesional}>✕</button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="turno-info-modal">
                      <div className="info-item">
                        <span className="info-label">Nombre:</span>
                        <span className="info-value">{modalEliminarProfesional.profesional.nombre}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Especialidad:</span>
                        <span className="info-value">{modalEliminarProfesional.profesional.especialidad}</span>
                      </div>
                      {modalEliminarProfesional.profesional.descripcion && (
                        <div className="info-item">
                          <span className="info-label">Descripción:</span>
                          <span className="info-value">{modalEliminarProfesional.profesional.descripcion}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="modal-advertencia">
                      ⚠️ Esta acción no se puede deshacer. Si el profesional tiene turnos asociados, no podrá ser eliminado.
                    </p>
                  </div>

                  <div className="modal-footer">
                    <button 
                      className="btn-modal btn-cancelar-modal" 
                      onClick={confirmarEliminarProfesional}
                    >
                      Sí, eliminar profesional
                    </button>
                    <button 
                      className="btn-modal btn-volver" 
                      onClick={cerrarModalEliminarProfesional}
                    >
                      No, volver
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab de Eventos */}
        {tabActiva === 'eventos' && (
          <div className="eventos-admin-content">
            <div className="section-header">
              <h3>🎉 Gestión de Eventos y Programas</h3>
              <button className="btn-nuevo" onClick={() => abrirFormularioEvento()}>
                + Nuevo Evento
              </button>
            </div>

            {/* Formulario de Evento */}
            {mostrarFormularioEvento && (
              <div className="formulario-evento card">
                <h4>{eventoEditando ? '✏️ Editar Evento' : '➕ Nuevo Evento'}</h4>
                <form onSubmit={guardarEvento}>
                  <div className="form-group">
                    <label>Título *</label>
                    <input
                      type="text"
                      value={nuevoEvento.titulo}
                      onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})}
                      placeholder="Nombre del evento"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Descripción</label>
                    <textarea
                      value={nuevoEvento.descripcion}
                      onChange={(e) => setNuevoEvento({...nuevoEvento, descripcion: e.target.value})}
                      placeholder="Descripción del evento..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Fecha del evento</label>
                    <input
                      type="date"
                      value={nuevoEvento.fechaEvento}
                      onChange={(e) => setNuevoEvento({...nuevoEvento, fechaEvento: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Horario del evento</label>
                    <input
                      type="text"
                      value={nuevoEvento.horarioEvento}
                      onChange={(e) => setNuevoEvento({...nuevoEvento, horarioEvento: e.target.value})}
                      placeholder="Ej: 10:00 a 14:00 hs"
                    />
                  </div>
                  <div className="form-group">
                    <label>Imagen del evento (máx. 5MB)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImagenEvento}
                    />
                    {imagenPreview && (
                      <div className="imagen-preview">
                        <img src={imagenPreview} alt="Preview" />
                        <button 
                          type="button" 
                          className="btn-quitar-imagen"
                          onClick={() => { setImagenPreview(null); setNuevoEvento(prev => ({...prev, imagenBase64: ''})); }}
                        >
                          ✕ Quitar imagen
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-guardar">
                      💾 {eventoEditando ? 'Actualizar' : 'Crear'} Evento
                    </button>
                    <button type="button" className="btn-cancelar" onClick={cerrarFormularioEvento}>
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lista de Eventos */}
            {eventos.length === 0 ? (
              <p style={{textAlign: 'center', padding: '40px', color: '#666'}}>No hay eventos creados aún</p>
            ) : (
              <div className="eventos-admin-grid">
                {eventos.map((evento) => (
                  <div key={evento.id} className={`evento-admin-card ${!evento.activo ? 'inactivo' : ''}`}>
                    {evento.imagenBase64 && (
                      <div className="evento-admin-img">
                        <img src={evento.imagenBase64} alt={evento.titulo} />
                      </div>
                    )}
                    <div className="evento-admin-info">
                      <div className="evento-admin-header">
                        <h4>{evento.titulo}</h4>
                        <span className={`badge-estado ${evento.activo ? 'activo' : 'inactivo'}`}>
                          {evento.activo ? '✅ Visible' : '🚫 Oculto'}
                        </span>
                      </div>
                      {evento.fechaEvento && (
                        <p className="evento-admin-fecha">
                          📅 {new Date(evento.fechaEvento + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      )}
                      {evento.horarioEvento && (
                        <p className="evento-admin-fecha">🕐 {evento.horarioEvento}</p>
                      )}
                      {evento.descripcion && <p className="evento-admin-desc">{evento.descripcion}</p>}
                      <div className="evento-admin-actions">
                        <button className="btn-small btn-editar" onClick={() => abrirFormularioEvento(evento)}>
                          ✏️ Editar
                        </button>
                        <button className="btn-small btn-toggle" onClick={() => toggleEvento(evento.id)}>
                          {evento.activo ? '🚫 Ocultar' : '✅ Mostrar'}
                        </button>
                        <button className="btn-small btn-eliminar" onClick={() => setModalEliminarEvento({ visible: true, evento })}>
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal confirmar eliminación */}
            {modalEliminarEvento.visible && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3>⚠️ Confirmar eliminación</h3>
                  <p>¿Estás seguro de eliminar el evento <strong>"{modalEliminarEvento.evento?.titulo}"</strong>?</p>
                  <div className="modal-actions">
                    <button className="btn-modal btn-danger" onClick={() => eliminarEvento(modalEliminarEvento.evento.id)}>
                      Sí, eliminar
                    </button>
                    <button className="btn-modal btn-volver" onClick={() => setModalEliminarEvento({ visible: false, evento: null })}>
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab de Mantenimiento */}
        {tabActiva === 'mantenimiento' && (
          <div className="mantenimiento-content">
            <div className="mantenimiento-header">
              <div className="mantenimiento-intro">
                <div className="intro-icon">⚙️</div>
                <div className="intro-text">
                  <h3>Mantenimiento del Sistema</h3>
                  <p>Gestiona la conexión con Google Calendar y la limpieza automática de datos antiguos.</p>
                </div>
              </div>
            </div>

            {/* Sección de Google Calendar */}
            <div className="google-calendar-section">
              <div className="section-header">
                <h4>📅 Google Calendar</h4>
                <p className="section-description">
                  Conecta tu cuenta de Google para sincronizar automáticamente los turnos con Google Calendar.
                </p>
              </div>

              {googleCalendarError && (
                <div className="google-calendar-error">
                  <span className="error-icon">❌</span>
                  <span>{googleCalendarError}</span>
                  <button 
                    className="btn-dismiss"
                    onClick={() => setGoogleCalendarError(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="google-calendar-status-card">
                {cargandoGoogleCalendar ? (
                  <div className="loading-status">
                    <span className="spinner">🔄</span> Verificando conexión...
                  </div>
                ) : googleCalendarStatus ? (
                  <>
                    <div className="status-header">
                      <div className={`status-indicator ${googleCalendarStatus.connected ? 'connected' : 'disconnected'}`}>
                        <span className="status-dot"></span>
                        <span className="status-text">
                          {googleCalendarStatus.connected ? 'Conectado' : 'Desconectado'}
                        </span>
                      </div>
                      {!googleCalendarStatus.enabled && (
                        <span className="status-badge disabled">Calendar deshabilitado en configuración</span>
                      )}
                    </div>

                    {googleCalendarStatus.connected && googleCalendarStatus.calendarInfo && (
                      <div className="calendar-info">
                        <div className="info-row">
                          <span className="info-label">Calendario:</span>
                          <span className="info-value">{googleCalendarStatus.calendarInfo.name || 'Calendario principal'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">ID:</span>
                          <span className="info-value info-id">{googleCalendarStatus.calendarInfo.id}</span>
                        </div>
                      </div>
                    )}

                    <div className="calendar-actions">
                      {!googleCalendarStatus.connected ? (
                        <button 
                          className="btn btn-google-connect"
                          onClick={conectarGoogleCalendar}
                          disabled={cargandoGoogleCalendar || !googleCalendarStatus.enabled}
                        >
                          <span className="google-icon">
                            <svg viewBox="0 0 24 24" width="18" height="18">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                          </span>
                          Conectar con Google Calendar
                        </button>
                      ) : (
                        <button 
                          className="btn btn-google-disconnect"
                          onClick={desconectarGoogleCalendar}
                          disabled={cargandoGoogleCalendar}
                        >
                          🔌 Desconectar Google Calendar
                        </button>
                      )}
                    </div>

                    {googleCalendarStatus.connected && (
                      <div className="calendar-features">
                        <h5>✅ Funciones activas:</h5>
                        <ul>
                          <li>Los turnos nuevos se crean automáticamente en Google Calendar</li>
                          <li>Las modificaciones de turnos se sincronizan en tiempo real</li>
                          <li>Al cancelar un turno, se elimina del calendario</li>
                          <li>Cada profesional tiene su color asignado en el calendario</li>
                        </ul>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="status-unknown">
                    <p>No se pudo obtener el estado de Google Calendar</p>
                    <button 
                      className="btn btn-google-connect"
                      onClick={conectarGoogleCalendar}
                    >
                      Conectar con Google Calendar
                    </button>
                  </div>
                )}
              </div>
            </div>

            <hr className="section-divider" />

            {/* Información de Configuración */}
            <div className="mantenimiento-card info-card">
              <h4>📋 Configuración Actual</h4>
              <div className="config-grid">
                <div className="config-item">
                  <span className="config-label">Retención de Turnos:</span>
                  <span className="config-value">{limpiezaPreview?.mesesRetencionTurnos || 3} meses</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Retención de Bloqueos:</span>
                  <span className="config-value">{limpiezaPreview?.diasRetencionBloqueos || 30} días</span>
                </div>
                <div className="config-item">
                  <span className="config-label">Limpieza Automática:</span>
                  <span className="config-value">Día 1 de cada mes a las 03:00 AM</span>
                </div>
              </div>
            </div>

            {/* Preview de Limpieza */}
            <div className="mantenimiento-card preview-card">
              <h4>🔍 Datos que serían eliminados</h4>
              {cargandoLimpieza ? (
                <div className="loading-preview">
                  <span className="spinner">🔄</span> Calculando...
                </div>
              ) : limpiezaPreview ? (
                <div className="preview-grid">
                  <div className="preview-item">
                    <span className="preview-icon">📅</span>
                    <span className="preview-count">{limpiezaPreview.turnosAEliminar}</span>
                    <span className="preview-label">Turnos anteriores a {limpiezaPreview.fechaLimiteTurnos}</span>
                  </div>
                  <div className="preview-item">
                    <span className="preview-icon">🚫</span>
                    <span className="preview-count">{limpiezaPreview.bloqueosAEliminar}</span>
                    <span className="preview-label">Bloqueos anteriores a {limpiezaPreview.fechaLimiteBloqueos}</span>
                  </div>
                </div>
              ) : (
                <p className="preview-empty">No se pudo cargar la información</p>
              )}
              <button 
                className="btn btn-secondary btn-refresh"
                onClick={cargarPreviewLimpieza}
                disabled={cargandoLimpieza}
              >
                🔄 Actualizar
              </button>
            </div>

            {/* Advertencias */}
            <div className="mantenimiento-card warning-card">
              <h4>⚠️ Advertencias Importantes</h4>
              <ul className="warning-list">
                <li>
                  <span className="warning-icon">🗑️</span>
                  <span>La limpieza <strong>elimina permanentemente</strong> los turnos y bloqueos antiguos.</span>
                </li>
                <li>
                  <span className="warning-icon">📅</span>
                  <span>También se eliminan los eventos correspondientes de <strong>Google Calendar</strong>.</span>
                </li>
                <li>
                  <span className="warning-icon">✅</span>
                  <span>Los <strong>Profesionales</strong> y <strong>Pacientes Fijos</strong> NO se eliminan.</span>
                </li>
                <li>
                  <span className="warning-icon">⏰</span>
                  <span>La limpieza automática se ejecuta el <strong>día 1 de cada mes</strong> a las 3 AM.</span>
                </li>
                <li>
                  <span className="warning-icon">💾</span>
                  <span>Considera exportar los datos importantes antes de ejecutar una limpieza manual.</span>
                </li>
              </ul>
            </div>

            {/* Botón de Limpieza Manual */}
            <div className="mantenimiento-card action-card">
              <h4>🧹 Limpieza Manual</h4>
              <p className="action-description">
                Ejecuta la limpieza inmediatamente sin esperar a la programación automática.
                Solo se eliminarán los datos que cumplan los criterios de retención configurados.
              </p>
              
              {resultadoLimpieza && (
                <div className="resultado-limpieza">
                  <h5>✅ Última limpieza ejecutada:</h5>
                  <p>
                    Se eliminaron <strong>{resultadoLimpieza.turnosEliminados}</strong> turnos 
                    y <strong>{resultadoLimpieza.bloqueosEliminados}</strong> bloqueos
                    el {new Date(resultadoLimpieza.fechaEjecucion).toLocaleString('es-AR')}
                  </p>
                </div>
              )}

              <button 
                className="btn btn-danger btn-limpieza"
                onClick={() => setModalConfirmarLimpieza(true)}
                disabled={cargandoLimpieza || (limpiezaPreview?.turnosAEliminar === 0 && limpiezaPreview?.bloqueosAEliminar === 0)}
              >
                {cargandoLimpieza ? '🔄 Ejecutando...' : '🗑️ Ejecutar Limpieza Ahora'}
              </button>
              
              {limpiezaPreview?.turnosAEliminar === 0 && limpiezaPreview?.bloqueosAEliminar === 0 && (
                <p className="no-data-message">✨ No hay datos antiguos para eliminar</p>
              )}
            </div>

            {/* Modal de Confirmación */}
            {modalConfirmarLimpieza && (
              <div className="modal-overlay" onClick={() => setModalConfirmarLimpieza(false)}>
                <div className="modal-content modal-limpieza" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header modal-header-danger">
                    <h3>⚠️ Confirmar Limpieza</h3>
                    <button className="modal-close" onClick={() => setModalConfirmarLimpieza(false)}>✕</button>
                  </div>
                  
                  <div className="modal-body">
                    <div className="modal-icon-warning">🗑️</div>
                    <p className="modal-warning-text">
                      Estás a punto de eliminar <strong>permanentemente</strong>:
                    </p>
                    <ul className="modal-delete-list">
                      <li>📅 <strong>{limpiezaPreview?.turnosAEliminar || 0}</strong> turnos antiguos</li>
                      <li>🚫 <strong>{limpiezaPreview?.bloqueosAEliminar || 0}</strong> bloqueos de horario</li>
                    </ul>
                    <p className="modal-advertencia-strong">
                      ⚠️ Esta acción NO se puede deshacer
                    </p>
                  </div>

                  <div className="modal-footer">
                    <button 
                      className="btn-modal btn-cancelar-modal"
                      onClick={ejecutarLimpieza}
                    >
                      Sí, eliminar datos
                    </button>
                    <button 
                      className="btn-modal btn-volver"
                      onClick={() => setModalConfirmarLimpieza(false)}
                    >
                      No, cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal para bloquear día completo */}
        {modalDiaCompleto.visible && (
          <div className="modal-overlay" onClick={cerrarModalDiaCompleto}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📅 Bloquear Día Completo</h3>
                <button className="modal-close" onClick={cerrarModalDiaCompleto}>✕</button>
              </div>
              
              <div className="modal-body">
                <form onSubmit={handleSubmitDiaCompleto} id="form-dia-completo">
                  <div className="form-group">
                    <label htmlFor="fecha-dia-completo">Fecha a bloquear:</label>
                    <input
                      type="date"
                      id="fecha-dia-completo"
                      value={modalDiaCompleto.fecha}
                      onChange={(e) => setModalDiaCompleto({...modalDiaCompleto, fecha: e.target.value})}
                      required
                      className="form-input"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="motivo-dia-completo">Motivo:</label>
                    <select
                      id="motivo-dia-completo"
                      value={modalDiaCompleto.motivo}
                      onChange={(e) => setModalDiaCompleto({...modalDiaCompleto, motivo: e.target.value})}
                      className="form-input"
                    >
                      <option value="VACACIONES">🏖️ Vacaciones</option>
                      <option value="OCUPADO">⛔ Ocupado</option>
                      <option value="OTRO">🚫 Otro</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="descripcion-dia-completo">Descripción (opcional):</label>
                    <textarea
                      id="descripcion-dia-completo"
                      value={modalDiaCompleto.descripcion}
                      onChange={(e) => setModalDiaCompleto({...modalDiaCompleto, descripcion: e.target.value})}
                      placeholder="Ej: Viaje personal, capacitación, evento familiar..."
                      className="form-textarea"
                      rows="3"
                    />
                  </div>

                  <p className="modal-info-text">
                    ℹ️ Se bloqueará el horario de <strong>08:00 a 19:00</strong> para el día seleccionado.
                  </p>
                </form>
              </div>

              <div className="modal-footer">
                <button 
                  type="submit"
                  form="form-dia-completo"
                  className="btn-modal btn-success-modal"
                >
                  💾 Bloquear Día Completo
                </button>
                <button 
                  type="button"
                  className="btn-modal btn-volver" 
                  onClick={cerrarModalDiaCompleto}
                >
                  Cancelar
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
