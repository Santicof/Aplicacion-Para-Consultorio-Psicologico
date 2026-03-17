package com.psique.turnos.controller;

import com.psique.turnos.config.GoogleCalendarConfig;
import com.psique.turnos.service.GoogleCalendarService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/google-calendar")
@RequiredArgsConstructor
@Slf4j
public class GoogleCalendarController {
    private final GoogleCalendarService googleCalendarService;
    private final GoogleCalendarConfig googleCalendarConfig;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        Map<String, Object> status = new HashMap<>();
        boolean conectado = googleCalendarConfig.isConnected();
        status.put("connected", conectado);
        status.put("enabled", googleCalendarConfig.isCalendarEnabled());
        status.put("message", conectado ? "Conectado a Google Calendar" : "No conectado");
        return ResponseEntity.ok(status);
    }

    @GetMapping("/estado")
    public ResponseEntity<?> estado() {
        boolean conectado = googleCalendarConfig.isConnected();
        return ResponseEntity.ok().body(conectado ? "Conectado" : "No conectado");
    }

    @GetMapping("/auth-url")
    public ResponseEntity<Map<String, Object>> getAuthUrl() {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!googleCalendarConfig.isCalendarEnabled()) {
                response.put("error", "Google Calendar está deshabilitado en la configuración");
                return ResponseEntity.ok(response);
            }

            String authUrl = googleCalendarConfig.getAuthorizationUrl();
            if (authUrl != null) {
                response.put("authUrl", authUrl);
            } else {
                response.put("error", "No se pudo generar la URL de autorización. Verifica que credentials.json existe.");
            }
        } catch (Exception e) {
            log.error("Error al obtener URL de autorización", e);
            response.put("error", "Error al generar URL de autorización: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping({"callback", "/callback"})
    public ResponseEntity<String> handleCallback(@RequestParam(required = false) String code, 
                                                  @RequestParam(required = false) String error) {
        if (error != null) {
            log.error("Error en callback de Google: {}", error);
            return ResponseEntity.ok("<html><body><script>window.location.href='/turnos?calendar_error=" + error + "'</script></body></html>");
        }
        
        if (code != null) {
            try {
                googleCalendarConfig.handleAuthorizationCode(code);
                log.info("✅ Google Calendar autorizado exitosamente");
                return ResponseEntity.ok("<html><body><script>window.location.href='/turnos?calendar_connected=true'</script></body></html>");
            } catch (Exception e) {
                log.error("Error al procesar código de autorización", e);
                return ResponseEntity.ok("<html><body><script>window.location.href='/turnos?calendar_error=exchange_failed'</script></body></html>");
            }
        }
        
        return ResponseEntity.ok("<html><body><script>window.location.href='/turnos'</script></body></html>");
    }

    @PostMapping("/disconnect")
    public ResponseEntity<Map<String, Object>> disconnect() {
        Map<String, Object> response = new HashMap<>();
        try {
            googleCalendarConfig.revokeCredentials();
            response.put("success", true);
            response.put("message", "Google Calendar desconectado");
        } catch (Exception e) {
            log.error("Error al desconectar Google Calendar", e);
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reconnect")
    public ResponseEntity<Map<String, Object>> reconnect() {
        return getAuthUrl();
    }

    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> sync() {
        Map<String, Object> response = new HashMap<>();
        try {
            if (!googleCalendarService.isConnected()) {
                response.put("success", false);
                response.put("error", "Google Calendar no está conectado");
                return ResponseEntity.ok(response);
            }
            // La sincronización real se haría llamando al sync service
            response.put("success", true);
            response.put("message", "Sincronización iniciada");
        } catch (Exception e) {
            log.error("Error en sincronización", e);
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return ResponseEntity.ok(response);
    }
}
