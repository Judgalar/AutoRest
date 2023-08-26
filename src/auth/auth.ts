import express from 'express'

import registroUsuario from '../controllers/auth/registroUsuario.js'
import generarToken from '../controllers/auth/generarToken.js'

const router = express.Router()

// Ruta para el registro de usuarios
router.post('/registro', registroUsuario)

// Ruta para generar un token
router.post('/token', generarToken)
// try {
//   const { name, password } = req.body

//   // Buscar al usuario en la base de datos
//   const usuario = await users.findOne({ where: { name } })
//   if (!usuario) {
//     return res.status(404).json({ error: 'Usuario no encontrado' })
//   }

//   // Verificar la contraseña
//   const hash = crypto.pbkdf2Sync(password, usuario.salt, 10000, 64, 'sha512').toString('hex')
//   if (hash !== usuario.password) {
//     return res.status(401).json({ error: 'Contraseña incorrecta' })
//   }

//   // Generar un token JWT
//   const token = jwt.sign({ id: usuario.id }, 'secreto')

//   // Guardar el token en la base de datos
//   await tokens.create({ token, userId: usuario.id })

//   res.json({ token })
// } catch (error) {
//   console.error('Error al iniciar sesión:', error)
//   res.status(500).json({ error: 'Error al iniciar sesión' })
// }
// })

// Ruta protegida que requiere un token válido
// router.get('/protegida', (req, res) => {
//   // Obtener el token del encabezado Authorization
//   const token = req.headers.authorization

//   // Verificar si el token es válido
//   jwt.verify(token, 'secreto', (err, decoded) => {
//     if (err) {
//       return res.status(401).json({ error: 'Token inválido' })
//     }

//     // El token es válido, se puede acceder a la ruta protegida
//     res.json({ mensaje: 'Ruta protegida accesible' })
//   })
// })
export default router
