package com.ups.reservacanchas.usuarios.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ups.reservacanchas.usuarios.application.port.out.UserRepositoryPort;
import com.ups.reservacanchas.usuarios.domain.Role;
import com.ups.reservacanchas.usuarios.domain.User;
import com.ups.reservacanchas.usuarios.domain.exception.InvalidCredentialsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserAlreadyExistsException;
import com.ups.reservacanchas.usuarios.dto.LoginRequest;
import com.ups.reservacanchas.usuarios.dto.RegistroRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * El caso de uso se prueba con el puerto de salida mockeado, sin Spring y sin
 * base de datos (Principio II). El PasswordEncoder es el real: con coste 4 el
 * hash tarda milisegundos, y probar contra el algoritmo de verdad es lo que
 * demuestra que la contraseña se guarda hasheada y no en claro.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    UserRepositoryPort repository;

    PasswordEncoder passwordEncoder;
    UserService service;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4);
        service = new UserService(repository, passwordEncoder);
    }

    private User usuarioGuardado(String username, String password, Role rol, boolean activo) {
        return new User(7L, username, "Nombre de Prueba", passwordEncoder.encode(password), rol, activo, null);
    }

    // --- Registro -----------------------------------------------------------

    @Test
    void registra_siempre_como_usuario_final_activo_FR001() {
        when(repository.existsByUsername("nuevo")).thenReturn(false);
        when(repository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse response = service.registrar(new RegistroRequest("nuevo", "Ana Pérez", "secreto123"));

        assertThat(response.rol()).isEqualTo(Role.USUARIO_FINAL);
        assertThat(response.activo()).isTrue();
        assertThat(response.username()).isEqualTo("nuevo");
    }

    @Test
    void registra_guardando_el_hash_y_nunca_la_contrasena_en_claro_FR001() {
        when(repository.existsByUsername("nuevo")).thenReturn(false);
        when(repository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        service.registrar(new RegistroRequest("nuevo", "Ana Pérez", "secreto123"));

        verify(repository).save(org.mockito.ArgumentMatchers.argThat(u ->
                !"secreto123".equals(u.getPasswordHash())
                        && passwordEncoder.matches("secreto123", u.getPasswordHash())));
    }

    @Test
    void rechaza_username_duplicado_FR002() {
        when(repository.existsByUsername("cliente1")).thenReturn(true);

        assertThatThrownBy(() -> service.registrar(new RegistroRequest("cliente1", "Otro", "secreto123")))
                .isInstanceOf(UserAlreadyExistsException.class)
                .hasMessageContaining("ya está registrado");

        verify(repository, never()).save(any(User.class));
    }

    // --- Autenticación ------------------------------------------------------

    @Test
    void autentica_credenciales_validas_FR003() {
        when(repository.findByUsername("cliente1"))
                .thenReturn(Optional.of(usuarioGuardado("cliente1", "cliente1", Role.USUARIO_FINAL, true)));

        UsuarioResponse response = service.autenticar(new LoginRequest("cliente1", "cliente1"));

        assertThat(response.id()).isEqualTo(7L);
        assertThat(response.rol()).isEqualTo(Role.USUARIO_FINAL);
    }

    @Test
    void rechaza_contrasena_incorrecta_sin_revelar_cual_dato_fallo_FR003() {
        when(repository.findByUsername("cliente1"))
                .thenReturn(Optional.of(usuarioGuardado("cliente1", "cliente1", Role.USUARIO_FINAL, true)));

        assertThatThrownBy(() -> service.autenticar(new LoginRequest("cliente1", "equivocada")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Usuario o contraseña incorrectos.");
    }

    @Test
    void rechaza_usuario_inexistente_con_el_mismo_mensaje_FR003() {
        when(repository.findByUsername("fantasma")).thenReturn(Optional.empty());

        // Mismo texto que el caso anterior: si difiriera, el login serviría para
        // averiguar qué usuarios están registrados.
        assertThatThrownBy(() -> service.autenticar(new LoginRequest("fantasma", "loquesea")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessage("Usuario o contraseña incorrectos.");
    }

    @Test
    void rechaza_cuenta_inactiva_aunque_la_credencial_sea_correcta_FR005() {
        when(repository.findByUsername("inactivo"))
                .thenReturn(Optional.of(usuarioGuardado("inactivo", "inactivo", Role.USUARIO_FINAL, false)));

        assertThatThrownBy(() -> service.autenticar(new LoginRequest("inactivo", "inactivo")))
                .isInstanceOf(InvalidCredentialsException.class)
                .hasMessageContaining("inactiva");
    }
}
