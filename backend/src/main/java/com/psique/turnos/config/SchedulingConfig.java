package com.psique.turnos.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    // Habilita la ejecución de tareas programadas con @Scheduled
}
