package com.psique.turnos.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    /**
     * Redirige todas las rutas no-API al index.html para que React Router funcione
     * Esto permite que el frontend maneje sus propias rutas
     */
    @GetMapping(value = {"/", "/home", "/agendar", "/turnos", "/admin", "/gestion-consultorio-interno"})
    public String forward() {
        return "forward:/index.html";
    }

    @GetMapping("/mantenimiento")
    public ResponseEntity<String> bloquearMantenimiento() {
        return ResponseEntity.status(403).body("Acceso denegado");
    }
}
