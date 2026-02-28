package com.psique.turnos.controller;

import com.psique.turnos.service.GoogleCalendarSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final GoogleCalendarSyncService syncService;

    /**
     * Endpoint para recibir notificaciones de Google Calendar
     * Google enviará notificaciones POST a esta URL cuando cambien eventos
     */
    @PostMapping("/google-calendar")
    public ResponseEntity<Void> handleGoogleCalendarWebhook(
            @RequestHeader(value = "X-Goog-Channel-ID", required = false) String channelId,
            @RequestHeader(value = "X-Goog-Resource-ID", required = false) String resourceId,
            @RequestHeader(value = "X-Goog-Resource-State", required = false) String resourceState,
            HttpServletRequest request) {

        log.info("📡 Webhook recibido de Google Calendar");
        log.debug("Channel ID: {}", channelId);
        log.debug("Resource ID: {}", resourceId);
        log.debug("State: {}", resourceState);

        // Verificar que sea una notificación de cambio (no solo sync inicial)
        if ("sync".equals(resourceState)) {
            log.info("🔄 Sincronización inicial de webhook - ignorando");
            return ResponseEntity.ok().build();
        }

        // Si hay cambios reales, sincronizar inmediatamente
        if ("exists".equals(resourceState) || "update".equals(resourceState)) {
            log.info("🔔 Cambio detectado en Google Calendar - sincronizando AHORA...");
            
            try {
                syncService.syncFromGoogleCalendar();
                log.info("✅ Sincronización instantánea completada");
            } catch (Exception e) {
                log.error("❌ Error al sincronizar: {}", e.getMessage(), e);
                return ResponseEntity.internalServerError().build();
            }
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Endpoint para verificar que el webhook está funcionando
     */
    @GetMapping("/google-calendar/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("Webhook endpoint activo y funcionando");
    }
}
