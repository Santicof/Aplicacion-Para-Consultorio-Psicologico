# ===================================
# Dockerfile Monolítico
# Compila Frontend + Backend en un solo contenedor
# ===================================

# Etapa 1: Compilar Frontend
FROM node:18-alpine AS frontend-build
WORKDIR /frontend
COPY ../frontend/package*.json ./
RUN npm install
COPY ../frontend/ ./
RUN npm run build

# Etapa 2: Compilar Backend con Maven
FROM maven:3.9-eclipse-temurin-17 AS backend-build
WORKDIR /app

# Copiar frontend compilado
COPY --from=frontend-build /frontend/dist /app/frontend/dist

# Copiar y compilar backend
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 3: Imagen final
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiar el JAR que ya incluye el frontend
COPY --from=backend-build /app/target/*.jar app.jar

# Exponer puerto
EXPOSE 3000

# Variables de entorno opcionales
ENV JAVA_OPTS=""

# Ejecutar aplicación
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]

