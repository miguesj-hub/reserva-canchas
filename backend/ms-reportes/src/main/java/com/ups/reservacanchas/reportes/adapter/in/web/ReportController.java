package com.ups.reservacanchas.reportes.adapter.in.web;

import com.ups.reservacanchas.reportes.application.port.in.ReportUseCase;
import com.ups.reservacanchas.reportes.dto.Cancelaciones;
import com.ups.reservacanchas.reportes.dto.OcupacionCancha;
import com.ups.reservacanchas.reportes.dto.RankingDemanda;
import com.ups.reservacanchas.reportes.dto.ReservasPorPeriodo;
import com.ups.reservacanchas.reportes.dto.Resumen;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptador de entrada (web). Traduce HTTP ↔ DTO y pasa el X-User-Role que
 * escribió el gateway; no decide nada. FR-043 lo aplica ReportService.
 */
@Tag(name = "reportes", description = "Los cuatro indicadores de §3.3.5")
@RestController
@RequestMapping("/api/reportes")
public class ReportController {

    private final ReportUseCase useCase;

    public ReportController(ReportUseCase useCase) {
        this.useCase = useCase;
    }

    @Operation(
            summary = "Indicador 1 — reservas por cancha y por deporte",
            description = "FR-038. Cuenta CONFIRMADAS y FINALIZADAS cuyo bloque cae en el rango.")
    @ApiResponse(responseCode = "200", description = "Conteos por cancha y por deporte")
    @ApiResponse(responseCode = "400", description = "Rango ausente o invertido")
    @ApiResponse(responseCode = "403", description = "El módulo de reportes es solo del administrador")
    @ApiResponse(responseCode = "503", description = "ms-reservas o ms-canchas no responde")
    @GetMapping("/reservas")
    public ReservasPorPeriodo reservas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.reservas(desde, hasta, rol);
    }

    @Operation(
            summary = "Indicador 2 — porcentaje de ocupación por cancha",
            description = "FR-039. Horas reservadas sobre horas del horario de atención. Una cancha sin reservas aparece con 0 %.")
    @GetMapping("/ocupacion")
    public List<OcupacionCancha> ocupacion(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.ocupacion(desde, hasta, rol);
    }

    @Operation(
            summary = "Indicador 3 — cancelaciones del período",
            description = "FR-040. Por fecha de cancelación, no por la del bloque.")
    @GetMapping("/cancelaciones")
    public Cancelaciones cancelaciones(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.cancelaciones(desde, hasta, rol);
    }

    @Operation(
            summary = "Indicador 4 — ranking de canchas por demanda",
            description = "FR-041. Todas las canchas de mayor a menor, incluidas las de cero, con los dos extremos señalados.")
    @GetMapping("/demanda")
    public RankingDemanda demanda(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.demanda(desde, hasta, rol);
    }

    @Operation(
            summary = "Los cuatro indicadores en una sola respuesta",
            description = "Conveniencia para el panel del administrador (R-005). No es un quinto indicador.")
    @GetMapping("/resumen")
    public Resumen resumen(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.resumen(desde, hasta, rol);
    }
}
