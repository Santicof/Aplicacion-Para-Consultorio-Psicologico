package com.psique.turnos.service;

import com.google.api.client.util.DateTime;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.model.Channel;
import com.psique.turnos.config.GoogleCalendarConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class GoogleCalendarWebhookService {

    private final Calendar calendar;
    private final GoogleCalendarConfig config;

    @Value("${google.calendar.id:primary}")
    private String calendarId;

    @Value("${google.calendar.webhook.url:}")
    private String webhookUrl;

    @Value("${google.calendar.webhook.enabled:false}")
    private boolean webhookEnabled;

    @Autowired
    public GoogleCalendarWebhookService(@Autowired(required = false) Calendar calendar, GoogleCalendarConfig config) {
        this.calendar = calendar;
        this.config = config;
    }

    /**
     * Registra un webhook en Google Calendar para recibir notificaciones de cambios
     * Esto permite sincronización bidireccional: cambios en Google Calendar → App
     */
    public String registerWebhook() {
        if (!config.isCalendarEnabled() || calendar == null || !webhookEnabled) {
            log.info("📅 Webhooks de Google Calendar deshabilitados");
            return null;
        }

        if (webhookUrl == null || webhookUrl.isEmpty()) {
            log.warn("⚠️  Webhook URL no configurada. Configure 'google.calendar.webhook.url' en application.yml");
            return null;
        }

        try {
            // Crear canal de notificación
            Channel channel = new Channel();
            channel.setId(UUID.randomUUID().toString());
            channel.setType("web_hook");
            channel.setAddress(webhookUrl);
            
            // Configurar para recibir notificaciones por 7 días (máximo permitido)
            long expirationTime = System.currentTimeMillis() + (7 * 24 * 60 * 60 * 1000L);
            channel.setExpiration(expirationTime);

            // Registrar el webhook con Google Calendar
            Channel createdChannel = calendar.events()
                    .watch(calendarId, channel)
                    .execute();

            log.info("✅ Webhook registrado exitosamente en Google Calendar");
            log.info("📡 Channel ID: {}", createdChannel.getId());
            log.info("⏰ Expira: {}", new DateTime(createdChannel.getExpiration()));
            log.info("🔔 Recibirás notificaciones cuando cambien eventos en Google Calendar");

            return createdChannel.getId();

        } catch (IOException e) {
            log.error("❌ Error al registrar webhook en Google Calendar: {}", e.getMessage());
            return null;
        }
    }

    /**
     * Detiene un webhook activo
     */
    public void stopWebhook(String channelId, String resourceId) {
        if (!config.isCalendarEnabled() || calendar == null) {
            return;
        }

        try {
            Channel channel = new Channel();
            channel.setId(channelId);
            channel.setResourceId(resourceId);

            calendar.channels().stop(channel).execute();
            log.info("🛑 Webhook detenido: {}", channelId);

        } catch (IOException e) {
            log.error("❌ Error al detener webhook: {}", e.getMessage());
        }
    }
}
