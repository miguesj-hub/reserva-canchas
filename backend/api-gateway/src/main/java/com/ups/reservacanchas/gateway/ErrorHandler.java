package com.ups.reservacanchas.gateway;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.boot.webflux.error.ErrorWebExceptionHandler;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import tools.jackson.databind.ObjectMapper;

/**
 * Traduce a HTTP lo que falla dentro del gateway, con el mismo cuerpo de error
 * uniforme que producen los cuatro microservicios (contracts/README.md). Sin
 * esto, una credencial ausente y un servicio caído llegan al navegador como
 * dos 500 indistinguibles y la pantalla no puede decir nada útil.
 *
 * Va antes que el manejador por defecto de WebFlux (@Order), que respondería
 * con su propio formato.
 *
 * No es un @RestControllerAdvice: en el gateway el fallo ocurre en un filtro,
 * no en un controlador, así que nunca pasaría por un advice.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ErrorHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper;

    public ErrorHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        HttpStatus estado = estadoDe(ex);
        String mensaje = mensajeDe(ex, estado);

        exchange.getResponse().setStatusCode(estado);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> cuerpo = new LinkedHashMap<>();
        cuerpo.put("timestamp", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        cuerpo.put("status", estado.value());
        cuerpo.put("error", estado.getReasonPhrase());
        cuerpo.put("message", mensaje);
        cuerpo.put("path", exchange.getRequest().getURI().getPath());

        DataBuffer buffer = exchange.getResponse().bufferFactory()
                .wrap(objectMapper.writeValueAsBytes(cuerpo));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    private HttpStatus estadoDe(Throwable ex) {
        // 401: credencial ausente, ilegible, inválida o cuenta inactiva. Lo
        // levanta AuthenticationFilter.
        if (ex instanceof ResponseStatusException rse) {
            HttpStatus resuelto = HttpStatus.resolve(rse.getStatusCode().value());
            return resuelto != null ? resuelto : HttpStatus.INTERNAL_SERVER_ERROR;
        }
        // 503: el servicio destino no acepta la conexión. Distinguirlo de un
        // 500 es lo que le permite a la pantalla decir "vuelve a intentarlo"
        // en lugar de "algo se rompió".
        if (ex instanceof WebClientRequestException || ex instanceof java.net.ConnectException) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }
        if (ex instanceof IOException) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        }
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private String mensajeDe(Throwable ex, HttpStatus estado) {
        if (ex instanceof ResponseStatusException rse && rse.getReason() != null) {
            return rse.getReason();
        }
        if (estado == HttpStatus.SERVICE_UNAVAILABLE) {
            return "El servicio no está disponible en este momento. Inténtelo de nuevo.";
        }
        return "Error inesperado en la pasarela.";
    }
}
