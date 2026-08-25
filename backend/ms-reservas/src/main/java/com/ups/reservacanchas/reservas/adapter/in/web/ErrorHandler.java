package com.ups.reservacanchas.reservas.adapter.in.web;

import com.ups.reservacanchas.reservas.domain.exception.ActiveBookingLimitExceededException;
import com.ups.reservacanchas.reservas.domain.exception.BookingNotFoundException;
import com.ups.reservacanchas.reservas.domain.exception.CourtNotBookableException;
import com.ups.reservacanchas.reservas.domain.exception.CourtNotFoundException;
import com.ups.reservacanchas.reservas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reservas.domain.exception.PastBookingCancellationException;
import com.ups.reservacanchas.reservas.domain.exception.SlotAlreadyBookedException;
import com.ups.reservacanchas.reservas.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingRequestHeaderException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.RestClientException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

/**
 * Único punto donde una excepción de dominio se convierte en un código HTTP
 * (Principio III). Produce el cuerpo de error uniforme de contracts/README.md.
 *
 * El reparto de códigos sigue el catálogo del contrato, y la distinción que más
 * importa es 409 frente a 422: **409** es un conflicto con el estado actual que
 * puede desaparecer solo —el bloque puede liberarse, el usuario puede cancelar
 * otra reserva—; **422** es una petición que no va a funcionar por reintentar.
 */
@RestControllerAdvice
public class ErrorHandler {

    // --- 409: conflictos que pueden resolverse solos ------------------------

    /** RN-02. El mismo cuerpo llegue de la comprobación previa o de la restricción EXCLUDE. */
    @ExceptionHandler(SlotAlreadyBookedException.class)
    public ResponseEntity<ErrorResponse> bloqueOcupado(
            SlotAlreadyBookedException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    /** RN-06. */
    @ExceptionHandler(ActiveBookingLimitExceededException.class)
    public ResponseEntity<ErrorResponse> topeAlcanzado(
            ActiveBookingLimitExceededException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    /** RN-04. */
    @ExceptionHandler(PastBookingCancellationException.class)
    public ResponseEntity<ErrorResponse> yaInicio(
            PastBookingCancellationException ex, HttpServletRequest request) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), request);
    }

    // --- 403 / 404 / 422 ----------------------------------------------------

    /** RN-03 y FR-018. 403 y no 404: fingir que no existe ocultaría el motivo real. */
    @ExceptionHandler(ForbiddenOperationException.class)
    public ResponseEntity<ErrorResponse> prohibido(
            ForbiddenOperationException ex, HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), request);
    }

    @ExceptionHandler({BookingNotFoundException.class, CourtNotFoundException.class})
    public ResponseEntity<ErrorResponse> noEncontrado(
            RuntimeException ex, HttpServletRequest request) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), request);
    }

    /** 422: la cancha existe pero no admite esta reserva (FR-011, FR-016). */
    @ExceptionHandler(CourtNotBookableException.class)
    public ResponseEntity<ErrorResponse> noReservable(
            CourtNotBookableException ex, HttpServletRequest request) {
        return build(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage(), request);
    }

    // --- 400 / 503 ----------------------------------------------------------

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> cuerpoInvalido(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        String detalle = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
        return build(HttpStatus.BAD_REQUEST, detalle, request);
    }

    @ExceptionHandler({
        MissingServletRequestParameterException.class,
        MethodArgumentTypeMismatchException.class,
        IllegalArgumentException.class
    })
    public ResponseEntity<ErrorResponse> peticionInvalida(
            Exception ex, HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * 401 — falta la cabecera de identidad. En producción no puede ocurrir: el
     * gateway la escribe siempre. Ocurre si alguien llama al puerto 8083
     * directo, y entonces 401 es exactamente lo que hay que decir.
     */
    @ExceptionHandler(MissingRequestHeaderException.class)
    public ResponseEntity<ErrorResponse> sinIdentidad(
            MissingRequestHeaderException ex, HttpServletRequest request) {
        return build(
                HttpStatus.UNAUTHORIZED,
                "Falta la cabecera de identidad " + ex.getHeaderName()
                        + "; esta API se consume a través del gateway.",
                request);
    }

    /** 503 — ms-canchas no responde y sin él no se puede validar la cancha. */
    @ExceptionHandler(RestClientException.class)
    public ResponseEntity<ErrorResponse> canchasCaido(
            RestClientException ex, HttpServletRequest request) {
        return build(
                HttpStatus.SERVICE_UNAVAILABLE,
                "El catálogo de canchas no está disponible en este momento. Inténtalo de nuevo.",
                request);
    }

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status, String message, HttpServletRequest request) {
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(), status.value(), status.getReasonPhrase(), message, request.getRequestURI());
        return ResponseEntity.status(status).body(body);
    }
}
