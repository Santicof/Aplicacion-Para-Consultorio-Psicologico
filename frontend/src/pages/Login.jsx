import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Usuario admin hardcoded (en producción debería ser con backend)
    if (credenciales.usuario === 'admin' && credenciales.password === 'admin123') {
      localStorage.setItem('isAdmin', 'true');
      navigate('/turnos');
    } else {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="login-container">
          <div className="login-card card">
            <div className="login-header">
              <div className="login-icon">🔐</div>
              <h2>Acceso Administrador</h2>
              <p>Panel de Gestión de Turnos</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Usuario</label>
                <input
                  type="text"
                  value={credenciales.usuario}
                  onChange={(e) => setCredenciales({...credenciales, usuario: e.target.value})}
                  placeholder="Ingrese usuario"
                  required
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={credenciales.password}
                  onChange={(e) => setCredenciales({...credenciales, password: e.target.value})}
                  placeholder="Ingrese contraseña"
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-large">
                Iniciar Sesión
              </button>

              <div className="login-info">
                <p><small>Para clientes: Use el botón "Agendar Turno" en el menú principal</small></p>
                <div className="credenciales-demo">
                  <p><strong>Credenciales de prueba:</strong></p>
                  <p>Usuario: admin | Contraseña: admin123</p>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
