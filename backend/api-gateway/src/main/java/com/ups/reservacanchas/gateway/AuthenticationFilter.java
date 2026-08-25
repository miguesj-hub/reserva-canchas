package com.ups.reservacanchas.gateway;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Identifica al usuario en cada petición y se lo cuenta al microservicio
 * destino (R-003).
 *
 * Hace tres cosas, en este orden y por este motivo:
 *
 * 1. **Descarta toda cabecera X-User-* que venga del cliente.** Es lo que hace
 *    segura la confianza entre gateway y microservicios: un microservicio cree
 *    lo que dice X-User-Id precisamente porque nadie más puede escribirla. Si
 *    el borrado no fuera lo primero, cualquiera se declararía ADMINISTRADOR
 *    mandando una cabecera.
 * 2. Deja pasar sin credencial las dos rutas públicas de /api/auth — no puede
 *    exigir una sesión para las peticiones que sirven para crearla.
 * 3. Para todo lo demás, decodifica Authorization: Basic, lo verifica contra
 *    ms-usuarios y escribe X-User-Id y X-User-Role.
 *
 * Los microservicios no reciben nunca las credenciales del usuario y no
 * vuelven a autenticar: leen las dos cabeceras y aplican RN-03 y RN-07.
 */
@Component
public class AuthenticationFilter implements GlobalFilter, Ordered {

    /** Prefijo de las cabeceras de identidad que solo este filtro puede escribir. */
    static final String PREFIJO_IDENTIDAD = "x-user-";

    public static final String CABECERA_ID = "X-User-Id";
    public static final String CABECERA_ROL = "X-User-Role";

    /**
     * Las únicas dos rutas que no exigen credencial (contracts/README.md).
     * Se comparan por ruta exacta: un /api/auth/loginXYZ no entra por aquí.
     */
    private static final Set<String> RUTAS_PUBLICAS =
            Set.of("/api/auth/login", "/api/auth/registro");

    private static final String ESQUEMA_BASIC = "Basic ";

    private final WebClient usuarios;

    /**
     * El WebClient se construye aquí y no se inyecta: este proyecto trae el
     * starter del gateway, no el de WebFlux, así que no hay ningún
     * WebClient.Builder auto-configurado que pedir.
     */
    public AuthenticationFilter(@Value("${servicios.usuarios-url}") String usuariosUrl) {
        this.usuarios = WebClient.builder().baseUrl(usuariosUrl).build();
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest sinIdentidadFalsificada = exchange.getRequest().mutate()
                .headers(AuthenticationFilter::borrarCabecerasDeIdentidad)
                .build();

        String ruta = sinIdentidadFalsificada.getURI().getPath();
        if (RUTAS_PUBLICAS.contains(ruta)) {
            return chain.filter(exchange.mutate().request(sinIdentidadFalsificada).build());
        }

        String autorizacion = sinIdentidadFalsificada.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (autorizacion == null || !autorizacion.startsWith(ESQUEMA_BASIC)) {
            return Mono.error(new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Se requiere autenticación para esta operación."));
        }

        String[] credencial = decodificar(autorizacion);
        if (credencial == null) {
            return Mono.error(new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "La cabecera Authorization no es un Basic válido."));
        }

        return verificar(credencial[0], credencial[1]).flatMap(usuario -> {
            ServerHttpRequest identificada = sinIdentidadFalsificada.mutate()
                    .header(CABECERA_ID, String.valueOf(usuario.get("id")))
                    .header(CABECERA_ROL, String.valueOf(usuario.get("rol")))
                    .build();
            return chain.filter(exchange.mutate().request(identificada).build());
        });
    }

    /**
     * Verifica la credencial contra ms-usuarios, que es el único dueño de
     * usuarios_db (Principio IV): el gateway no consulta ninguna base.
     *
     * Reutiliza POST /api/auth/login, que ya sabe rechazar una credencial
     * equivocada (FR-003) y una cuenta inactiva (FR-005). El mensaje que
     * devuelve ms-usuarios se propaga tal cual, para que la pantalla pueda
     * distinguir "credencial incorrecta" de "cuenta inactiva".
     */
    private Mono<Map<String, Object>> verificar(String username, String password) {
        return usuarios.post()
                .uri("/api/auth/login")
                .bodyValue(Map.of("username", username, "password", password))
                .exchangeToMono(respuesta -> respuesta
                        .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                        .defaultIfEmpty(Map.of())
                        .flatMap(cuerpo -> {
                            if (respuesta.statusCode().is2xxSuccessful()) {
                                return Mono.just(cuerpo);
                            }
                            Object motivo = cuerpo.get("message");
                            return Mono.error(new ResponseStatusException(
                                    HttpStatus.UNAUTHORIZED,
                                    motivo != null ? motivo.toString() : "Credenciales inválidas."));
                        }));
    }

    /** Devuelve {usuario, contraseña}, o null si la cabecera no se puede leer. */
    private String[] decodificar(String cabeceraAutorizacion) {
        try {
            byte[] plano = Base64.getDecoder()
                    .decode(cabeceraAutorizacion.substring(ESQUEMA_BASIC.length()).trim());
            String texto = new String(plano, StandardCharsets.UTF_8);
            int separador = texto.indexOf(':');
            if (separador < 0) {
                return null;
            }
            // La contraseña puede contener ':', el usuario no: se parte por el primero.
            return new String[] {texto.substring(0, separador), texto.substring(separador + 1)};
        } catch (IllegalArgumentException noEsBase64) {
            return null;
        }
    }

    private static void borrarCabecerasDeIdentidad(HttpHeaders cabeceras) {
        List<String> falsificadas = cabeceras.headerNames().stream()
                .filter(nombre -> nombre.toLowerCase().startsWith(PREFIJO_IDENTIDAD))
                .toList();
        falsificadas.forEach(cabeceras::remove);
    }

    /**
     * Antes que cualquier filtro de enrutamiento: la identidad tiene que estar
     * resuelta —o la petición rechazada— antes de que salga hacia el destino.
     */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }
}
