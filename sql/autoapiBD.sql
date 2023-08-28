DROP DATABASE IF EXISTS autoapi;
CREATE DATABASE autoapi;

use autoapi;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL   /* El tamaño del hash de bcrypt será aproximadamente 60 */
);


