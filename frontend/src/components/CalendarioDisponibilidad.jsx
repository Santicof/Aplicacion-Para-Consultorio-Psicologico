import { useState, useEffect } from 'react';
import axios from 'axios';
import './CalendarioDisponibilidad.css';

function CalendarioDisponibilidad({ profesionalId, onSeleccionFecha, onSeleccionHora }) {
  const [mesActual, setMesActual] = useState(new Date());
  const [diasMes, setDiasMes] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horariosDelDia, setHorariosDelDia] = useState({ disponibles: [], ocupados: [] });
  const [cargando, setCargando] = useState(false);
  const [profesional, setProfesional] = useState(null);

  useEffect(() => {
    generarDiasMes();
  }, [mesActual]);

  useEffect(() => {
    if (profesionalId) {
      cargarProfesional();
    }
  }, [profesionalId]);

  useEffect(() => {
    if (fechaSeleccionada && profesionalId) {
      cargarHorariosDelDia();
    }
  }, [fechaSeleccionada, profesionalId]);

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
        disponibles: response.data.disponibles,
        ocupados: response.data.ocupados
      });
    } catch (error) {
      console.error('Error al cargar horarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const esDiaDisponible = (fecha) => {
    if (!fecha) return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const tresMesesDespues = new Date();
    tresMesesDespues.setMonth(tresMesesDespues.getMonth() + 3);
    
    return fecha >= hoy && fecha <= tresMesesDespues;
  };

  const handleSeleccionDia = (fecha) => {
    if (esDiaDisponible(fecha)) {
      setFechaSeleccionada(fecha);
      const fechaString = fecha.toISOString().split('T')[0];
      onSeleccionFecha(fechaString);
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
          const esDisponible = esDiaDisponible(fecha);
          
          return (
            <button
              key={index}
              type="button"
              className={`dia-celda ${esHoy ? 'hoy' : ''} ${esSeleccionado ? 'seleccionado' : ''} ${!esDisponible ? 'deshabilitado' : ''}`}
              onClick={() => handleSeleccionDia(fecha)}
              disabled={!esDisponible}
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
          ) : (
            <>
              {horariosDelDia.disponibles.length > 0 ? (
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
                    {profesional && profesional.horarios.map(hora => {
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
