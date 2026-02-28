package com.psique.turnos.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaController {

    /**
     * Redirige todas las rutas no-API al index.html para que React Router funcione
     * Esto permite que el frontend maneje sus propias rutas
     */
    @GetMapping(value = {"/", "/login", "/home", "/agendar", "/turnos"})
    public String forward() {
        return "forward:/index.html";
    }
}
