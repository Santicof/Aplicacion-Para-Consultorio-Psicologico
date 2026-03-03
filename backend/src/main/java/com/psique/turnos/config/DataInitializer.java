package com.psique.turnos.config;

import com.psique.turnos.model.Profesional;
import com.psique.turnos.repository.ProfesionalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(ProfesionalRepository profesionalRepository) {
        return args -> {
            if (profesionalRepository.count() == 0) {
                List<String> horarios = Arrays.asList(
                    "08:00", "09:00", "10:00", "11:00", 
                    "14:00", "15:00", "16:00", "17:00", "18:00"
                );
                
                List<String> horariosExtendidos = Arrays.asList(
                    "08:00", "09:00", "10:00", "11:00", 
                    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
                );

                profesionalRepository.saveAll(Arrays.asList(
                    new Profesional(null, "Lic. Jimena Cofman", "Lic.",
                        "Psicóloga Infanto-Juvenil",
                        "Directora. Diplomada en Terapia Cognitiva Aplicada y Neurodesarrollo.", "9", horarios),
                    
                    new Profesional(null, "Lic. Carolina Orcellet", "Lic.",
                        "Psicóloga Infanto-Juvenil",
                        "Especialista en TCC (Terapia Cognitivo Conductual)", "10", horarios),
                    
                    new Profesional(null, "Lic. Julieta Porto", "Lic.",
                        "Psicopedagoga Infanto-Juvenil",
                        "Evaluación y tratamiento psicopedagógico", "6", horarios),
                    
                    new Profesional(null, "Lic. Marina Martínez", "Lic.",
                        "Psicopedagoga Infanto-Juvenil",
                        "Atención psicopedagógica especializada", "3", horarios),
                    
                    new Profesional(null, "Carla Linsalata", "",
                        "Taller de Legos",
                        "Fundadora Taller de Legos - Actividades terapéuticas con Lego", "4", horarios)
                ));
                
                System.out.println("✅ Profesionales inicializados en la base de datos");
            }
        };
    }
}
