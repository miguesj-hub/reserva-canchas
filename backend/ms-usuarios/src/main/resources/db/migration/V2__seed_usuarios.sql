-- ---------------------------------------------------------------------------
-- V2__seed_usuarios.sql — usuarios de prueba (quickstart.md § Usuarios de prueba).
--
-- Contraseñas hasheadas con BCrypt, coste 10. La contraseña de cada cuenta es
-- igual a su username, y está documentada en el quickstart y en el manual de
-- despliegue (E5). Nunca se guarda en claro.
--
-- `inactivo` es lo que hace demostrable la Historia 4 desde el primer arranque:
-- sin él, FR-005 no se puede enseñar sin tocar la base a mano.
-- ---------------------------------------------------------------------------

INSERT INTO usuario (id, username, nombre, password_hash, rol, activo) VALUES
    (1, 'admin',    'Administrador del Club', '$2a$10$A1FUiXO.CfWIIITHx3tW5u689nMq6Vk2BdCSbKqicp9jxoW2bQBHK', 'ADMINISTRADOR', true),
    (2, 'cliente1', 'Carlos Mendoza',         '$2a$10$rOxcrYUSJyO9hagwhySIEeSaovxgdboBWjSe21.ArkSyfg9y4V5.m', 'USUARIO_FINAL', true),
    (3, 'cliente2', 'Lucía Robles',           '$2a$10$6Ou9yZfmh9TFuVF9n.yCiuZUjNs24qH7JbHlIPBnNaFlKgdj2iFfa', 'USUARIO_FINAL', true),
    (4, 'inactivo', 'Cuenta Inactiva',        '$2a$10$RRJaL7mBQtIqOmG3IwvBJOTbKHv.nlaOaJwT.bhYakFzvaQvN7/jq', 'USUARIO_FINAL', false);

-- Los ids van explícitos para que el seed de reservas pueda referirse a ellos
-- (viven en otra base y no hay clave foránea posible). Al forzarlos hay que
-- adelantar la secuencia de identidad, o el primer registro desde la pantalla
-- chocaría contra el id 1.
ALTER TABLE usuario ALTER COLUMN id RESTART WITH 5;
