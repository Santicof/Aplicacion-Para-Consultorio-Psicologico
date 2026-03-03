# Estructura de Assets

Esta carpeta contiene todos los recursos estáticos del proyecto organizados por tipo y sección.

## 📁 Estructura:

```
assets/
├── images/
│   ├── logo/              # Logo del consultorio
│   │   └── logo.jpeg      # Logo principal (favicon + hero)
│   └── consultorio/       # Fotos del espacio físico
│       ├── consul.jpeg
│       ├── consul1.jpeg
│       └── consul2.jpeg
```

## 🎨 Convenciones de nombre:

- **Logo**: `logo.jpeg` (JPEG o PNG)
- **Fotos consultorio**: `consul.jpeg`, `consul1.jpeg`, etc.
- Usar nombres descriptivos y en minúsculas
- Separar palabras con guiones: `foto-sala-espera.jpeg`

## 📦 Importación en componentes:

```jsx
// Logo
import logo from '../assets/images/logo/logo.jpeg';

// Imágenes del consultorio
import consul from '../assets/images/consultorio/consul.jpeg';
```

## ✅ Buenas prácticas:

1. **Optimizar imágenes** antes de subirlas
2. **Usar WebP** cuando sea posible para mejor rendimiento
3. **Mantener tamaños razonables**: Máximo 500KB por imagen
4. **Nombrar archivos de forma descriptiva**
5. **Organizar por secciones** cuando agregar nuevos recursos
