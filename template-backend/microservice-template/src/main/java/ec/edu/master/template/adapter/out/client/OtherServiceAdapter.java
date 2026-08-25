package ec.edu.master.template.adapter.out.client;

import ec.edu.master.template.application.port.out.OtherServicePort;
import ec.edu.master.template.domain.exception.BusinessRuleException;
import ec.edu.master.template.domain.exception.ServiceUnavailableException;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/**
 * Output adapter (REST client): implements the port by calling another
 * microservice over HTTP (see CourtClientAdapter in ms-reservas for the real
 * case). Delete it together with OtherServicePort if your service does not
 * need to call another one.
 *
 * A microservice NEVER reads another one's database directly: they are
 * different databases, with connection users that don't even have
 * permission. The only path is an HTTP call like this one, and that is what
 * preserves data independence (scope document §4.3).
 */
@Component
public class OtherServiceAdapter implements OtherServicePort {

    private final RestClient client;

    public OtherServiceAdapter(RestClient otherServiceRestClient) {
        this.client = otherServiceRestClient;
    }

    @Override
    public RemoteResource get(Long id) {
        try {
            return client.get()
                    .uri("/api/resources/{id}", id)
                    .retrieve()
                    .body(RemoteResource.class);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                throw new BusinessRuleException(
                        "RESOURCE_DOES_NOT_EXIST", "The referenced resource does not exist.");
            }
            throw new ServiceUnavailableException(
                    "The other service responded with an error: " + e.getStatusCode());
        } catch (RestClientException e) {
            // Synchronous communication: if the other service is down, this
            // operation cannot complete. That is the accepted consequence of
            // the temporal coupling between the two.
            throw new ServiceUnavailableException("Could not reach the other service.");
        }
    }
}
