package com.ups.reservacanchas.reservas.adapter.out.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.ups.reservacanchas.reservas.application.port.out.BookingRepositoryPort;
import com.ups.reservacanchas.reservas.domain.Booking;
import com.ups.reservacanchas.reservas.domain.TimeSlot;
import com.ups.reservacanchas.reservas.domain.exception.SlotAlreadyBookedException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * La carrera de RN-02, contra PostgreSQL de verdad. Es lo que mide SC-004 y lo
 * que el Principio II exige además de las pruebas unitarias.
 *
 * Esta es la única prueba que **no** se puede hacer con el puerto mockeado: el
 * caso que cubre —dos transacciones que comprueban a la vez y ambas ven el
 * bloque libre— existe precisamente porque la comprobación previa de
 * BookingService no basta. Lo que se ejercita aquí es la restricción EXCLUDE y
 * su traducción a SlotAlreadyBookedException en BookingRepositoryAdapter.
 *
 * Necesita una base real, así que se activa solo con RESERVAS_IT_DB_URL puesta;
 * en su ausencia se salta en vez de fallar. Contra el sistema levantado:
 *
 *   RESERVAS_IT_DB_URL=jdbc:postgresql://localhost:5432/reservas_db \
 *   ./mvnw test -Dtest=ConcurrenciaReservaIT
 *
 * SC-004 pide 10 repeticiones con el mismo resultado: de ahí el @RepeatedTest.
 */
@EnabledIfEnvironmentVariable(named = "RESERVAS_IT_DB_URL", matches = ".+")
@SpringBootTest(properties = {
    "spring.datasource.url=${RESERVAS_IT_DB_URL}",
    "spring.datasource.username=${RESERVAS_IT_DB_USER:reservas_app}",
    "spring.datasource.password=${RESERVAS_IT_DB_PASSWORD:reservas_app}",
    // El esquema ya lo migró el servicio en marcha; esta prueba solo escribe.
    "spring.flyway.enabled=false"
})
class ConcurrenciaReservaIT {

    /** Fuera del horario del seed, para no chocar con sus reservas. */
    private static final LocalTime HORA_LIBRE = LocalTime.of(6, 0);

    /** Usuarios del seed de usuarios_db. No hay clave foránea: son solo números. */
    private static final long CLIENTE_1 = 2L;
    private static final long CLIENTE_2 = 3L;

    private static final long CANCHA = 1L;

    @Autowired
    BookingRepositoryPort repository;

    @RepeatedTest(10)
    void dos_peticiones_simultaneas_sobre_el_mismo_bloque_solo_confirman_una_RN02() throws Exception {
        // Una fecha distinta por repetición para no arrastrar estado entre ellas.
        LocalDate fecha = LocalDate.now().plusYears(5).plusDays(System.nanoTime() % 3650);
        TimeSlot bloque = TimeSlot.deUnaHoraDesde(HORA_LIBRE);

        // El latch es lo que hace que sea una carrera: los dos hilos quedan
        // retenidos y salen a la vez, en vez de uno después del otro.
        CountDownLatch salida = new CountDownLatch(1);
        AtomicInteger confirmadas = new AtomicInteger();
        AtomicInteger rechazadas = new AtomicInteger();

        Callable<Void> reservar = () -> {
            salida.await();
            try {
                repository.save(new Booking(CANCHA, CLIENTE_1, fecha, bloque));
                confirmadas.incrementAndGet();
            } catch (SlotAlreadyBookedException esperada) {
                rechazadas.incrementAndGet();
            }
            return null;
        };
        Callable<Void> reservarElOtro = () -> {
            salida.await();
            try {
                repository.save(new Booking(CANCHA, CLIENTE_2, fecha, bloque));
                confirmadas.incrementAndGet();
            } catch (SlotAlreadyBookedException esperada) {
                rechazadas.incrementAndGet();
            }
            return null;
        };

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Void>> enCurso = List.of(pool.submit(reservar), pool.submit(reservarElOtro));
            salida.countDown();
            for (Future<Void> tarea : enCurso) {
                tarea.get(20, TimeUnit.SECONDS);
            }
        } finally {
            pool.shutdownNow();
        }

        // Exactamente una confirma. Nunca dos, y nunca ninguna.
        assertThat(confirmadas.get()).as("reservas confirmadas sobre el mismo bloque").isEqualTo(1);
        assertThat(rechazadas.get()).as("rechazos con SlotAlreadyBookedException").isEqualTo(1);
    }
}
