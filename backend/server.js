import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Datos de los profesionales del Consultorio Integral Psique
const profesionales = [
  {
    id: 1,
    nombre: "Lic. Jimena A. Cofman",
    especialidad: "Psicóloga Clínica Infanto-Juvenil",
    descripcion: "Atención especializada en niños y adolescentes",
    horarios: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
  },
  {
    id: 2,
    nombre: "Lic. Carolina Orcellet",
    especialidad: "Psicóloga Clínica Infanto-Juvenil",
    descripcion: "Atención especializada en niños y adolescentes",
    horarios: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
  },
  {
    id: 3,
    nombre: "Lic. Julieta Porto",
    especialidad: "Psicopedagoga Niños y Adolescentes",
    descripcion: "Evaluación y tratamiento psicopedagógico",
    horarios: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00"]
  },
  {
    id: 4,
    nombre: "Lic. Erica Baade",
    especialidad: "Psicóloga Clínica Adultos",
    descripcion: "Atención psicológica para adultos",
    horarios: ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]
  }
];

// Archivo para almacenar turnos
const turnosFile = join(__dirname, 'turnos.json');

// Inicializar archivo de turnos si no existe
if (!fs.existsSync(turnosFile)) {
  fs.writeFileSync(turnosFile, JSON.stringify([], null, 2));
}

// Función para leer turnos
const leerTurnos = () => {
  const data = fs.readFileSync(turnosFile, 'utf-8');
  return JSON.parse(data);
};

// Función para guardar turnos
const guardarTurnos = (turnos) => {
  fs.writeFileSync(turnosFile, JSON.stringify(turnos, null, 2));
};

// RUTAS DE LA API

// Obtener todos los profesionales
app.get('/api/profesionales', (req, res) => {
  res.json(profesionales);
});

// Obtener profesional específico
app.get('/api/profesionales/:id', (req, res) => {
  const profesional = profesionales.find(p => p.id === parseInt(req.params.id));
  if (profesional) {
    res.json(profesional);
  } else {
    res.status(404).json({ error: 'Profesional no encontrado' });
  }
});

// Obtener todos los turnos
app.get('/api/turnos', (req, res) => {
  const turnos = leerTurnos();
  res.json(turnos);
});

// Obtener turnos de un profesional en una fecha
app.get('/api/turnos/:profesionalId/:fecha', (req, res) => {
  const { profesionalId, fecha } = req.params;
  const turnos = leerTurnos();
  const turnosFiltrados = turnos.filter(
    t => t.profesionalId === parseInt(profesionalId) && t.fecha === fecha
  );
  res.json(turnosFiltrados);
});

// Obtener horarios disponibles
app.get('/api/horarios-disponibles/:profesionalId/:fecha', (req, res) => {
  const { profesionalId, fecha } = req.params;
  const profesional = profesionales.find(p => p.id === parseInt(profesionalId));
  
  if (!profesional) {
    return res.status(404).json({ error: 'Profesional no encontrado' });
  }

  const turnos = leerTurnos();
  const turnosOcupados = turnos
    .filter(t => t.profesionalId === parseInt(profesionalId) && t.fecha === fecha)
    .map(t => t.hora);

  const horariosDisponibles = profesional.horarios.filter(
    h => !turnosOcupados.includes(h)
  );

  res.json({
    disponibles: horariosDisponibles,
    ocupados: turnosOcupados
  });
});

// Crear nuevo turno
app.post('/api/turnos', (req, res) => {
  const { profesionalId, fecha, hora, paciente } = req.body;

  // Validaciones
  if (!profesionalId || !fecha || !hora || !paciente || !paciente.nombre || !paciente.telefono) {
    return res.status(400).json({ error: 'Faltan datos requeridos' });
  }

  const turnos = leerTurnos();

  // Verificar si el horario está disponible
  const turnoExistente = turnos.find(
    t => t.profesionalId === profesionalId && t.fecha === fecha && t.hora === hora
  );

  if (turnoExistente) {
    return res.status(409).json({ error: 'El horario ya está ocupado' });
  }

  // Crear nuevo turno
  const nuevoTurno = {
    id: Date.now(),
    profesionalId,
    fecha,
    hora,
    paciente: {
      nombre: paciente.nombre,
      telefono: paciente.telefono,
      email: paciente.email || '',
      motivo: paciente.motivo || ''
    },
    estado: 'confirmado',
    fechaCreacion: new Date().toISOString()
  };

  turnos.push(nuevoTurno);
  guardarTurnos(turnos);

  res.status(201).json(nuevoTurno);
});

// Cancelar turno
app.delete('/api/turnos/:id', (req, res) => {
  const turnoId = parseInt(req.params.id);
  let turnos = leerTurnos();
  
  const turnoIndex = turnos.findIndex(t => t.id === turnoId);
  
  if (turnoIndex === -1) {
    return res.status(404).json({ error: 'Turno no encontrado' });
  }

  turnos.splice(turnoIndex, 1);
  guardarTurnos(turnos);

  res.json({ mensaje: 'Turno cancelado exitosamente' });
});

// Actualizar estado del turno
app.patch('/api/turnos/:id', (req, res) => {
  const turnoId = parseInt(req.params.id);
  const { estado } = req.body;
  
  let turnos = leerTurnos();
  const turno = turnos.find(t => t.id === turnoId);
  
  if (!turno) {
    return res.status(404).json({ error: 'Turno no encontrado' });
  }

  turno.estado = estado;
  guardarTurnos(turnos);

  res.json(turno);
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🏥 Servidor del Consultorio Integral Psique ejecutándose en http://localhost:${PORT}`);
  console.log(`📅 API de turnos disponible en http://localhost:${PORT}/api`);
});
