package com.ups.reservacanchas.usuarios.domain.exception;

/**
 * Credenciales que no sirven para entrar. El adaptador web la traduce a 401.
 *
 * Cubre dos casos con el mismo código porque el contrato los trata igual:
 * credencial equivocada (FR-003) y cuenta inactiva (FR-005). El mensaje del
 * primer caso no revela cuál de los dos datos falló.
 */
public class InvalidCredentialsException extends RuntimeException {

    public InvalidCredentialsException(String message) {
        super(message);
    }
}
