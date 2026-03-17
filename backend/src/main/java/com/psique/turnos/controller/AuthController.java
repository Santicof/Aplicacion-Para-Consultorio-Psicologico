package com.psique.turnos.controller;

import com.psique.turnos.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    private final UsuarioService usuarioService;
    private final PasswordEncoder passwordEncoder;

    // Rate limiting simple: IP → [intentos, timestampMs]
    private final ConcurrentHashMap<String, long[]> intentosPorIp = new ConcurrentHashMap<>();
    private static final int MAX_INTENTOS = 10;
    private static final long VENTANA_MS = 15 * 60 * 1000; // 15 minutos

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials,
                                   HttpServletRequest request,
                                   HttpServletResponse response) {
        String ip = obtenerIp(request);

        // Rate limiting
        if (estaBloqueado(ip)) {
            log.warn("🚫 Login bloqueado por rate limiting - IP: {}", ip);
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of("status", "error", "message", "Demasiados intentos. Intente en 15 minutos."));
        }

        String username = credentials.get("username");
        String password = credentials.get("password");

        if (username == null || password == null || username.isBlank() || password.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Credenciales requeridas"));
        }

        var usuarioOpt = usuarioService.findByUsername(username.trim());
        if (usuarioOpt.isPresent() && passwordEncoder.matches(password, usuarioOpt.get().getPassword())) {
            // Reset intentos
            intentosPorIp.remove(ip);

            // Crear contexto de seguridad
            var auth = new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
            );
            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(auth);
            SecurityContextHolder.setContext(context);

            // Persistir en sesión
            HttpSession session = request.getSession(true);
            session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
            session.setMaxInactiveInterval(3600); // 1 hora

            log.info("✅ Login exitoso - usuario: {}", username);
            return ResponseEntity.ok(Map.of(
                "status", "success",
                "rol", usuarioOpt.get().getRol()
            ));
        } else {
            registrarIntento(ip);
            log.warn("❌ Login fallido - usuario: {} | IP: {}", username, ip);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("status", "error", "message", "Credenciales inválidas"));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        SecurityContextHolder.clearContext();
        log.info("🔓 Sesión cerrada");
        return ResponseEntity.ok(Map.of("status", "success", "message", "Sesión cerrada"));
    }

    @GetMapping("/check")
    public ResponseEntity<?> check() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return ResponseEntity.ok(Map.of("authenticated", true, "user", auth.getName()));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("authenticated", false));
    }

    private String obtenerIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private boolean estaBloqueado(String ip) {
        long[] data = intentosPorIp.get(ip);
        if (data == null) return false;
        if (System.currentTimeMillis() - data[1] > VENTANA_MS) {
            intentosPorIp.remove(ip);
            return false;
        }
        return data[0] >= MAX_INTENTOS;
    }

    private void registrarIntento(String ip) {
        intentosPorIp.compute(ip, (k, v) -> {
            long now = System.currentTimeMillis();
            if (v == null || now - v[1] > VENTANA_MS) {
                return new long[]{1, now};
            }
            v[0]++;
            return v;
        });
    }
}
