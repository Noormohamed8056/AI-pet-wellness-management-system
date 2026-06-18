// Corsconfig.java
package com.noor.petcare.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Value("${app.frontend.url:http://localhost:5173}")
    private String appFrontendUrl;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        String frontend = appFrontendUrl;
        registry.addMapping("/**")
                .allowedOrigins(new String[]{frontend, "http://localhost:3000"})
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS","PATCH")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
