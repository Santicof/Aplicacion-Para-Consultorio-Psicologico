#!/bin/bash
# Script de build para aplicación monolítica

echo "🚀 Iniciando build de aplicación monolítica..."

# 1. Compilar frontend
echo "📦 Compilando frontend..."
cd frontend
npm install
npm run build
cd ..

# 2. Compilar backend (Maven copiará el frontend automáticamente)
echo "🔨 Compilando backend con Maven..."
cd backend
mvn clean package -DskipTests
cd ..

echo "✅ Build completado!"
echo "📁 JAR generado en: backend/target/*.jar"
echo ""
echo "Para ejecutar:"
echo "  java -jar backend/target/*.jar"
echo ""
echo "O con Docker:"
echo "  docker-compose up --build"
