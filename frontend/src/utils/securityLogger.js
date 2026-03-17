/**
 * Sistema de Logging de Seguridad
 * Registra intentos de acceso y eventos de seguridad
 */

const MAX_LOGS = 100; // Máximo de logs a mantener

/**
 * Estructura de un log:
 * {
 *   timestamp: Date ISO string,
 *   type: 'login_success' | 'login_failed' | 'lockout' | 'logout',
 *   username: string,
 *   ip: string (si está disponible),
 *   userAgent: string,
 *   details: object
 * }
 */

class SecurityLogger {
  constructor() {
    this.logsKey = 'security_logs';
  }

  /**
   * Obtiene todos los logs almacenados
   */
  getLogs() {
    try {
      const logs = localStorage.getItem(this.logsKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error al leer logs:', error);
      return [];
    }
  }

  /**
   * Guarda un log en el almacenamiento
   */
  saveLog(type, username, details = {}) {
    try {
      const logs = this.getLogs();
      
      const newLog = {
        timestamp: new Date().toISOString(),
        type,
        username,
        userAgent: navigator.userAgent,
        details
      };

      // Agregar al inicio del array
      logs.unshift(newLog);

      // Mantener solo los últimos MAX_LOGS
      const trimmedLogs = logs.slice(0, MAX_LOGS);

      localStorage.setItem(this.logsKey, JSON.stringify(trimmedLogs));

      // Si es un evento crítico, también lo mostramos en consola
      if (type === 'login_failed' || type === 'lockout') {
        console.warn('🔒 Evento de seguridad:', newLog);
      }

      return newLog;
    } catch (error) {
      console.error('Error al guardar log:', error);
      return null;
    }
  }

  /**
   * Registra un intento exitoso de login
   */
  logLoginSuccess(username) {
    return this.saveLog('login_success', username, {
      message: 'Login exitoso'
    });
  }

  /**
   * Registra un intento fallido de login
   */
  logLoginFailed(username, remainingAttempts) {
    return this.saveLog('login_failed', username, {
      message: 'Credenciales incorrectas',
      remainingAttempts
    });
  }

  /**
   * Registra un bloqueo de cuenta
   */
  logLockout(username, duration) {
    return this.saveLog('lockout', username, {
      message: 'Cuenta bloqueada por múltiples intentos fallidos',
      duration: `${duration} minutos`
    });
  }

  /**
   * Registra un cierre de sesión
   */
  logLogout(username) {
    return this.saveLog('logout', username, {
      message: 'Sesión cerrada'
    });
  }

  /**
   * Obtiene estadísticas de seguridad
   */
  getStats() {
    const logs = this.getLogs();
    
    return {
      total: logs.length,
      loginSuccess: logs.filter(l => l.type === 'login_success').length,
      loginFailed: logs.filter(l => l.type === 'login_failed').length,
      lockouts: logs.filter(l => l.type === 'lockout').length,
      lastLogin: logs.find(l => l.type === 'login_success')?.timestamp || null,
      lastFailedAttempt: logs.find(l => l.type === 'login_failed')?.timestamp || null
    };
  }

  /**
   * Obtiene logs recientes (últimos N logs)
   */
  getRecentLogs(count = 10) {
    const logs = this.getLogs();
    return logs.slice(0, count);
  }

  /**
   * Limpia todos los logs (usar con cuidado)
   */
  clearLogs() {
    try {
      localStorage.removeItem(this.logsKey);
      console.log('✅ Logs de seguridad eliminados');
      return true;
    } catch (error) {
      console.error('Error al limpiar logs:', error);
      return false;
    }
  }

  /**
   * Exporta logs a JSON (para respaldo)
   */
  exportLogs() {
    const logs = this.getLogs();
    const stats = this.getStats();
    
    return {
      exportDate: new Date().toISOString(),
      stats,
      logs
    };
  }

  /**
   * Formatea un log para mostrar
   */
  formatLog(log) {
    const date = new Date(log.timestamp);
    const time = date.toLocaleString('es-AR');
    
    const icons = {
      login_success: '✅',
      login_failed: '❌',
      lockout: '🔒',
      logout: '🚪'
    };

    return `${icons[log.type]} ${time} - ${log.type.toUpperCase()} - Usuario: ${log.username}`;
  }
}

// Exportar instancia singleton
export const securityLogger = new SecurityLogger();
export default securityLogger;
