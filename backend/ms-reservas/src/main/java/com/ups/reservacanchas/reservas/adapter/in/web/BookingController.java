package com.ups.reservacanchas.reservas.adapter.in.web;

import com.ups.reservacanchas.reservas.application.port.in.BookingUseCase;
import com.ups.reservacanchas.reservas.domain.BookingStatus;
import com.ups.reservacanchas.reservas.dto.DisponibilidadResponse;
import com.ups.reservacanchas.reservas.dto.ReservaRequest;
import com.ups.reservacanchas.reservas.dto.ReservaResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptador de entrada (web). Solo traduce HTTP ↔ DTO: no hay aquí ni un `if`
 * que decida si algo se permite —eso vive en BookingService, donde se puede
 * probar sin levantar Spring.
 *
 * La identidad llega en X-User-Id y X-User-Role, escritas por el gateway
 * después de verificar la credencial. Este servicio no autentica y no ve nunca
 * la contraseña del usuario; se fía de esas cabeceras precisamente porque el
 * gateway descarta las que manda el cliente.
 */
@Tag(name = "reservas", description = "Creación, consulta y cancelación (§3.3.2, §3.3.3)")
@RestController
@RequestMapping("/api/reservas")
public class BookingController {

    private final BookingUseCase useCase;

    public BookingController(BookingUseCase useCase) {
        this.useCase = useCase;
    }

    @Operation(
            summary = "Crear una reserva",
            description = "Solo USUARIO_FINAL (FR-018). El dueño es siempre quien la pide, tomado de X-User-Id.")
    @ApiResponse(responseCode = "201", description = "Reserva creada en estado CONFIRMADA (RN-08)")
    @ApiResponse(responseCode = "403", description = "Un ADMINISTRADOR no crea reservas")
    @ApiResponse(responseCode = "409", description = "Bloque ocupado (RN-02) o tope alcanzado (RN-06)")
    @ApiResponse(responseCode = "422", description = "La cancha no admite la reserva")
    @PostMapping
    public ResponseEntity<ReservaResponse> crear(
            @Valid @RequestBody ReservaRequest request,
            @RequestHeader("X-User-Id") Long usuarioId,
            @RequestHeader("X-User-Role") String rol) {
        return ResponseEntity.status(HttpStatus.CREATED).body(useCase.crear(request, usuarioId, rol));
    }

    @Operation(
            summary = "Consultar los bloques de una cancha en una fecha",
            description = "Devuelve todos los bloques del horario de atención, libres y ocupados (FR-008).")
    @ApiResponse(responseCode = "200", description = "Los bloques de esa cancha y fecha")
    @ApiResponse(responseCode = "404", description = "La cancha no existe")
    @GetMapping("/disponibilidad")
    public DisponibilidadResponse disponibilidad(
            @RequestParam Long canchaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return useCase.consultarDisponibilidad(canchaId, fecha);
    }

    @Operation(
            summary = "Listar las reservas propias",
            description = "El filtro es X-User-Id, no un parámetro: no hay forma de pedir las de otro (FR-025).")
    @ApiResponse(responseCode = "200", description = "Solo las reservas de quien pregunta")
    @GetMapping("/mias")
    public List<ReservaResponse> mias(
            @RequestHeader("X-User-Id") Long usuarioId,
            @RequestParam(required = false) BookingStatus estado) {
        return useCase.listarMias(usuarioId, estado);
    }

    @Operation(
            summary = "Cancelar una reserva",
            description = """
                    Una sola operación para ambos roles; la diferencia la aplica BookingService
                    leyendo X-User-Role (RN-03). Es un POST sobre un subrecurso y no un DELETE
                    porque la reserva no desaparece: cambia de estado.""")
    @ApiResponse(responseCode = "200", description = "Reserva cancelada, o ya lo estaba (FR-023)")
    @ApiResponse(responseCode = "403", description = "Un USUARIO_FINAL intenta cancelar una reserva ajena")
    @ApiResponse(responseCode = "404", description = "La reserva no existe")
    @ApiResponse(responseCode = "409", description = "La hora de inicio ya ocurrió (RN-04)")
    @PostMapping("/{id}/cancelacion")
    public ReservaResponse cancelar(
            @PathVariable Long id,
            @RequestHeader("X-User-Id") Long usuarioId,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.cancelar(id, usuarioId, rol);
    }
}
