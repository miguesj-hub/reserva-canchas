package com.ups.reservacanchas.usuarios.adapter.in.web;

import com.ups.reservacanchas.usuarios.application.port.in.UserUseCase;
import com.ups.reservacanchas.usuarios.dto.EstadoRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Gestión de usuarios (§3.1), separada de AuthController a propósito: aquello
 * son las dos únicas rutas públicas del sistema y esto exige ADMINISTRADOR.
 * Mezclarlas en un controlador obligaría a recordar cuál es cuál cada vez que
 * se añade un método.
 *
 * No decide nada: pasa el X-User-Role que escribió el gateway al puerto de
 * entrada, y FR-048 lo aplica UserService.
 */
@Tag(name = "usuarios", description = "Gestión de usuarios (§3.1) — solo ADMINISTRADOR")
@RestController
@RequestMapping("/api/usuarios")
public class UserController {

    private final UserUseCase useCase;

    public UserController(UserUseCase useCase) {
        this.useCase = useCase;
    }

    @Operation(summary = "Listar los usuarios registrados", description = "FR-045. Sin paginación.")
    @ApiResponse(responseCode = "200", description = "Listado completo")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar usuarios")
    @GetMapping
    public List<UsuarioResponse> listar(@RequestHeader("X-User-Role") String rol) {
        return useCase.listar(rol);
    }

    @Operation(summary = "Consultar un usuario")
    @ApiResponse(responseCode = "200", description = "El usuario")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar usuarios")
    @ApiResponse(responseCode = "404", description = "El usuario no existe")
    @GetMapping("/{id}")
    public UsuarioResponse consultar(
            @PathVariable Long id, @RequestHeader("X-User-Role") String rol) {
        return useCase.consultar(id, rol);
    }

    @Operation(
            summary = "Activar o inactivar un usuario",
            description = """
                    FR-046. Un usuario inactivo no puede iniciar sesión (FR-005), y el gateway
                    lo rechaza también si tenía la sesión abierta, porque verifica la credencial
                    en cada petición. Sus reservas se conservan: son de otro dominio y esta base
                    no las conoce (FR-047).""")
    @ApiResponse(responseCode = "200", description = "Estado actualizado")
    @ApiResponse(responseCode = "403", description = "El rol no permite gestionar usuarios")
    @ApiResponse(responseCode = "404", description = "El usuario no existe")
    @PatchMapping("/{id}/estado")
    public UsuarioResponse cambiarEstado(
            @PathVariable Long id,
            @Valid @RequestBody EstadoRequest request,
            @RequestHeader("X-User-Role") String rol) {
        return useCase.cambiarEstado(id, request.activo(), rol);
    }
}
