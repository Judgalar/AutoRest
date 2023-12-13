DROP DATABASE IF EXISTS autoapi_prueba;
CREATE DATABASE autoapi_prueba;

USE autoapi_prueba;

CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  contrasenia VARCHAR(100) NOT NULL
);

INSERT INTO usuarios (nombre, email, contrasenia) VALUES
  ('Usuario 1', 'usuario1@example.com', '123456'),
  ('Usuario 2', 'usuario2@example.com', 'abcdef'),
  ('Usuario 3', 'usuario3@example.com', 'qwerty');

CREATE TABLE productos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  precio DECIMAL(10, 2) NOT NULL
);

INSERT INTO productos (nombre, precio) VALUES
  ('Producto 1', 10.99),
  ('Producto 2', 20.50),
  ('Producto 3', 5.99);

CREATE TABLE usuarios_productos (
  usuario_id INT,
  producto_id INT,
  PRIMARY KEY (usuario_id, producto_id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

INSERT INTO usuarios_productos (usuario_id, producto_id) VALUES
  (1, 1), -- Usuario 1 compró Producto 1
  (2, 2), -- Usuario 2 compró Producto 2
  (3, 3); -- Usuario 3 compró Producto 3
