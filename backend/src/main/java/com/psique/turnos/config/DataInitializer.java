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
                    new Profesional(null, "Lic. Jimena A. Cofman", 
                        "Psicóloga Clínica Infanto-Juvenil",
                        "Atención especializada en niños y adolescentes", horarios),
                    
                    new Profesional(null, "Lic. Carolina Orcellet", 
                        "Psicóloga Clínica Infanto-Juvenil",
                        "Atención especializada en niños y adolescentes", horarios),
                    
                    new Profesional(null, "Lic. Julieta Porto", 
                        "Psicopedagoga Niños y Adolescentes",
                        "Evaluación y tratamiento psicopedagógico", horarios),
                    
                    new Profesional(null, "Lic. Erica Baade", 
                        "Psicóloga Clínica Adultos",
                        "Atención psicológica para adultos", horariosExtendidos)
                ));
                
                System.out.println("✅ Profesionales inicializados en la base de datos");
            }
        };
    }
}
