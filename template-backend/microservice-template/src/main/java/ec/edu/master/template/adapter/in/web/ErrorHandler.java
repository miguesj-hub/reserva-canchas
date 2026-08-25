package ec.edu.master.template.adapter.in.web;

import ec.edu.master.template.domain.exception.BusinessRuleException;
import ec.edu.master.template.domain.exception.NotFoundException;
import ec.edu.master.template.domain.exception.ServiceUnavailableException;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Part of the input adapter (web): translates domain exceptions into HTTP
 * status codes. Without it, any exception from the use case reaches the
 * client as a generic 500, and the frontend cannot tell "invalid data" from
 * "the server broke".
 *
 * These handlers are the common minimum for ms-usuarios, ms-canchas, and
 * ms-reservas, plus ServiceUnavailableException (for services that call
 * another one over HTTP, package adapter.out.client). If your service also
 * has a database constraint to translate (like the EXCLUDE for RN-02 in
 * ms-reservas), add one more @ExceptionHandler here — don't duplicate it in
 * the controller.
 */
@RestControllerAdvice
public class ErrorHandler {

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<Map<String, String>> businessRule(BusinessRuleException ex) {
        return ResponseEntity.badRequest()
                .body(Map.of("error", ex.getCode(), "message", ex.getMessage()));
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Map<String, String>> notFound(NotFoundException ex) {
        return ResponseEntity.status(404)
                .body(Map.of("error", "NOT_FOUND", "message", ex.getMessage()));
    }

    @ExceptionHandler(ServiceUnavailableException.class)
    public ResponseEntity<Map<String, String>> serviceDown(ServiceUnavailableException ex) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(Map.of("error", "SERVICE_UNAVAILABLE", "message", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> validation(MethodArgumentNotValidException ex) {
        Map<String, String> fields = new HashMap<>();
        ex.getBindingResult().getFieldErrors()
                .forEach(e -> fields.put(e.getField(), e.getDefaultMessage()));
        return ResponseEntity.badRequest().body(Map.of("error", "VALIDATION", "fields", fields));
    }
}
