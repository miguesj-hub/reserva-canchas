package ec.edu.master.template.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * RestClient bean for OtherServiceAdapter. Delete it together with the
 * adapter.out.client package if your service does not call another one.
 */
@Configuration
public class ClientsConfig {

    /**
     * The value comes from APP_CLIENTS_OTHER_SERVICE_URL. In Docker it is
     * http://<service-name>:8080: the SERVICE NAME and the INTERNAL PORT.
     * Inside a Docker network, the service name is the hostname.
     */
    @Bean
    RestClient otherServiceRestClient(@Value("${app.clients.other-service-url}") String baseUrl) {
        return RestClient.builder().baseUrl(baseUrl).build();
    }
}
