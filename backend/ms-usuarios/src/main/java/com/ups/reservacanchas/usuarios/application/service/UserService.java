package com.ups.reservacanchas.usuarios.application.service;

import com.ups.reservacanchas.usuarios.application.port.in.UserUseCase;
import com.ups.reservacanchas.usuarios.application.port.out.UserRepositoryPort;
import com.ups.reservacanchas.usuarios.domain.User;
import com.ups.reservacanchas.usuarios.domain.exception.InvalidCredentialsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserAlreadyExistsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserNotFoundException;
import com.ups.reservacanchas.usuarios.dto.LoginRequest;
import com.ups.reservacanchas.usuarios.dto.RegistroRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;
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

    private UsuarioResponse toResponse(User u) {
        return new UsuarioResponse(
                u.getId(), u.getUsername(), u.getNombre(), u.getRol(), u.isActivo());
    }
}
