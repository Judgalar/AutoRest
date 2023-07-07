DROP DATABASE IF EXISTS autoapi_prueba;
CREATE DATABASE autoapi_prueba;

USE autoapi_prueba;

CREATE TABLE usuarios (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(50) NOT NULL,
  email VARCHAR(100) NOT NULL,
  contraseña VARCHAR(100) NOT NULL
);

INSERT INTO usuarios (nombre, email, contraseña) VALUES
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
