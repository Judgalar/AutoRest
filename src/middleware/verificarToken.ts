import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { secretKey } from '../controllers/auth/generarToken.js'

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: { username: string }
  }
}

// Función de middleware para verificar el token JWT
const verificarToken = (req: Request, res: Response, next: NextFunction): void => {
  // Obtener el token del encabezado de autorización
  const bearerToken = req.header('Authorization')

  console.log(bearerToken)

  // Verificar si el token existe
  if (bearerToken === undefined) {
    res.status(401).json({ mensaje: 'Token no proporcionado' })
    return
  }

  try {
    // Dividir el encabezado en partes utilizando el espacio como separador
    const headerParts = bearerToken.split(' ')

    // Verificar si el encabezado tiene al menos dos partes y la primera parte es "Bearer"
    if (headerParts.length !== 2 || headerParts[0] !== 'Bearer') {
      res.status(401).json({ mensaje: 'Token inválido' })
      return
    }

    // El token está en la segunda parte del encabezado
    const token = headerParts[1]

    // Verificar el token usando la clave secreta
    const decoded = jwt.verify(token, secretKey) as { username: string }
    console.log(decoded)

    // Agregar los datos decodificados al objeto de solicitud
    req.usuario = decoded

    // Continuar con el siguiente middleware o controlador
    next()
  } catch (error) {
    res.status(401).json({ mensaje: 'Token inválido' })
  }
}

export default verificarToken
