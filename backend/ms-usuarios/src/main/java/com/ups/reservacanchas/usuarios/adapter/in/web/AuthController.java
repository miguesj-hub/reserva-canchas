package com.ups.reservacanchas.usuarios.adapter.in.web;

import com.ups.reservacanchas.usuarios.application.port.in.UserUseCase;
import com.ups.reservacanchas.usuarios.dto.LoginRequest;
import com.ups.reservacanchas.usuarios.dto.RegistroRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Adaptador de entrada (web): solo traduce HTTP &lt;-&gt; DTO y delega en el
 * puerto de entrada. Depende de la interfaz UserUseCase, nunca de UserService.
 *
 * Las dos rutas son las únicas públicas del sistema: el AuthenticationFilter
 * del gateway las deja pasar sin credencial. Todo lo demás exige
 * Authorization: Basic (contracts/README.md § Autenticación y autorización).
 */
@Tag(name = "auth", description = "Rutas públicas. No requieren cabecera Authorization")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserUseCase useCase;

    public AuthController(UserUseCase useCase) {
        this.useCase = useCase;
    }

    @Operation(
            summary = "Registrar un usuario final",
            description = "Crea siempre un USUARIO_FINAL activo; el rol no se acepta como entrada (FR-001, FR-002).")
    @ApiResponse(responseCode = "201", description = "Usuario creado")
    @ApiResponse(responseCode = "400", description = "Cuerpo inválido")
    @ApiResponse(responseCode = "409", description = "El username ya pertenece a otra cuenta")
    @PostMapping("/registro")
    public ResponseEntity<UsuarioResponse> registro(@Valid @RequestBody RegistroRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(useCase.registrar(request));
    }

    @Operation(
            summary = "Verificar credenciales y obtener la identidad de la sesión",
            description = "No emite ningún token (R-003): la autenticación posterior es HTTP Basic.")
    @ApiResponse(responseCode = "200", description = "Credenciales válidas y cuenta activa")
    @ApiResponse(responseCode = "401", description = "Credenciales inválidas o cuenta inactiva")
    @PostMapping("/login")
    public UsuarioResponse login(@Valid @RequestBody LoginRequest request) {
        return useCase.autenticar(request);
    }
}
