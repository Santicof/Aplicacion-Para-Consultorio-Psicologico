package com.psique.turnos.config;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Deshabilitar CSRF (API stateless, misma-origen)
            .csrf(csrf -> csrf.disable())

            // No necesitamos CORS (app monolítica, misma-origen)
            .cors(cors -> cors.disable())

            // Persistir SecurityContext en HttpSession
            .securityContext(sc -> sc
                .securityContextRepository(new HttpSessionSecurityContextRepository())
            )

            // Reglas de autorización
            .authorizeHttpRequests(auth -> auth
                // Recursos estáticos
                .requestMatchers("/", "/index.html", "/assets/**", "/favicon.ico", "/*.js", "/*.css", "/*.png", "/*.jpg", "/*.svg").permitAll()

                // Rutas SPA (React Router)
                .requestMatchers("/home", "/agendar", "/turnos", "/admin", "/psq-admin-8x7k2m").permitAll()

                // Auth endpoints
                .requestMatchers("/api/auth/**").permitAll()

                // API pública - solo lectura para pacientes
                .requestMatchers(HttpMethod.GET, "/api/profesionales", "/api/profesionales/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/horarios-disponibles/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/dias-no-laborables").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/eventos/publicos").permitAll()

                // Agendar turno (público para pacientes)
                .requestMatchers(HttpMethod.POST, "/api/turnos").permitAll()

                // Google OAuth callbacks
                .requestMatchers("/oauth2callback").permitAll()
                .requestMatchers("/api/google-calendar/callback").permitAll()

                // Webhooks de Google Calendar
                .requestMatchers("/api/webhooks/**").permitAll()

                // Todo lo demás requiere autenticación (admin)
                .anyRequest().authenticated()
            )

            // Gestión de sesiones
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .maximumSessions(3)
            )

            // Respuesta 401 JSON para peticiones no autenticadas (en vez de redirect a /login)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.setCharacterEncoding("UTF-8");
                    response.getWriter().write("{\"error\":\"No autorizado\",\"message\":\"Debe iniciar sesión para acceder a este recurso\"}");
                })
            )

            // Headers de seguridad
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives("default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self'; frame-src 'self' https://www.google.com https://maps.google.com https://accounts.google.com")
                )
                .frameOptions(fo -> fo.sameOrigin())
            )

            // Deshabilitar form login y httpBasic (usamos login custom con JSON)
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable());

        return http.build();
    }
}
