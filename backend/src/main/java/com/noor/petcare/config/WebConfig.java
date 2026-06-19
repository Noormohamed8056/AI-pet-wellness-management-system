package com.noor.petcare.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // Serve uploads from the filesystem (for local dev) and from classpath
        // (for packaged JAR deployments). This ensures images placed in
        // src/main/resources/static/uploads/ or copied into the jar are
        // available at /uploads/{file} after deployment.
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:uploads/", "classpath:/static/uploads/");
    }
}
