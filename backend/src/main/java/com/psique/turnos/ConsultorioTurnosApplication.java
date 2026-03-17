package com.psique.turnos;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

@SpringBootApplication(exclude = { UserDetailsServiceAutoConfiguration.class })
public class ConsultorioTurnosApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConsultorioTurnosApplication.class, args);
        System.out.println("🏥 Servidor del Consultorio Integral Psique ejecutándose en http://localhost:3000");
        System.out.println("📅 API de turnos disponible en http://localhost:3000/api");
    }
}
