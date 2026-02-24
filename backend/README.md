# Consultorio Integral Psique - Backend Spring Boot

## Tecnologías

- Java 17
- Spring Boot 3.2.2
- PostgreSQL 16
- Maven 3.9
- Docker

## Estructura del Proyecto

```
backend/
├── src/
│   ├── main/
│   │   ├── java/com/psique/turnos/
│   │   │   ├── controller/     # Controladores REST
│   │   │   ├── service/        # Lógica de negocio
│   │   │   ├── repository/     # Acceso a datos JPA
│   │   │   ├── model/          # Entidades JPA
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   └── config/         # Configuración
│   │   └── resources/
│   │       └── application.yml # Configuración de Spring
│   └── test/                   # Tests
├── Dockerfile
└── pom.xml
```

## Ejecución Local

### Opción 1: Con PostgreSQL instalado localmente

1. Instalar PostgreSQL y crear base de datos:
```bash
createdb psique_turnos
```

2. Ejecutar el backend:
```bash
cd backend
mvn spring-boot:run
```

### Opción 2: Con Docker Compose (recomendado)

```bash
docker-compose up --build
```

El backend estará disponible en: http://localhost:3000

## API Endpoints

### Profesionales
- `GET /api/profesionales` - Listar todos
- `GET /api/profesionales/{id}` - Obtener uno

### Turnos
- `GET /api/turnos` - Listar todos
- `GET /api/turnos/{profesionalId}/{fecha}` - Turnos por profesional y fecha
- `POST /api/turnos` - Crear turno
- `DELETE /api/turnos/{id}` - Cancelar turno

### Disponibilidad
- `GET /api/horarios-disponibles/{profesionalId}/{fecha}` - Horarios disponibles

## Despliegue en Servidor

### Railway / Render / Heroku

1. Subir a GitHub
2. Conectar repositorio en Railway/Render
3. Configurar variables de entorno:
   - `SPRING_DATASOURCE_URL`
   - `SPRING_DATASOURCE_USERNAME`
   - `SPRING_DATASOURCE_PASSWORD`

### VPS con Docker

```bash
git clone <repo>
cd aplicacion-turnos
docker-compose up -d
```

## Seguridad

- Spring Security configurado
- Validación de datos con Bean Validation
- CORS configurado para el frontend
- Transacciones gestionadas con @Transactional
