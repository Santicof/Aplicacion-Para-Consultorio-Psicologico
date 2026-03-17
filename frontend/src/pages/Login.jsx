import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { securityLogger } from '../utils/securityLogger';
import './Login.css';

function Login() {
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '' });
  const [error, setError] = useState('');
  const [intentos, setIntentos] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const [tiempoBloqueo, setTiempoBloqueo] = useState(0);
  const navigate = useNavigate();

  const MAX_ATTEMPTS = 3;
  const LOCKOUT_MINUTES = 15;

  useEffect(() => {
    // Cambiar el título de la pestaña
    document.title = 'Administrador - Consultorio Psique';
    
    return () => {
      document.title = 'Consultorio Psique';
    };
  }, []);

  useEffect(() => {
    // Verificar si está bloqueado al cargar
    const bloqueoData = localStorage.getItem('loginBloqueo');
    if (bloqueoData) {
      const { tiempo, intentosFallidos } = JSON.parse(bloqueoData);
      const tiempoTranscurrido = Date.now() - tiempo;
      const tiempoRestante = (LOCKOUT_MINUTES * 60 * 1000) - tiempoTranscurrido;
      
      if (tiempoRestante > 0) {
        setBloqueado(true);
        setTiempoBloqueo(Math.ceil(tiempoRestante / 60000));
        setIntentos(intentosFallidos);
      } else {
        localStorage.removeItem('loginBloqueo');
      }
    }
  }, [LOCKOUT_MINUTES]);

  useEffect(() => {
    // Actualizar contador de tiempo de bloqueo
    if (bloqueado && tiempoBloqueo > 0) {
      const timer = setInterval(() => {
        const bloqueoData = localStorage.getItem('loginBloqueo');
        if (bloqueoData) {
          const { tiempo } = JSON.parse(bloqueoData);
          const tiempoTranscurrido = Date.now() - tiempo;
          const tiempoRestante = (LOCKOUT_MINUTES * 60 * 1000) - tiempoTranscurrido;
          
          if (tiempoRestante <= 0) {
            localStorage.removeItem('loginBloqueo');
            setBloqueado(false);
            setIntentos(0);
            setTiempoBloqueo(0);
            setError('');
          } else {
            setTiempoBloqueo(Math.ceil(tiempoRestante / 60000));
          }
        }
      }, 60000); // Actualizar cada minuto
      
      return () => clearInterval(timer);
    }
  }, [bloqueado, tiempoBloqueo, LOCKOUT_MINUTES]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (bloqueado) {
      setError(`Demasiados intentos fallidos. Intente nuevamente en ${tiempoBloqueo} minutos.`);
      return;
    }
    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ username: credenciales.usuario, password: credenciales.password })
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error('Credenciales inválidas');
      })
      .then(data => {
        securityLogger.logLoginSuccess(credenciales.usuario);
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminUser', credenciales.usuario);
        localStorage.removeItem('loginBloqueo');
        // Sincronizar Google Calendar automáticamente
        fetch('/api/turnos/sync', { method: 'POST', credentials: 'same-origin' });
        navigate('/turnos');
      })
      .catch(() => {
        const nuevoIntentos = intentos + 1;
        setIntentos(nuevoIntentos);
        securityLogger.logLoginFailed(credenciales.usuario, MAX_ATTEMPTS - nuevoIntentos);
        if (nuevoIntentos >= MAX_ATTEMPTS) {
          setBloqueado(true);
          setTiempoBloqueo(LOCKOUT_MINUTES);
          localStorage.setItem('loginBloqueo', JSON.stringify({
            tiempo: Date.now(),
            intentosFallidos: nuevoIntentos
          }));
          securityLogger.logLockout(credenciales.usuario, LOCKOUT_MINUTES);
          setError(`Demasiados intentos fallidos. Cuenta bloqueada por ${LOCKOUT_MINUTES} minutos.`);
        } else {
          setError(`Usuario o contraseña incorrectos. Intentos restantes: ${MAX_ATTEMPTS - nuevoIntentos}`);
        }
      });
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

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={bloqueado}
              >
                {bloqueado ? `Bloqueado (${tiempoBloqueo} min)` : 'Iniciar Sesión'}
              </button>

              <div className="login-info">
                <p><small>⚠️ Solo para personal autorizado del consultorio</small></p>
                {intentos > 0 && intentos < MAX_ATTEMPTS && (
                  <p className="advertencia-intentos">
                    ⚠️ Advertencia: {MAX_ATTEMPTS - intentos} intento{MAX_ATTEMPTS - intentos !== 1 ? 's' : ''} restante{MAX_ATTEMPTS - intentos !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
