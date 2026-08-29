package com.ups.reservacanchas.usuarios.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ups.reservacanchas.usuarios.application.port.out.UserRepositoryPort;
import com.ups.reservacanchas.usuarios.domain.Role;
import com.ups.reservacanchas.usuarios.domain.User;
import com.ups.reservacanchas.usuarios.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.usuarios.domain.exception.InvalidCredentialsException;
import com.ups.reservacanchas.usuarios.domain.exception.UserAlreadyExistsException;
import com.ups.reservacanchas.usuarios.dto.LoginRequest;
import com.ups.reservacanchas.usuarios.dto.RegistroRequest;
import com.ups.reservacanchas.usuarios.dto.UsuarioResponse;
import java.util.List;
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

    // --- Gestión de usuarios (FR-045, FR-046, FR-047, FR-048) --------------

    @Test
    void el_administrador_lista_los_usuarios_FR045() {
        when(repository.findAll()).thenReturn(List.of(
                usuarioGuardado("admin", "admin", Role.ADMINISTRADOR, true),
                usuarioGuardado("cliente1", "cliente1", Role.USUARIO_FINAL, true),
                usuarioGuardado("inactivo", "inactivo", Role.USUARIO_FINAL, false)));

        List<UsuarioResponse> usuarios = service.listar("ADMINISTRADOR");

        assertThat(usuarios).hasSize(3);
        // El listado incluye las inactivas: son justo las que hay que reactivar.
        assertThat(usuarios).anyMatch(u -> !u.activo());
    }

    @Test
    void un_usuario_final_no_lista_ni_gestiona_usuarios_FR048() {
        assertThatThrownBy(() -> service.listar("USUARIO_FINAL"))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("Solo un administrador");
        assertThatThrownBy(() -> service.consultar(1L, "USUARIO_FINAL"))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.cambiarEstado(1L, false, "USUARIO_FINAL"))
                .isInstanceOf(ForbiddenOperationException.class);

        // Ni siquiera se consulta el repositorio: la respuesta no depende de él.
        verify(repository, never()).findAll();
        verify(repository, never()).findById(any());
    }

    @Test
    void el_administrador_inactiva_una_cuenta_FR046() {
        User cliente = usuarioGuardado("cliente2", "cliente2", Role.USUARIO_FINAL, true);
        when(repository.findById(7L)).thenReturn(Optional.of(cliente));
        when(repository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UsuarioResponse response = service.cambiarEstado(7L, false, "ADMINISTRADOR");

        assertThat(response.activo()).isFalse();
        assertThat(response.username()).isEqualTo("cliente2");
    }

    @Test
    void inactivar_no_toca_nada_fuera_de_usuarios_db_FR047() {
        User cliente = usuarioGuardado("cliente2", "cliente2", Role.USUARIO_FINAL, true);
        when(repository.findById(7L)).thenReturn(Optional.of(cliente));
        when(repository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        service.cambiarEstado(7L, false, "ADMINISTRADOR");

        // Lo único que ocurre es un save sobre el propio usuario. Las reservas
        // viven en reservas_db, a la que este servicio ni siquiera puede
        // conectarse: la garantía de FR-047 es estructural, no una promesa que
        // alguien tenga que recordar. Este test fija que el servicio no gana
        // ninguna dependencia nueva por la que pudiera alcanzarlas.
        verify(repository).save(any(User.class));
        verify(repository, never()).existsByUsername(org.mockito.ArgumentMatchers.anyString());
        assertThat(cliente.getUsername()).isEqualTo("cliente2");
    }

    @Test
    void reactivar_devuelve_el_acceso_FR046() {
        User inactivo = usuarioGuardado("inactivo", "inactivo", Role.USUARIO_FINAL, false);
        when(repository.findById(4L)).thenReturn(Optional.of(inactivo));
        when(repository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.cambiarEstado(4L, true, "ADMINISTRADOR").activo()).isTrue();

        // Y con la cuenta activa, la misma credencial que antes fallaba ahora entra.
        when(repository.findByUsername("inactivo")).thenReturn(Optional.of(inactivo));
        assertThat(service.autenticar(new LoginRequest("inactivo", "inactivo")).username())
                .isEqualTo("inactivo");
    }

    @Test
    void rechaza_inactivar_una_cuenta_administradora() {
        User admin = usuarioGuardado("admin", "admin", Role.ADMINISTRADOR, true);
        when(repository.findById(7L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() -> service.cambiarEstado(7L, false, "ADMINISTRADOR"))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("ADMINISTRADOR");

        verify(repository, never()).save(any(User.class));
    }

    @Test
    void cambiar_el_estado_de_un_usuario_inexistente_da_404() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cambiarEstado(404L, false, "ADMINISTRADOR"))
                .isInstanceOf(com.ups.reservacanchas.usuarios.domain.exception.UserNotFoundException.class);
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
