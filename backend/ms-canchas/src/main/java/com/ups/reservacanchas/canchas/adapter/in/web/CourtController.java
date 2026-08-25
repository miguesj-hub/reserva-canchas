package com.ups.reservacanchas.canchas.adapter.in.web;

import com.ups.reservacanchas.canchas.application.port.in.CourtUseCase;
import com.ups.reservacanchas.canchas.domain.Sport;
import com.ups.reservacanchas.canchas.dto.CanchaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptador de entrada (web) del catálogo. Solo traduce HTTP ↔ DTO y delega en
 * el puerto de entrada.
 *
 * No comprueba el rol: la lectura del catálogo está abierta a cualquier usuario
 * autenticado (contracts/canchas.yaml), y de que esté autenticado se encarga el
 * gateway. La escritura, que sí exige ADMINISTRADOR (RN-07), llega con US2.
 */
@Tag(name = "canchas", description = "Catálogo (§3.3.4)")
@RestController
@RequestMapping("/api/canchas")
public class CourtController {

    private final CourtUseCase useCase;

    public CourtController(CourtUseCase useCase) {
        this.useCase = useCase;
    }

    @Operation(
            summary = "Listar canchas",
            description = "Si se omite `activa`, devuelve solo las activas (FR-011).")
    @ApiResponse(responseCode = "200", description = "Listado, sin paginación")
    @ApiResponse(responseCode = "400", description = "Deporte fuera de la enumeración")
    @GetMapping
    public List<CanchaResponse> listar(
            @RequestParam(required = false) Sport deporte,
            @RequestParam(required = false) Boolean activa) {
        return useCase.listar(deporte, activa);
    }

    @Operation(
            summary = "Consultar una cancha",
            description = "Lo consume ms-reservas por CourtClientPort antes de persistir una reserva.")
    @ApiResponse(responseCode = "200", description = "La cancha")
    @ApiResponse(responseCode = "404", description = "La cancha no existe")
    @GetMapping("/{id}")
    public CanchaResponse consultar(@PathVariable Long id) {
        return useCase.consultar(id);
    }
}
