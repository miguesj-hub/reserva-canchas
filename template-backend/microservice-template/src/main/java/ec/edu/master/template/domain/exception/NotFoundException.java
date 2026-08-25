package ec.edu.master.template.domain.exception;

/** Resource does not exist. The web adapter translates it to HTTP 404. */
public class NotFoundException extends RuntimeException {

    public NotFoundException(String message) {
        super(message);
    }
}
