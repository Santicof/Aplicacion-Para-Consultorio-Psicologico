package com.psique.turnos.controller;

import com.psique.turnos.config.GoogleCalendarConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@Slf4j
public class OAuth2CallbackController {
    private final GoogleCalendarConfig googleCalendarConfig;

    @GetMapping("/oauth2callback")
    public ResponseEntity<String> handleOAuth2Callback(@RequestParam(required = false) String code, 
                                                        @RequestParam(required = false) String error) {
        if (error != null) {
            log.error("Error en callback de Google OAuth2: {}", error);
            return ResponseEntity.ok("<html><body><script>window.location.href='/turnos?calendar_error=" + error + "'</script></body></html>");
        }
        
        if (code != null) {
            try {
                googleCalendarConfig.handleAuthorizationCode(code);
                log.info("✅ Google Calendar autorizado exitosamente");
                return ResponseEntity.ok("<html><body><script>window.location.href='/turnos?calendar_connected=true'</script></body></html>");
            } catch (Exception e) {
                log.error("Error al procesar código de autorización OAuth2", e);
                return ResponseEntity.ok("<html><body><script>window.location.href='/turnos?calendar_error=exchange_failed'</script></body></html>");
            }
        }
        
        return ResponseEntity.ok("<html><body><script>window.location.href='/turnos'</script></body></html>");
    }
}
