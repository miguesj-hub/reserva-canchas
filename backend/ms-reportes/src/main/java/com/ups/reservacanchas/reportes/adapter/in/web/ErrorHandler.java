package com.ups.reservacanchas.reportes.adapter.in.web;

import com.ups.reservacanchas.reportes.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reportes.domain.exception.InvalidDateRangeException;
import com.ups.reservacanchas.reportes.domain.exception.UpstreamUnavailableException;
import com.ups.reservacanchas.reportes.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Único punto donde una excepción de dominio se convierte en código HTTP
 * (Principio III), con el cuerpo de error uniforme de contracts/README.md.
 */
@RestControllerAdvice
public class ErrorHandler {

    /** 400 — rango ausente, mal formado o invertido (FR-044). */
    @ExceptionHandler({
        InvalidDateRangeException.class,
        MissingServletRequestParameterException.class,
        MethodArgumentTypeMismatchException.class,
        IllegalArgumentException.class
    })
    public ResponseEntity<ErrorResponse> rangoInvalido(Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /** 403 — FR-043. */
    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ErrorResponse> prohibido(
            ForbiddenOperationException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    /**
     * 503 — un servicio origen no responde. Se dice, en lugar de devolver ceros:
     * un cero que significa "no pude preguntar" y otro que significa "no hubo
     * reservas" se leen igual en pantalla, y el segundo es legítimo.
     */
    @ExceptionHandler(UpstreamUnavailableException.class)
    public ResponseEntity<ErrorResponse> origenCaido(
            UpstreamUnavailableException ex, HttpServletRequest request) {
        return build(HttpStatus.SERVICE_UNAVAILABLE, ex.getMessage(), request);
    }

    /** 401 — falta la cabecera de identidad; alguien llamó al :8084 directo. */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> sinIdentidad(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(
                HttpStatus.UNAUTHORIZED,
                "Falta la cabecera de identidad " + ex.getHeaderName()
                        + "; esta API se consume a través del gateway.",
                request);
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String message, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
