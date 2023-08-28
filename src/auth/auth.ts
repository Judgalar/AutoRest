import express from 'express'

import registroUsuario from '../controllers/auth/registroUsuario.js'
import generarToken from '../controllers/auth/generarToken.js'

const router = express.Router()

// Ruta para el registro de usuarios
router.post('/registro', registroUsuario)

// Ruta para generar un token
router.post('/token', generarToken)

export default router
