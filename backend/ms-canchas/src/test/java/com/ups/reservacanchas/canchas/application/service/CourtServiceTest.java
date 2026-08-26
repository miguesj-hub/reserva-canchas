package com.ups.reservacanchas.canchas.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.ups.reservacanchas.canchas.application.port.out.CourtRepositoryPort;
import com.ups.reservacanchas.canchas.domain.Court;
import com.ups.reservacanchas.canchas.domain.MaintenanceBlock;
import com.ups.reservacanchas.canchas.domain.OpeningHours;
import com.ups.reservacanchas.canchas.domain.Sport;
import com.ups.reservacanchas.canchas.domain.exception.CourtNotFoundException;
import com.ups.reservacanchas.canchas.domain.exception.ForbiddenOperationException;
import com.ups.reservacanchas.canchas.domain.exception.MaintenanceBlockOverlapException;
import com.ups.reservacanchas.canchas.dto.BloqueoRequest;
import com.ups.reservacanchas.canchas.dto.CanchaRequest;
import com.ups.reservacanchas.canchas.dto.CanchaResponse;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * RN-07 y las reglas del catálogo, con el puerto de salida mockeado: sin Spring
 * y sin base de datos (Principio II).
 */
@ExtendWith(MockitoExtension.class)
class CourtServiceTest {

    private static final String ADMIN = "ADMINISTRADOR";
    private static final String CLIENTE = "USUARIO_FINAL";

    @Mock CourtRepositoryPort repository;

    CourtService service;

    @BeforeEach
    void setUp() {
        service = new CourtService(repository);
    }

    private CanchaRequest peticion(String apertura, String cierre) {
        return new CanchaRequest("Pádel 3 — Nueva", Sport.PADEL, apertura, cierre, null);
    }

    private Court canchaExistente(boolean activa) {
        return new Court(
                9L, "Pádel 3", Sport.PADEL,
                new OpeningHours(LocalTime.of(7, 0), LocalTime.of(22, 0)), activa);
    }

    // --- RN-07: solo el administrador gestiona el catálogo ------------------

    @Test
    void el_administrador_crea_una_cancha_RN07() {
        when(repository.save(any(Court.class))).thenAnswer(inv -> inv.getArgument(0));

        CanchaResponse response = service.crear(peticion("07:00", "22:00"), ADMIN);

        assertThat(response.nombre()).isEqualTo("Pádel 3 — Nueva");
        assertThat(response.deporte()).isEqualTo(Sport.PADEL);
        assertThat(response.horaApertura()).isEqualTo("07:00");
        assertThat(response.horaCierre()).isEqualTo("22:00");
        // El contrato marca `activa` con default true: omitirlo la crea activa.
        assertThat(response.activa()).isTrue();
    }

    @Test
    void un_usuario_final_no_crea_canchas_RN07() {
        assertThatThrownBy(() -> service.crear(peticion("07:00", "22:00"), CLIENTE))
                .isInstanceOf(ForbiddenOperationException.class)
                .hasMessageContaining("Solo un administrador");

        verify(repository, never()).save(any(Court.class));
    }

    @Test
    void un_usuario_final_no_edita_ni_inactiva_ni_bloquea_RN07() {
        // Las cuatro operaciones de escritura comparten la misma puerta; si
        // alguna se saltara la comprobación, este test lo detecta.
        assertThatThrownBy(() -> service.editar(9L, peticion("07:00", "22:00"), CLIENTE))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.cambiarEstado(9L, false, CLIENTE))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.registrarBloqueo(
                        9L, new BloqueoRequest(LocalDateTime.now(), LocalDateTime.now().plusHours(2), "obra"), CLIENTE))
                .isInstanceOf(ForbiddenOperationException.class);
        assertThatThrownBy(() -> service.retirarBloqueo(9L, 1L, CLIENTE))
                .isInstanceOf(ForbiddenOperationException.class);

        // Ni siquiera se consulta el repositorio: la respuesta no depende de él.
        verify(repository, never()).findById(anyLong());
        verify(repository, never()).save(any(Court.class));
    }

    // --- Horario -----------------------------------------------------------

    @Test
    void rechaza_un_horario_que_cierra_antes_de_abrir() {
        // La invariante vive en OpeningHours, no repartida por el servicio.
        assertThatThrownBy(() -> service.crear(peticion("22:00", "07:00"), ADMIN))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("posterior");

        verify(repository, never()).save(any(Court.class));
    }

    @Test
    void rechaza_un_horario_de_duracion_cero() {
        assertThatThrownBy(() -> service.crear(peticion("10:00", "10:00"), ADMIN))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void editar_cambia_el_horario_que_delimita_los_bloques_FR030() {
        when(repository.findById(9L)).thenReturn(Optional.of(canchaExistente(true)));
        when(repository.save(any(Court.class))).thenAnswer(inv -> inv.getArgument(0));

        CanchaResponse response = service.editar(9L, peticion("09:00", "20:00"), ADMIN);

        assertThat(response.horaApertura()).isEqualTo("09:00");
        assertThat(response.horaCierre()).isEqualTo("20:00");
    }

    // --- Inactivación (FR-031, FR-032) --------------------------------------

    @Test
    void inactivar_conserva_la_cancha_FR032() {
        when(repository.findById(9L)).thenReturn(Optional.of(canchaExistente(true)));
        when(repository.save(any(Court.class))).thenAnswer(inv -> inv.getArgument(0));

        CanchaResponse response = service.cambiarEstado(9L, false, ADMIN);

        // Deja de ofrecerse, pero sigue existiendo con su id y su nombre: no se
        // borra ni se cancela nada.
        assertThat(response.activa()).isFalse();
        assertThat(response.id()).isEqualTo(9L);
        assertThat(response.nombre()).isEqualTo("Pádel 3");
        verify(repository, never()).deleteBloqueo(anyLong());
    }

    @Test
    void el_listado_por_defecto_solo_trae_las_activas_FR011() {
        when(repository.buscar(null, Boolean.TRUE)).thenReturn(List.of(canchaExistente(true)));

        assertThat(service.listar(null, null)).hasSize(1);

        // Lo decide el servicio, no el controlador: la regla no puede depender
        // de por dónde entre la petición.
        verify(repository).buscar(null, Boolean.TRUE);
    }

    @Test
    void una_cancha_inexistente_da_404() {
        when(repository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.consultar(404L))
                .isInstanceOf(CourtNotFoundException.class);
    }

    // --- Bloqueos de mantenimiento (FR-034) ---------------------------------

    @Test
    void registra_un_bloqueo_sin_cancelar_las_reservas_existentes_FR034() {
        LocalDateTime desde = LocalDateTime.of(2026, 9, 20, 8, 0);
        LocalDateTime hasta = LocalDateTime.of(2026, 9, 20, 14, 0);
        when(repository.existsById(9L)).thenReturn(true);
        when(repository.buscarBloqueos(9L, desde, hasta)).thenReturn(List.of());
        when(repository.saveBloqueo(any(MaintenanceBlock.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.registrarBloqueo(9L, new BloqueoRequest(desde, hasta, "Repintado"), ADMIN);

        assertThat(response.desde()).isEqualTo(desde);
        assertThat(response.motivo()).isEqualTo("Repintado");
        // §3.3.3: el bloqueo impide reservas nuevas; sobre las confirmadas
        // decide el administrador desde el listado global. Este servicio ni
        // siquiera conoce reservas_db.
    }

    @Test
    void rechaza_un_bloqueo_solapado_con_otro() {
        LocalDateTime desde = LocalDateTime.of(2026, 9, 20, 10, 0);
        LocalDateTime hasta = LocalDateTime.of(2026, 9, 20, 12, 0);
        when(repository.existsById(9L)).thenReturn(true);
        when(repository.buscarBloqueos(9L, desde, hasta)).thenReturn(List.of(
                new MaintenanceBlock(1L, 9L,
                        LocalDateTime.of(2026, 9, 20, 11, 0),
                        LocalDateTime.of(2026, 9, 20, 15, 0), "Obra")));

        assertThatThrownBy(() -> service.registrarBloqueo(9L, new BloqueoRequest(desde, hasta, null), ADMIN))
                .isInstanceOf(MaintenanceBlockOverlapException.class);

        verify(repository, never()).saveBloqueo(any(MaintenanceBlock.class));
    }

    @Test
    void rechaza_un_bloqueo_que_termina_antes_de_empezar() {
        lenient().when(repository.existsById(9L)).thenReturn(true);
        LocalDateTime desde = LocalDateTime.of(2026, 9, 20, 14, 0);
        LocalDateTime hasta = LocalDateTime.of(2026, 9, 20, 8, 0);

        assertThatThrownBy(() -> service.registrarBloqueo(9L, new BloqueoRequest(desde, hasta, null), ADMIN))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void un_bloqueo_contiguo_no_se_considera_solapado() {
        // Fin exclusivo: un bloqueo que acaba a las 12:00 no choca con uno que
        // empieza a las 12:00. Sin esto no se podrían encadenar mantenimientos.
        LocalDateTime desde = LocalDateTime.of(2026, 9, 20, 12, 0);
        LocalDateTime hasta = LocalDateTime.of(2026, 9, 20, 14, 0);
        when(repository.existsById(9L)).thenReturn(true);
        when(repository.buscarBloqueos(9L, desde, hasta)).thenReturn(List.of(
                new MaintenanceBlock(1L, 9L,
                        LocalDateTime.of(2026, 9, 20, 8, 0),
                        LocalDateTime.of(2026, 9, 20, 12, 0), "Obra")));
        when(repository.saveBloqueo(any(MaintenanceBlock.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.registrarBloqueo(9L, new BloqueoRequest(desde, hasta, null), ADMIN)).isNotNull();
    }
}
