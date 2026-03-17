import { useState, useEffect } from 'react';
import axios from 'axios';
import './CalendarioDisponibilidad.css';

function CalendarioDisponibilidad({ profesionalId, onSeleccionFecha, onSeleccionHora }) {
  const [mesActual, setMesActual] = useState(new Date());
  const [diasMes, setDiasMes] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horariosDelDia, setHorariosDelDia] = useState({ disponibles: [], ocupados: [], bloqueado: false });
  const [cargando, setCargando] = useState(false);
  const [profesional, setProfesional] = useState(null);
  const [diasNoLaborables, setDiasNoLaborables] = useState({ diasSemana: [], fechasEspecificas: [] });

  useEffect(() => {
    generarDiasMes();
  }, [mesActual]);

  useEffect(() => {
    if (profesionalId) {
      cargarProfesional();
      cargarDiasNoLaborables();
    }
  }, [profesionalId]);

  useEffect(() => {
    if (fechaSeleccionada && profesionalId) {
      cargarHorariosDelDia();
    }
  }, [fechaSeleccionada, profesionalId]);

  const cargarDiasNoLaborables = async () => {
    try {
      const response = await axios.get('/api/dias-no-laborables');
      setDiasNoLaborables(response.data);
    } catch (error) {
      console.error('Error al cargar días no laborables:', error);
    }
  };

  const cargarProfesional = async () => {
    try {
      const response = await axios.get(`/api/profesionales/${profesionalId}`);
      setProfesional(response.data);
    } catch (error) {
      console.error('Error al cargar profesional:', error);
    }
  };

  const generarDiasMes = () => {
    const año = mesActual.getFullYear();
    const mes = mesActual.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    
    const dias = [];
    const primerDiaSemana = primerDia.getDay();
    
    // Días vacíos antes del primer día
    for (let i = 0; i < primerDiaSemana; i++) {
      dias.push(null);
    }
    
    // Días del mes
    for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
      dias.push(new Date(año, mes, dia));
    }
    
    setDiasMes(dias);
  };

  const cargarHorariosDelDia = async () => {
    if (!fechaSeleccionada || !profesionalId) return;
    
    setCargando(true);
    try {
      const fechaString = fechaSeleccionada.toISOString().split('T')[0];
      const response = await axios.get(
        `/api/horarios-disponibles/${profesionalId}/${fechaString}`
      );
      setHorariosDelDia({
        disponibles: response.data.disponibles || [],
        ocupados: response.data.ocupados || [],
        bloqueado: response.data.bloqueado || false,
        motivo: response.data.motivo || ''
      });
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const getDiaSemanaString = (fecha) => {
    const dias = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return dias[fecha.getDay()];
  };

  // Mapeo de día de la semana en inglés a español (como se guardan los horarios del profesional)
  const diaInglesAEspanol = {
    'SUNDAY': 'DOMINGO',
    'MONDAY': 'LUNES',
    'TUESDAY': 'MARTES',
    'WEDNESDAY': 'MIÉRCOLES',
    'THURSDAY': 'JUEVES',
    'FRIDAY': 'VIERNES',
    'SATURDAY': 'SÁBADO'
  };

  const esDiaQueTrabajaElProfesional = (fecha) => {
    if (!fecha || !profesional) return true; // Si no hay datos, no bloquear
    if (!profesional.horarios || profesional.horarios.length === 0) return true; // Sin horarios definidos = trabaja todos los días
    
    const diaIngles = getDiaSemanaString(fecha);
    const diaEspanol = diaInglesAEspanol[diaIngles];
    
    // Domingos nunca trabaja
    if (diaIngles === 'SUNDAY') return false;
    
    // Verificar si existe un horario para este día
    return profesional.horarios.some(h => h.startsWith(diaEspanol + ':'));
  };

  const esDiaBloqueado = (fecha) => {
    if (!fecha) return false;
    
    // Verificar si el día de la semana está bloqueado
    const diaSemana = getDiaSemanaString(fecha);
    if (diasNoLaborables.diasSemana?.includes(diaSemana)) {
      return true;
    }
    
    // Verificar si la fecha específica está bloqueada
    const fechaString = fecha.toISOString().split('T')[0];
    if (diasNoLaborables.fechasEspecificas?.some(item => {
      const fechaBloqueada = typeof item === 'string' ? item : item.fecha;
      return fechaBloqueada === fechaString;
    })) {
      return true;
    }
    
    return false;
  };

  const esDiaDisponible = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const tresMesesDespues = new Date();
    tresMesesDespues.setMonth(tresMesesDespues.getMonth() + 3);
    
    // Un día está disponible si:
    // 1. Está dentro del rango de fechas
    // 2. NO está bloqueado (días no laborables)
    // 3. El profesional trabaja ese día (según sus horarios configurados)
    return fecha >= hoy && fecha <= tresMesesDespues && !esDiaBloqueado(fecha) && esDiaQueTrabajaElProfesional(fecha);
  };

  const handleSeleccionDia = (fecha) => {
    if (esDiaDisponible(fecha)) {
      setFechaSeleccionada(fecha);
      const fechaString = fecha.toISOString().split('T')[0];
      onSeleccionFecha(fechaString);
      
      // Hacer scroll hacia los horarios después de un breve delay
      setTimeout(() => {
        const horariosSeccion = document.querySelector('.horarios-seccion');
        if (horariosSeccion) {
          horariosSeccion.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start'
          });
        }
      }, 300);
    }
  };

  const handleSeleccionHora = (hora) => {
    onSeleccionHora(hora);
  };

  const cambiarMes = (direccion) => {
    const nuevoMes = new Date(mesActual);
    nuevoMes.setMonth(mesActual.getMonth() + direccion);
    setMesActual(nuevoMes);
  };

  const nombreMes = mesActual.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="calendario-disponibilidad">
      <div className="calendario-header">
        <button 
          onClick={() => cambiarMes(-1)} 
          className="btn-mes"
          type="button"
        >
          ←
        </button>
        <h3 className="mes-titulo">{nombreMes}</h3>
        <button 
          onClick={() => cambiarMes(1)} 
          className="btn-mes"
          type="button"
        >
          →
        </button>
      </div>

      <div className="calendario-grid">
        {diasSemana.map(dia => (
          <div key={dia} className="dia-semana-nombre">{dia}</div>
        ))}
        
        {diasMes.map((fecha, index) => {
          if (!fecha) {
            return <div key={`vacio-${index}`} className="dia-vacio"></div>;
          }
          
          const esHoy = fecha.toDateString() === new Date().toDateString();
          const esSeleccionado = fechaSeleccionada && fecha.toDateString() === fechaSeleccionada.toDateString();
          const esBloqueado = esDiaBloqueado(fecha);
          const noTrabaja = !esDiaQueTrabajaElProfesional(fecha);
          const esDisponible = esDiaDisponible(fecha);
          
          return (
            <button
              key={index}
              type="button"
              className={`dia-celda ${esHoy ? 'hoy' : ''} ${esSeleccionado ? 'seleccionado' : ''} ${esBloqueado ? 'bloqueado' : ''} ${noTrabaja ? 'no-trabaja' : ''} ${!esDisponible ? 'deshabilitado' : ''}`}
              onClick={() => handleSeleccionDia(fecha)}
              disabled={!esDisponible}
              title={noTrabaja ? 'El profesional no atiende este día' : esBloqueado ? 'Día no laborable' : ''}
            >
              {fecha.getDate()}
            </button>
          );
        })}
      </div>

      {fechaSeleccionada && (
        <div className="horarios-seccion">
          <h4 className="horarios-titulo">
            Horarios para {fechaSeleccionada.toLocaleDateString('es-AR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </h4>
          
          {cargando ? (
            <div className="cargando">Cargando horarios...</div>
          ) : horariosDelDia.bloqueado ? (
            <div className="dia-bloqueado-mensaje">
              <div className="bloqueado-icono">🚫</div>
              <h4>Consultorio cerrado</h4>
              <p>{horariosDelDia.motivo || 'El consultorio no atiende este día'}</p>
            </div>
          ) : (
            <>
              {(horariosDelDia.disponibles.length > 0 || horariosDelDia.ocupados.length > 0) ? (
                <>
                  <div className="leyenda-horarios">
                    <span className="leyenda-item">
                      <span className="dot disponible"></span> Disponible
                    </span>
                    <span className="leyenda-item">
                      <span className="dot ocupado"></span> Ocupado
                    </span>
                  </div>
                  
                  <div className="horarios-grid-visual">
                    {[...new Set([...horariosDelDia.disponibles, ...horariosDelDia.ocupados])]
                      .sort()
                      .map(hora => {
                        const estaOcupado = horariosDelDia.ocupados.includes(hora);
                        const estaDisponible = horariosDelDia.disponibles.includes(hora);
                        
                        return (
                          <button
                            key={hora}
                            type="button"
                            className={`horario-visual-btn ${estaOcupado ? 'ocupado' : 'disponible'}`}
                            onClick={() => estaDisponible && handleSeleccionHora(hora)}
                            disabled={estaOcupado}
                          >
                            <span className="hora-tiempo">{hora}</span>
                            <span className="hora-estado">
                              {estaOcupado ? '✕ Ocupado' : '✓ Libre'}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </>
              ) : (
                <p className="sin-horarios">No hay horarios disponibles para este día</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarioDisponibilidad;
