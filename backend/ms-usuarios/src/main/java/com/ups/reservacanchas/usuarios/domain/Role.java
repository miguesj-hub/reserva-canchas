package com.ups.reservacanchas.usuarios.domain;

/**
 * Los dos roles del sistema (§3.1, R-001). Enumeración cerrada: un valor fuera
 * de esta lista se rechaza con 400, no se acepta como texto libre.
 *
 * Los nombres son los mismos en la base de datos, en el contrato y en el
 * frontend — es lo que evita traducciones a mitad de camino.
 */
public enum Role {
    USUARIO_FINAL,
    ADMINISTRADOR
}
