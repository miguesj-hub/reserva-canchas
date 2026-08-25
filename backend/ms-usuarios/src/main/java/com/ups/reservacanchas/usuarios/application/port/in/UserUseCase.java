package com.ups.reservacanchas.usuarios.application.port.in;

import com.ups.reservacanchas.usuarios.dto.LoginRequest;
import com.ups.reservacanchas.usuarios.dto.RegistroRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;

/**
 * Puerto de entrada: lo que el mundo exterior puede pedirle al dominio.
 * AuthController (adapter.in.web) conoce solo esta interfaz, nunca la
 * implementación (UserService).
 */
public interface UserUseCase {

    /** Alta pública. Siempre USUARIO_FINAL y activo (FR-001); rechaza duplicados (FR-002). */
    UsuarioResponse registrar(RegistroRequest request);

    /**
     * Verifica credenciales y devuelve la identidad de la sesión.
     * Lanza InvalidCredentialsException si la credencial no sirve (FR-003) o si
     * la cuenta está inactiva (FR-005).
     */
    UsuarioResponse autenticar(LoginRequest request);

    /** Consulta por identificador. Lanza UserNotFoundException si no existe. */
    UsuarioResponse consultar(Long id);
}
