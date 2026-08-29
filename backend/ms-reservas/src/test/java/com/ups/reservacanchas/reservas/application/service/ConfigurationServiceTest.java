package com.ups.reservacanchas.reservas.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ups.reservacanchas.reservas.application.port.out.ConfigurationRepositoryPort;
import com.ups.reservacanchas.reservas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.reservas.dto.ConfiguracionResponse;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Configuración del tope de RN-06 (feature 002, US2), con el puerto de salida
 * mockeado: sin Spring y sin base de datos (Principio II).
 *
 * Aquí NO se prueba que el tope se aplique —eso es RN-06 y vive en
 * BookingServiceCreacionTest, que es donde está la regla—. Aquí se prueba quién
 * puede cambiar el parámetro y qué valores se admiten.
 */
@ExtendWith(MockitoExtension.class)
class ConfigurationServiceTest {

    private static final String CLAVE = "max_reservas_activas";
    private static final String ADMIN = "ADMINISTRADOR";
    private static final String CLIENTE = "USUARIO_FINAL";

    @Mock ConfigurationRepositoryPort configuracion;

    ConfigurationService service;

    @BeforeEach
    void setUp() {
        service = new ConfigurationService(configuracion);
    }

    // --- FR-052: lectura ----------------------------------------------------

    @Test
    void devuelve_el_tope_vigente_FR052() {
        when(configuracion.valorDe(CLAVE)).thenReturn(Optional.of("5"));

        assertThat(service.consultar(ADMIN)).isEqualTo(new ConfiguracionResponse(5));
    }

    @Test
    void sin_la_clave_devuelve_el_mismo_valor_por_defecto_que_aplica_la_regla() {
        when(configuracion.valorDe(CLAVE)).thenReturn(Optional.empty());

        // 3, el mismo que usa BookingService.verificarTope. Mostrar otro sería
        // enseñar en pantalla un tope distinto del que el sistema aplica.
        assertThat(service.consultar(ADMIN).maxReservasActivas()).isEqualTo(3);
    }

    @Test
    void con_la_clave_corrupta_devuelve_el_valor_por_defecto_y_no_revienta() {
        when(configuracion.valorDe(CLAVE)).thenReturn(Optional.of("no-es-un-numero"));

        assertThat(service.consultar(ADMIN).maxReservasActivas()).isEqualTo(3);
    }

    // --- FR-053: cambio -----------------------------------------------------

    @Test
    void cambia_el_tope_y_lo_persiste_FR053() {
        assertThat(service.cambiarTope(1, ADMIN)).isEqualTo(new ConfiguracionResponse(1));

        verify(configuracion).guardar(CLAVE, "1");
    }

    // --- FR-054: validación -------------------------------------------------

    @Test
    void rechaza_un_tope_de_cero_y_no_toca_el_vigente_FR054() {
        assertThatThrownBy(() -> service.cambiarTope(0, ADMIN))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("mayor o igual a 1");

        verify(configuracion, never()).guardar(ArgumentMatchers.anyString(), ArgumentMatchers.anyString());
    }

    @Test
    void rechaza_un_tope_negativo_y_no_toca_el_vigente_FR054() {
        assertThatThrownBy(() -> service.cambiarTope(-3, ADMIN))
                .isInstanceOf(IllegalArgumentException.class);

        verify(configuracion, never()).guardar(ArgumentMatchers.anyString(), ArgumentMatchers.anyString());
    }

    // --- FR-056: rol --------------------------------------------------------

    @Test
    void un_usuario_final_no_consulta_el_tope_FR056() {
        assertThatThrownBy(() -> service.consultar(CLIENTE))
                .isInstanceOf(ForbiddenOperationException.class);
    }

    @Test
    void un_usuario_final_no_cambia_el_tope_y_no_se_persiste_nada_FR056() {
        assertThatThrownBy(() -> service.cambiarTope(1, CLIENTE))
                .isInstanceOf(ForbiddenOperationException.class);

        verify(configuracion, never()).guardar(ArgumentMatchers.anyString(), ArgumentMatchers.anyString());
    }

    @Test
    void sin_rol_tampoco_FR056() {
        assertThatThrownBy(() -> service.consultar(null))
                .isInstanceOf(ForbiddenOperationException.class);
    }
}
