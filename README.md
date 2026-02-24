# Sistema de Turnos - Consultorio Integral Psique

Sistema web completo para gestión de turnos del Consultorio Integral Psique de Monte Grande.

## 🏥 Características

- **Agendamiento online de turnos** con selección de profesional, fecha y horario
- **Visualización de horarios disponibles** en tiempo real (8:00 a 19:00)
- **Panel de administración** para ver y gestionar todos los turnos
- **Confirmación visual** del turno con todos los detalles
- **Filtros avanzados** por profesional y fecha
- **4 Profesionales** del consultorio:
  - Lic. Jimena A. Cofman - Psicóloga Clínica Infanto-Juvenil
  - Lic. Carolina Orcellet - Psicóloga Clínica Infanto-Juvenil
  - Lic. Julieta Porto - Psicopedagoga Niños y Adolescentes
  - Lic. Erica Baade - Psicóloga Clínica Adultos
- **Diseño profesional** con paleta de colores del consultorio (lilas, azules, rosas)
- **Información completa** sobre servicios y profesionales
- **Validaciones** de formulario y seguridad de datos
- **Responsive** para uso en móviles y tablets

## 🎨 Servicios del Consultorio

- 🧠 **Psicología Clínica**: Atención para niños, adolescentes y adultos
- 📚 **Psicopedagogía**: Evaluación y tratamiento de dificultades de aprendizaje
- 🗣️ **Fonoaudiología**: Talleres de habilidades sociales y comunicativas

## 🚀 Tecnologías

### Frontend
- React 18
- React Router para navegación
- Axios para peticiones HTTP
- Vite como bundler
- CSS personalizado con paleta del consultorio

### Backend
- Node.js
- Express
- Sistema de almacenamiento en JSON
- API RESTful

## 📦 Instalación

### Opción 1: Instalación completa (Recomendada)

Desde la raíz del proyecto:

```bash
npm run install:all
```

### Opción 2: Instalación manual

```bash
# Instalar dependencias raíz
npm install

# Instalar dependencias del frontend
cd frontend
npm install

# Instalar dependencias del backend
cd ../backend
npm install
```

## ▶️ Ejecución

### Ejecutar todo el sistema

Desde la raíz del proyecto:

```bash
npm run dev
```

Esto iniciará:
- Backend en http://localhost:3000
- Frontend en http://localhost:5173

### Ejecutar servicios por separado

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## 📁 Estructura del Proyecto

```
aplicacion-turnos/
├── frontend/                 # Aplicación React
│   ├── src/
│   │   ├── pages/           # Páginas de la aplicación
│   │   │   ├── Home.jsx     # Página principal
│   │   │   ├── AgendarTurno.jsx    # Sistema de agendamiento
│   │   │   └── VerTurnos.jsx       # Panel de turnos
│   │   ├── App.jsx          # Componente principal
│   │   ├── App.css          # Estilos del app
│   │   ├── index.css        # Estilos globales
│   │   └── main.jsx         # Punto de entrada
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # API del servidor
│   ├── server.js            # Servidor Express
│   ├── turnos.json          # Base de datos de turnos
│   └── package.json
│
├── package.json             # Configuración raíz
└── README.md
```

## 🎨 Paleta de Colores

El sistema utiliza la paleta de colores del Consultorio Integral Psique:

- **Primary:** #9BA8C9 (Lila/Azul)
- **Primary Light:** #B5C1D9
- **Primary Lighter:** #D4DBE8
- **Secondary:** #E8B4A8 (Rosa claro)
- **Accent:** #F4A261 (Naranja/Durazno)
- **Background:** #F8F9FB

## 📋 API Endpoints

### Profesionales
- `GET /api/profesionales` - Obtener todos los profesionales
- `GET /api/profesionales/:id` - Obtener un profesional específico

### Turnos
- `GET /api/turnos` - Obtener todos los turnos
- `GET /api/turnos/:profesionalId/:fecha` - Obtener turnos de un profesional en una fecha
- `GET /api/horarios-disponibles/:profesionalId/:fecha` - Obtener horarios disponibles
- `POST /api/turnos` - Crear un nuevo turno
- `DELETE /api/turnos/:id` - Cancelar un turno
- `PATCH /api/turnos/:id` - Actualizar estado de un turno

## 💾 Datos

Los turnos se almacenan en `backend/turnos.json`. El archivo se crea automáticamente al iniciar el servidor.

Estructura de un turno:
```json
{
  "id": 1234567890,
  "profesionalId": 1,
  "fecha": "2026-02-25",
  "hora": "14:00",
  "paciente": {
    "nombre": "Juan Pérez",
    "telefono": "11 1234-5678",
    "email": "juan@ejemplo.com",
    "motivo": "Consulta inicial"
  },
  "estado": "confirmado",
  "fechaCreacion": "2026-02-24T10:30:00.000Z"
}
```

## 🌐 Uso del Sistema

### Para pacientes:
1. Acceder a la página principal
2. Ir a "Agendar Turno"
3. Seleccionar el profesional deseado
4. **Usar el calendario visual** para ver disponibilidad:
   - Los días disponibles aparecen habilitados
   - Los horarios se muestran como "✓ Libre" (verde) u "✕ Ocupado" (rojo)
   - Hacer clic en un día para ver los horarios disponibles
   - Seleccionar el horario deseado
5. Completar datos personales
6. Confirmar el turno

### Para administración:
1. Ir a "Admin" en el menú
2. Iniciar sesión con las credenciales:
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`
3. Acceder al panel de turnos
4. Filtrar por fecha o profesional
5. Ver estadísticas de turnos
6. Cancelar turnos si es necesario
7. Cerrar sesión cuando termine

### 🔐 Seguridad
- El panel de administración está protegido con autenticación
- Solo usuarios autenticados pueden ver y gestionar turnos
- Los clientes solo pueden agendar turnos, no verlos todos

## 📍 Información del Consultorio

**Consultorio Integral Psique**
- Ubicación: Rotta 219, Monte Grande, Buenos Aires 1842
- Atención: Psicología, Psicopedagogía y Fonoaudiología
- Talleres de habilidades sociales y comunicativas

## 🔧 Configuración

### Puerto del Backend
Por defecto: 3000. Modificar en `backend/server.js`

### Puerto del Frontend
Por defecto: 5173. Modificar en `frontend/vite.config.js`

### Horarios de los Profesionales
Modificar en `backend/server.js` en el array `profesionales`

## 📱 Responsive Design

La aplicación está optimizada para:
- 💻 Desktop (1200px+)
- 📱 Tablets (768px - 1199px)
- 📱 Móviles (< 768px)

## 🤝 Soporte

Para consultas sobre el sistema, contactar al Consultorio Integral Psique.

---

© 2026 Consultorio Integral Psique - Todos los derechos reservados
