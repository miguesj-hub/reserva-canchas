package com.ups.reservacanchas.canchas.adapter.in.web;

import com.ups.reservacanchas.canchas.domain.exception.CourtNotFoundException;
import com.ups.reservacanchas.canchas.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Único punto donde una excepción de dominio se convierte en un código HTTP
 * (Principio III). Produce el cuerpo de error uniforme de contracts/README.md,
 * idéntico al de los otros tres servicios.
 */
@RestControllerAdvice
public class ErrorHandler {

    /** 404 — la cancha no existe. */
    @ExceptionHandler(CourtNotFoundException.class)
    public ResponseEntity<ErrorResponse> noEncontrada(
            CourtNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /** 400 — el cuerpo no cumple jakarta.validation (FR-044). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> cuerpoInvalido(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String detalle = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, detalle, request);
    }

    /**
     * 400 — un valor de query no encaja con su tipo. En la práctica esto es
     * `?deporte=FUTBOL`: la enumeración es cerrada (R-008) y un valor fuera de
     * la lista se rechaza, no se ignora ni se trata como texto libre.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> parametroInvalido(
            MethodArgumentTypeMismatchException ex, HttpServletRequest request) {
        return build(
                HttpStatus.BAD_REQUEST,
                "El valor '" + ex.getValue() + "' no es válido para el parámetro '" + ex.getName() + "'.",
                request);
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String message, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
