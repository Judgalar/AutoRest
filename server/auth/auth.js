const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sequelizeAuth, users, tokens } = require('./models');

const router = express.Router();

// Ruta para el registro de usuarios
router.post('/registro', async (req, res) => {
  try {
    const { name, password } = req.body;

    // Verificar si el usuario ya existe en la base de datos
    const usuarioExistente = await users.findOne({ where: { name } });
    if (usuarioExistente) {
      return res.status(400).json({ error: 'El nombre de usuario ya está en uso' });
    }

    // Generar una salt aleatoria
    const salt = crypto.randomBytes(16).toString('hex');

    // Generar el hash de la contraseña utilizando PBKDF2 y la salt
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');

    // Crear un nuevo usuario
    const nuevoUsuario = await users.create({ name, password: hash, salt });

    res.json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
});

// Ruta para ver los token del usuario
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    // Buscar al usuario en la base de datos
    const usuario = await users.findOne({ where: { name } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const hash = crypto.pbkdf2Sync(password, usuario.salt, 10000, 64, 'sha512').toString('hex');
    if (hash !== usuario.password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Buscar todos los tokens pertenecientes al usuario
    const userTokens = await tokens.findAll({ where: { userId: usuario.id } });

    // Devolver los tokens al cliente
    res.json({ tokens: userTokens });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta para generar un token
router.post('/token', async (req, res) => {
  try {
    const { name, password } = req.body;

    // Buscar al usuario en la base de datos
    const usuario = await users.findOne({ where: { name } });
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const hash = crypto.pbkdf2Sync(password, usuario.salt, 10000, 64, 'sha512').toString('hex');
    if (hash !== usuario.password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar un token JWT
    const token = jwt.sign({ id: usuario.id }, 'secreto', { expiresIn: '1h' });

    // Guardar el token en la base de datos
    await tokens.create({ token, userId: usuario.id });

    res.json({ token });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Ruta protegida que requiere un token válido
router.get('/protegida', (req, res) => {
  // Obtener el token del encabezado Authorization
  const token = req.headers.authorization;

  // Verificar si el token es válido
  jwt.verify(token, 'secreto', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // El token es válido, se puede acceder a la ruta protegida
    res.json({ mensaje: 'Ruta protegida accesible' });
  });
});

module.exports = router;
