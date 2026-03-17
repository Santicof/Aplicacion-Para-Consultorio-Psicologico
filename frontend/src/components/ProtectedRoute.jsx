import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children }) {
  const [estado, setEstado] = useState('verificando'); // verificando | autorizado | no-autorizado

  useEffect(() => {
    // Verificar sesión con el servidor
    fetch('/api/auth/check', { credentials: 'same-origin' })
      .then(res => {
        if (res.ok) {
          setEstado('autorizado');
          localStorage.setItem('isAdmin', 'true');
        } else {
          localStorage.removeItem('isAdmin');
          localStorage.removeItem('adminUser');
          setEstado('no-autorizado');
        }
      })
      .catch(() => {
        // Si no hay conexión, usar localStorage como fallback
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        setEstado(isAdmin ? 'autorizado' : 'no-autorizado');
      });
  }, []);

  if (estado === 'verificando') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#666' }}>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (estado === 'no-autorizado') {
    return <Navigate to="/gestion-consultorio-interno" replace />;
  }
  
  return children;
}

export default ProtectedRoute;
