package com.psique.turnos.config;

import com.fasterxml.jackson.core.StreamReadConstraints;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.getFactory().setStreamReadConstraints(
            StreamReadConstraints.builder()
                .maxStringLength(50_000_000) // 50MB para base64 de imágenes
                .build()
        );
        mapper.findAndRegisterModules();
        return mapper;
    }
}
