package com.ups.reservacanchas.canchas.adapter.in.web;

import com.ups.reservacanchas.canchas.application.port.in.CourtUseCase;
import com.ups.reservacanchas.canchas.domain.Sport;
import com.ups.reservacanchas.canchas.dto.BloqueoRequest;
import com.ups.reservacanchas.canchas.dto.BloqueoResponse;
import com.ups.reservacanchas.canchas.dto.CanchaRequest;
import com.ups.reservacanchas.canchas.dto.CanchaResponse;
import com.ups.reservacanchas.canchas.dto.EstadoRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptador de entrada (web) del catálogo. Solo traduce HTTP ↔ DTO y delega en
 * el puerto de entrada.
 *
 * No comprueba el rol ni siquiera en la escritura: se limita a pasar el
 * X-User-Role que escribió el gateway al puerto de entrada. RN-07 se aplica en
 * CourtService, porque decidir quién puede tocar el catálogo es una decisión de
 * negocio y aquí no se podría probar sin levantar Spring.
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

    // --- Escritura del catálogo: solo ADMINISTRADOR (RN-07) --------------

    @Operation(summary = "Crear una cancha", description = "Implementa FR-029. Solo ADMINISTRADOR (RN-07).")
    @ApiResponse(responseCode = "201", description = "Cancha creada")
    @ApiResponse(responseCode = "400", description = "Cuerpo inválido, o cierre no posterior a la apertura")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar el catálogo")
    @PostMapping
    public ResponseEntity<CanchaResponse> crear(
            @Valid @RequestBody CanchaRequest request,
            @RequestHeader("X-User-Role") String rol) {
        return ResponseEntity.status(HttpStatus.CREATED).body(useCase.crear(request, rol));
    }

    @Operation(
            summary = "Editar una cancha",
            description = "Implementa FR-030, incluido el horario: cambiarlo cambia los bloques ofrecidos.")
    @ApiResponse(responseCode = "200", description = "Cancha actualizada")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar el catálogo")
    @ApiResponse(responseCode = "404", description = "La cancha no existe")
    @PutMapping("/{id}")
    public CanchaResponse editar(
            @PathVariable Long id,
            @Valid @RequestBody CanchaRequest request,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.editar(id, request, rol);
    }

    @Operation(
            summary = "Activar o inactivar una cancha",
            description = "Implementa FR-031. Una cancha inactiva no se ofrece, pero sus reservas se conservan (FR-032).")
    @ApiResponse(responseCode = "200", description = "Estado actualizado")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar el catálogo")
    @ApiResponse(responseCode = "404", description = "La cancha no existe")
    @PatchMapping("/{id}/estado")
    public CanchaResponse cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody EstadoRequest request,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.cambiarEstado(id, request.activa(), rol);
    }

    // --- Bloqueos de mantenimiento ---------------------------------------

    @Operation(
            summary = "Listar los bloqueos de mantenimiento de una cancha",
            description = "Lo consume ms-reservas para descontar bloques de la disponibilidad (FR-010).")
    @ApiResponse(responseCode = "200", description = "Bloqueos vigentes en el rango")
    @ApiResponse(responseCode = "404", description = "La cancha no existe")
    @GetMapping("/{id}/bloqueos")
    public List<BloqueoResponse> listarBloqueos(
            @PathVariable Long id,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return useCase.listarBloqueos(id, desde, hasta);
    }

    @Operation(
            summary = "Registrar un bloqueo de mantenimiento",
            description = "Implementa FR-034. Impide reservas nuevas, pero no cancela las existentes (§3.3.3).")
    @ApiResponse(responseCode = "201", description = "Bloqueo registrado")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar el catálogo")
    @ApiResponse(responseCode = "404", description = "La cancha no existe")
    @ApiResponse(responseCode = "409", description = "Ya hay un bloqueo solapado en ese rango")
    @PostMapping("/{id}/bloqueos")
    public ResponseEntity<BloqueoResponse> registrarBloqueo(
            @PathVariable Long id,
            @Valid @RequestBody BloqueoRequest request,
            @RequestHeader("X-User-Role") String rol) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(useCase.registrarBloqueo(id, request, rol));
    }

    @Operation(summary = "Retirar un bloqueo de mantenimiento")
    @ApiResponse(responseCode = "204", description = "Bloqueo retirado")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar el catálogo")
    @ApiResponse(responseCode = "404", description = "El bloqueo no existe")
    @DeleteMapping("/{id}/bloqueos/{bloqueoId}")
    public ResponseEntity<Void> retirarBloqueo(
            @PathVariable Long id,
            @PathVariable Long bloqueoId,
            @RequestHeader("X-User-Role") String rol) {
        useCase.retirarBloqueo(id, bloqueoId, rol);
        return ResponseEntity.noContent().build();
    }
}
