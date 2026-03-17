# ===================================
# Dockerfile Monolítico
# Compila Frontend + Backend en un solo contenedor
# Build context debe ser la raíz del proyecto (.)
# ===================================

# Etapa 1: Compilar Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Etapa 2: Compilar Backend con Maven
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app

# Copiar pom.xml primero para cachear dependencias
COPY backend/pom.xml .
# Descargar dependencias (saltear frontend plugin)
RUN mvn dependency:go-offline -Dskip.frontend=true

# Copiar código fuente del backend
COPY backend/src ./src

# Copiar frontend compilado a recursos estáticos del backend
COPY --from=frontend-build /frontend/dist ./src/main/resources/static/

# Compilar backend (saltear plugin de frontend ya que lo compilamos arriba)
RUN mvn clean package -DskipTests -Dskip.frontend=true

# Etapa 3: Imagen final liviana
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiar el JAR que ya incluye el frontend
COPY --from=backend-build /app/target/*.jar app.jar

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV JAVA_OPTS="-Xmx256m -Xms128m"
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -q --spider http://localhost:3000/ || exit 1

# Ejecutar aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=$PORT -jar app.jar"]

