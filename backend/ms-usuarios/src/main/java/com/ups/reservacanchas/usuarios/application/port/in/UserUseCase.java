package com.ups.reservacanchas.usuarios.application.port.in;

import com.ups.reservacanchas.usuarios.dto.LoginRequest;
import com.ups.reservacanchas.usuarios.dto.RegistroRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;
import java.util.List;

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

    // --- Gestión de usuarios: solo ADMINISTRADOR (FR-048) ------------------
    //
    // El rol llega como parámetro explícito, desde X-User-Role. Pasarlo por la
    // firma es lo que permite probar FR-048 sin levantar Spring.

    /** FR-045: el listado completo, sin paginación. */
    List<UsuarioResponse> listar(String rol);

    /** FR-045: el detalle de un usuario, para la pantalla de gestión. */
    UsuarioResponse consultar(Long id, String rol);

    /**
     * FR-046: activa o inactiva una cuenta. Un usuario inactivo no puede
     * iniciar sesión (FR-005) y sus reservas se conservan (FR-047).
     */
    UsuarioResponse cambiarEstado(Long id, boolean activo, String rol);
}
