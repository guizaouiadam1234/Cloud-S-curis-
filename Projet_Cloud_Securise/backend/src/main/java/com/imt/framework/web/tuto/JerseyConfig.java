package com.imt.framework.web.tuto;

import com.imt.framework.web.tuto.resources.LivreResource;
import jakarta.ws.rs.ApplicationPath;
import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.context.annotation.Configuration;
import org.springframework.stereotype.Component;

@Component
@ApplicationPath("librairy")
@Configuration
public class JerseyConfig extends ResourceConfig {
    public JerseyConfig(){
        register(LivreResource.class);
    }
}
