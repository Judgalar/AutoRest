import jwt from 'jsonwebtoken'
import { type Request, type Response } from 'express'
import bcrypt from 'bcrypt'

import { users } from '../../auth/models.js'

export const secretKey = 'ClaveSecreta'

// Define la interfaz para el modelo de usuario
interface User {
  id: number
  usernname: string
  password: string
}

const verificarCredenciales = async (username: string, password: string): Promise<number | null > => {
  try {
    const usuario = await users.findOne({ where: { username } })

    if (usuario === null) {
      return null
    }

    // Transformar el usuario a un objeto simple
    const usuarioEncontrado: User = usuario.get() as User

    const passwordMatch = await bcrypt.compare(password, usuarioEncontrado.password)

    if (!passwordMatch) {
      return null // Credenciales inválidas
    } else return usuarioEncontrado.id
  } catch (error) {
    console.error('Error al verificar las credenciales:', error)
    throw new Error('Error en el servidor')
  }
}

export default function generarToken (req: Request, res: Response): void {
  const { username, password }: { username: string, password: string } = req.body

  if (username === undefined || password === undefined) {
    const errorResponse: Record<string, string> = {}

    if (username === undefined) {
      errorResponse.username = 'undefined'
    }

    if (password === undefined) {
      errorResponse.password = 'undefined'
    }

    res.status(400).json({ error: errorResponse })
    return
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    const errorResponse: Record<string, string> = {}

    if (typeof username !== 'string') {
      errorResponse.username = 'Not string'
    }

    if (typeof password !== 'string') {
      errorResponse.password = 'Not string'
    }

    res.status(400).json({ error: errorResponse })
    return
  }

  verificarCredenciales(username, password)
    .then((userId) => {
      if (userId === null) {
        res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
        return
      }

      const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' })
      res.json({ token })
    })
    .catch((error) => {
      console.error('Error al generar el token:', error)
      res.status(500).json({ error: 'Error en el servidor' })
    })
}
