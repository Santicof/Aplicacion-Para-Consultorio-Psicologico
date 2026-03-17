package com.psique.turnos.config;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.auth.oauth2.TokenResponse;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.calendar.Calendar;
import com.google.api.services.calendar.CalendarScopes;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Collections;
import java.util.List;

@Configuration
@Slf4j
public class GoogleCalendarConfig {

    private static final String APPLICATION_NAME = "Consultorio Integral Psique";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final List<String> SCOPES = Collections.singletonList(CalendarScopes.CALENDAR);
    private static final String TOKENS_DIRECTORY_PATH = "tokens";

    @Value("${google.calendar.redirect-uri:http://localhost:3000/oauth2callback}")
    private String redirectUri;

    @Value("${google.calendar.credentials.file}")
    private Resource credentialsFile;

    @Value("${google.calendar.credentials.json:#{null}}")
    private String credentialsJson;

    @Value("${google.calendar.enabled:false}")
    @Getter
    private boolean calendarEnabled;

    private volatile GoogleAuthorizationCodeFlow flow;
    private volatile NetHttpTransport httpTransport;
    private volatile Calendar calendarService;
    private volatile boolean disconnected = false;

    private NetHttpTransport getHttpTransport() throws GeneralSecurityException, IOException {
        if (httpTransport == null) {
            httpTransport = GoogleNetHttpTransport.newTrustedTransport();
        }
        return httpTransport;
    }

    private synchronized GoogleAuthorizationCodeFlow buildFlow() throws IOException, GeneralSecurityException {
        InputStream in = null;

        // Opción 1: variable de entorno GOOGLE_CREDENTIALS_JSON (producción)
        if (credentialsJson != null && !credentialsJson.isBlank()) {
            log.info("📄 Usando credenciales de Google desde variable de entorno");
            in = new ByteArrayInputStream(credentialsJson.getBytes(StandardCharsets.UTF_8));
        }
        // Opción 2: archivo credentials.json (desarrollo local)
        else if (credentialsFile != null && credentialsFile.exists()) {
            log.info("📄 Usando credenciales de Google desde archivo credentials.json");
            in = credentialsFile.getInputStream();
        }

        if (in == null) {
            log.warn("⚠️ No se encontraron credenciales de Google Calendar (ni variable de entorno ni archivo)");
            return null;
        }

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

        return new GoogleAuthorizationCodeFlow.Builder(
                getHttpTransport(), JSON_FACTORY, clientSecrets, SCOPES)
                .setDataStoreFactory(new FileDataStoreFactory(new File(TOKENS_DIRECTORY_PATH)))
                .setAccessType("offline")
                .build();
    }

    private synchronized void ensureFlow() throws IOException, GeneralSecurityException {
        if (flow == null) {
            flow = buildFlow();
        }
    }

    public String getAuthorizationUrl() {
        try {
            ensureFlow();
            if (flow == null) return null;
            return flow.newAuthorizationUrl()
                    .setRedirectUri(redirectUri)
                    .build();
        } catch (Exception e) {
            log.error("Error al generar URL de autorización", e);
            return null;
        }
    }

    public synchronized void handleAuthorizationCode(String code) throws IOException, GeneralSecurityException {
        // Siempre recrear el flow para tener DataStore fresco
        flow = buildFlow();
        if (flow == null) {
            throw new IOException("No se pudo inicializar el flujo de autorización");
        }

        TokenResponse tokenResponse = flow.newTokenRequest(code)
                .setRedirectUri(redirectUri)
                .execute();

        flow.createAndStoreCredential(tokenResponse, "user");
        disconnected = false;
        
        // Construir nuevo Calendar service
        Credential credential = flow.loadCredential("user");
        calendarService = new Calendar.Builder(getHttpTransport(), JSON_FACTORY, credential)
                .setApplicationName(APPLICATION_NAME)
                .build();
        
        log.info("✅ Credenciales de Google Calendar almacenadas exitosamente");
    }

    public synchronized void revokeCredentials() throws IOException {
        // 1. Borrar archivos de tokens
        File tokensDir = new File(TOKENS_DIRECTORY_PATH);
        if (tokensDir.exists() && tokensDir.isDirectory()) {
            File[] files = tokensDir.listFiles();
            if (files != null) {
                for (File file : files) {
                    if (!file.delete()) {
                        log.warn("No se pudo borrar: {}", file.getAbsolutePath());
                    }
                }
            }
            tokensDir.delete();
        }
        
        // 2. Invalidar todo - el flow cachea credenciales en su DataStore interno
        calendarService = null;
        flow = null;
        disconnected = true;
        
        log.info("🔓 Credenciales de Google Calendar revocadas");
    }

    public synchronized boolean isConnected() {
        if (!calendarEnabled || disconnected) return false;
        try {
            ensureFlow();
            if (flow == null) return false;
            Credential credential = flow.loadCredential("user");
            return credential != null && credential.getAccessToken() != null;
        } catch (Exception e) {
            return false;
        }
    }

    @Bean
    public Calendar googleCalendar() {
        if (!calendarEnabled) {
            log.info("📅 Google Calendar está DESHABILITADO en la configuración");
            return null;
        }

        try {
            // Verificar que hay credenciales disponibles (archivo o variable de entorno)
            boolean hasCredentials = (credentialsJson != null && !credentialsJson.isBlank())
                    || (credentialsFile != null && credentialsFile.exists());
            if (!hasCredentials) {
                log.warn("⚠️ No se encontraron credenciales de Google Calendar");
                return null;
            }

            ensureFlow();
            if (flow == null) return null;

            Credential credential = flow.loadCredential("user");
            if (credential == null) {
                log.info("📅 No hay credenciales almacenadas. El usuario debe autorizar la aplicación.");
                return null;
            }

            calendarService = new Calendar.Builder(getHttpTransport(), JSON_FACTORY, credential)
                    .setApplicationName(APPLICATION_NAME)
                    .build();

            log.info("✅ Google Calendar API configurado correctamente");
            return calendarService;

        } catch (GeneralSecurityException | IOException e) {
            log.error("❌ Error al inicializar Google Calendar API: {}", e.getMessage());
            return null;
        }
    }

    public synchronized Calendar getCalendarService() {
        if (disconnected) return null;
        if (calendarService == null) {
            return googleCalendar();
        }
        return calendarService;
    }
}
