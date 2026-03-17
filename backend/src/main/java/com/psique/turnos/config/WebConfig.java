package com.psique.turnos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    // CORS deshabilitado - la app es monolítica (mismo origen)
    // La seguridad se gestiona desde SecurityConfig
}
