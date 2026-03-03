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
    colorCalendario: '9'
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

  useEffect(() => {
    cargarDatos();
    
    // Auto-refresh cada 5 segundos para ver cambios de Google Calendar
    // (Los cambios se detectan instantáneamente via webhooks en el backend)
    const intervalo = setInterval(() => {
      cargarDatos(true); // true = carga silenciosa
    }, 5000); // 5 segundos

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
        colorCalendario: profesional.colorCalendario || '9'
      });
    } else {
      setProfesionalEditando(null);
      setNuevoProfesional({
        nombre: '',
        titulo: '',
        especialidad: '',
        descripcion: '',
        colorCalendario: '9'
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
      colorCalendario: '9'
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

  return (
    <div className="ver-turnos-page">
      <div className="container">
        <div className="page-header">
          <h2 className="page-title">Panel de Administración</h2>
          <div className="header-actions">
            <button 
              onClick={sincronizarGoogleCalendar} 
              className="btn btn-sync"
              disabled={sincronizando}
              title="Sincronizar con Google Calendar"
            >
              {sincronizando ? '🔄 Sincronizando...' : '📅 Sincronizar Calendar'}
            </button>
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
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`mensaje mensaje-${mensaje.tipo}`}>
            {mensaje.texto}
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
            {mensaje.texto && (
              <div 
                className="mensaje-overlay-backdrop"
                onClick={() => setMensaje({ tipo: '', texto: '' })}
              >
                <div className={`mensaje-overlay mensaje-overlay-${mensaje.tipo}`}>
                  <div className="mensaje-icono">
                    {mensaje.tipo === 'success' ? '✅' : '❌'}
                  </div>
                  <div className="mensaje-texto">{mensaje.texto}</div>
                  <div className="mensaje-hint">Haz clic para cerrar</div>
                </div>
              </div>
            )}


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
