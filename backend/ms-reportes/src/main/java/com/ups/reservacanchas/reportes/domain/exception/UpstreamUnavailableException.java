package com.ups.reservacanchas.reportes.domain.exception;

/**
 * ms-reservas o ms-canchas no responde. Se traduce a 503.
 *
 * El reporte no se calcula y se dice, en lugar de devolver ceros: un cero que
 * significa "no pude preguntar" y un cero que significa "no hubo reservas" son
 * indistinguibles en pantalla, y el segundo es una respuesta legítima.
 */
public class UpstreamUnavailableException extends RuntimeException {

    public UpstreamUnavailableException(String message, Throwable causa) {
        super(message, causa);
    }
}
