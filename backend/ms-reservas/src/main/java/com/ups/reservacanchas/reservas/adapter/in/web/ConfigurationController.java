package com.ups.reservacanchas.reservas.adapter.in.web;

import com.ups.reservacanchas.reservas.application.port.in.ConfigurationUseCase;
import com.ups.reservacanchas.reservas.dto.ConfiguracionRequest;
import com.ups.reservacanchas.reservas.dto.ConfiguracionResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptador de entrada de la configuración de la política de reservas
 * (feature 002, US2). Contrato:
 * `specs/002-brechas-auditoria-alcance/contracts/reservas-configuracion.yaml`.
 *
 * Igual que BookingController: solo traduce HTTP ↔ DTO. La comprobación de rol
 * vive en ConfigurationService, donde se prueba sin levantar Spring.
 */
@Tag(name = "configuracion", description = "Parámetros de la política de reservas (RN-06)")
@RestController
@RequestMapping("/api/reservas/configuracion")
public class ConfigurationController {

    private final ConfigurationUseCase useCase;

    public ConfigurationController(ConfigurationUseCase useCase) {
        this.useCase = useCase;
    }

    @Operation(
            summary = "Consultar el tope de reservas activas simultáneas",
            description = "FR-052. Solo ADMINISTRADOR (FR-056).")
    @ApiResponse(responseCode = "200", description = "El tope vigente")
    @ApiResponse(responseCode = "403", description = "Un usuario final no consulta el tope")
    @GetMapping
    public ConfiguracionResponse consultar(@RequestHeader("X-User-Role") String rol) {
        return useCase.consultar(rol);
    }

    @Operation(
            summary = "Cambiar el tope de reservas activas simultáneas",
            description = """
                    FR-053 a FR-056. El valor nuevo rige para las reservas que se creen a partir \
                    de la respuesta, sin reiniciar ni redesplegar: la clave se lee en cada \
                    creación. No es retroactivo: las reservas ya confirmadas de un usuario que \
                    supere un tope recién reducido se conservan (FR-055).""")
    @ApiResponse(responseCode = "200", description = "El tope ya actualizado")
    @ApiResponse(responseCode = "400", description = "El tope no es un entero mayor o igual a 1")
    @ApiResponse(responseCode = "403", description = "Un usuario final no cambia el tope")
    @PutMapping
    public ConfiguracionResponse cambiar(
            @Valid @RequestBody ConfiguracionRequest request,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.cambiarTope(request.maxReservasActivas(), rol);
    }
}
