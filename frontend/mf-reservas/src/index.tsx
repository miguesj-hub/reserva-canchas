// Frontera asíncrona exigida por Module Federation.
//
// Antes de ejecutar el código de la app, Module Federation negocia qué versión
// de cada dependencia compartida se usará: la de este microfrontend o la que
// ya cargó el shell. Esa negociación es asíncrona.
//
// Este import() dinámico introduce la pausa que le da tiempo a resolverla. Sin
// él, el bundle intentaría usar React antes de que se decidiera cuál, y falla
// con "Shared module is not available for eager consumption".
//
// El contenido real del arranque está en bootstrap.tsx.
import('./bootstrap');
