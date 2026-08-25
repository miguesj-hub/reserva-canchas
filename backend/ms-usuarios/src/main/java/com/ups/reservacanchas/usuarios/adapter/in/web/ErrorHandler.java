package com.ups.reservacanchas.usuarios.adapter.in.web;

import com.ups.reservacanchas.usuarios.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.usuarios.domain.exception.InvalidCredentialsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserAlreadyExistsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserNotFoundException;
import com.ups.reservacanchas.usuarios.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Único punto donde una excepción de dominio se convierte en un código HTTP
 * (Principio III): por eso las excepciones de domain/exception/ no llevan
 * HttpStatus. Produce el cuerpo de error uniforme de contracts/README.md,
 * idéntico en los cuatro servicios.
 */
@RestControllerAdvice
public class ErrorHandler {

    /** 401 — credencial que no sirve, o cuenta inactiva (FR-003, FR-005). */
    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> credencialInvalida(
            InvalidCredentialsException ex, HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), request);
    }

    /** 409 — conflicto con el estado actual: ese username ya está tomado (FR-002). */
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> usuarioDuplicado(
            UserAlreadyExistsException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    /** 403 — FR-048: la gestión de usuarios es solo del administrador. */
    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ErrorResponse> prohibido(
            ForbiddenOperationException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    /** 401 — falta la cabecera de identidad; alguien llamó al :8081 directo. */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> sinIdentidad(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(
                HttpStatus.UNAUTHORIZED,
                "Falta la cabecera de identidad " + ex.getHeaderName()
                        + "; esta API se consume a través del gateway.",
                request);
    }

    /** 404 — el recurso no existe. */
    @ExceptionHandler(UserNotFoundException.class)
    public ResponseEntity<ErrorResponse> noEncontrado(
            UserNotFoundException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /** 400 — el cuerpo no cumple las restricciones de jakarta.validation (FR-044). */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> cuerpoInvalido(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String detalle = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, detalle, request);
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String message, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
