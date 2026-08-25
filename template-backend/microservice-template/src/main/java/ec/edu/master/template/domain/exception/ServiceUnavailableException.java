package ec.edu.master.template.domain.exception;

/** A microservice we depend on did not respond. The web adapter translates it to HTTP 503. */
public class ServiceUnavailableException extends RuntimeException {

    public ServiceUnavailableException(String message) {
        super(message);
    }
}
