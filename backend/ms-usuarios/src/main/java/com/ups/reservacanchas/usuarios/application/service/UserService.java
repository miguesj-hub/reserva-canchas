package com.ups.reservacanchas.usuarios.application.service;

import com.ups.reservacanchas.usuarios.application.port.in.UserUseCase;
import com.ups.reservacanchas.usuarios.application.port.out.UserRepositoryPort;
import com.ups.reservacanchas.usuarios.domain.Role;
import com.ups.reservacanchas.usuarios.domain.User;
import com.ups.reservacanchas.usuarios.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.usuarios.domain.exception.InvalidCredentialsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserAlreadyExistsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserNotFoundException;
import com.ups.reservacanchas.usuarios.dto.LoginRequest;
import com.ups.reservacanchas.usuarios.dto.RegistroRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;
import java.util.List;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Implementa el caso de uso. Depende solo del puerto de salida (interfaz) y
 * del algoritmo de hash, nunca de Spring Data ni de JPA: quien cablea la
 * implementación (UserRepositoryAdapter) lo resuelve.
 *
 * PasswordEncoder es una interfaz de spring-security-crypto, una librería de
 * criptografía sin contenedor ni servidor detrás — el equivalente a usar
 * java.time. No arrastra org.springframework.web ni JPA, que es lo que el
 * Principio III prohíbe aquí.
 */
@Service
public class UserService implements UserUseCase {

    /**
     * Mismo texto para "ese usuario no existe" y para "esa contraseña no es":
     * FR-003 exige no revelar cuál de los dos datos falló, porque hacerlo
     * convierte el login en un detector de usuarios registrados.
     */
    private static final String CREDENCIAL_INVALIDA = "Usuario o contraseña incorrectos.";

    /** El rol llega en X-User-Role, escrito por el gateway. Aquí solo se lee. */
    private static final String ROL_ADMINISTRADOR = "ADMINISTRADOR";

    private final UserRepositoryPort repository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepositoryPort repository, PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UsuarioResponse registrar(RegistroRequest request) {
        // FR-002: el username identifica la cuenta, así que no puede repetirse.
        if (repository.existsByUsername(request.username())) {
            throw new UserAlreadyExistsException(
                    "El usuario '" + request.username() + "' ya está registrado.");
        }
        // FR-001: el rol y el estado no se aceptan como entrada. El constructor
        // de un solo argumento de User es el que fija USUARIO_FINAL y activo.
        User nuevo = new User(
                request.username(), request.nombre(), passwordEncoder.encode(request.password()));
        return toResponse(repository.save(nuevo));
    }

    @Override
    public UsuarioResponse autenticar(LoginRequest request) {
        User user = repository.findByUsername(request.username())
                .orElseThrow(() -> new InvalidCredentialsException(CREDENCIAL_INVALIDA));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException(CREDENCIAL_INVALIDA);
        }

        // El estado se comprueba DESPUÉS de la contraseña, no antes: al revés,
        // quien no conoce la credencial podría averiguar qué cuentas existen y
        // están inactivas. Aquí el motivo sí se dice, porque a estas alturas ya
        // demostró ser el dueño de la cuenta (FR-005).
        if (!user.isActivo()) {
            throw new InvalidCredentialsException(
                    "La cuenta está inactiva. Contacte al administrador.");
        }

        return toResponse(user);
    }

    @Override
    public UsuarioResponse consultar(Long id) {
        User user = repository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("El usuario " + id + " no existe."));
        return toResponse(user);
    }

    // --- Gestión de usuarios (FR-045, FR-046, FR-048) ---------------------

    @Override
    public List<UsuarioResponse> listar(String rol) {
        exigirAdministrador(rol, "consultar el listado de usuarios");
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @Override
    public UsuarioResponse consultar(Long id, String rol) {
        exigirAdministrador(rol, "consultar una cuenta ajena");
        return consultar(id);
    }

    @Override
    public UsuarioResponse cambiarEstado(Long id, boolean activo, String rol) {
        exigirAdministrador(rol, "activar o inactivar cuentas");
        User user = repository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("El usuario " + id + " no existe."));

        // Una cuenta ADMINISTRADOR nunca se inactiva desde este endpoint: si se
        // bloqueara la única cuenta con ese rol, nadie podría volver a activarla
        // ni gestionar el resto del panel. Reactivar sigue permitido: no hay
        // forma de que este chequeo deje a un administrador fuera por error.
        if (!activo && user.getRol() == Role.ADMINISTRADOR) {
            throw new ForbiddenOperationException(
                    "No se puede inactivar una cuenta con rol ADMINISTRADOR.");
        }

        // FR-047: inactivar NO toca las reservas del usuario. Ni siquiera
        // podría: viven en reservas_db, una base a la que este servicio no
        // tiene acceso. La independencia de datos convierte esa garantía en
        // algo estructural, no en una promesa que alguien deba recordar.
        user.cambiarEstado(activo);
        return toResponse(repository.save(user));
    }

    /** FR-048: la gestión de usuarios es exclusiva del administrador. */
    private void exigirAdministrador(String rol, String operacion) {
        if (!ROL_ADMINISTRADOR.equals(rol)) {
            throw new ForbiddenOperationException("Solo un administrador puede " + operacion + ".");
        }
    }

    private UsuarioResponse toResponse(User u) {
        return new UsuarioResponse(
                u.getId(), u.getUsername(), u.getNombre(), u.getRol(), u.isActivo());
    }
}
