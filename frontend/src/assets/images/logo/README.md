# Logo

📍 **Archivos necesarios:**

1. **logo.jpeg** - Logo principal (✅ Ya existe)
2. **favicon.ico** - Favicon optimizado (⚠️ Pendiente)

## Ruta completa:
```
frontend/src/assets/images/logo/logo.jpeg   ✅
frontend/src/assets/images/logo/favicon.ico ⚠️ Crear
```

## 🎨 Crear favicon.ico:

### Opción 1: Online (Recomendado)
1. Ve a: https://favicon.io/favicon-converter/
2. Sube `logo.jpeg`
3. Descarga el archivo `favicon.ico` generado
4. Colócalo en esta carpeta

### Opción 2: Con PowerShell (Requiere ImageMagick)
```powershell
# Instalar ImageMagick si no lo tienes
# magick logo.jpeg -define icon:auto-resize=256,128,96,64,48,32,16 favicon.ico
```

### Opción 3: Temporal (Mientras tanto)
El sistema usará `logo.jpeg` como fallback hasta que tengas el `favicon.ico`

## Formato recomendado:
- **logo.jpeg**: 
  - Dimensiones: 400x400px o mayor (cuadrado)
  - Peso: Máximo 200KB
  
- **favicon.ico**:
  - Múltiples tamaños: 16x16, 32x32, 48x48
  - Formato: ICO multi-resolución

## Uso:
- ✅ **Favicon** del navegador (pestaña) - favicon.ico
- ✅ **Hero section** de la página - logo.jpeg
- ✅ **Apple Touch Icon** (iOS) - logo.jpeg
- ✅ **Android PWA** - logo.jpeg
