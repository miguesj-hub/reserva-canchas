package com.ups.reservacanchas.reservas.adapter.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** Mapeo de la tabla `configuracion`. Package-private, como el resto del adaptador. */
@Entity
@Table(name = "configuracion")
class ConfigurationEntity {

    @Id
    @Column(length = 60)
    private String clave;

    @Column(nullable = false, length = 120)
    private String valor;

    protected ConfigurationEntity() {}

    ConfigurationEntity(String clave, String valor) {
        this.clave = clave;
        this.valor = valor;
    }

    String getValor() { return valor; }

    void setValor(String valor) { this.valor = valor; }
}
