import jwt from 'jsonwebtoken'
import { type Request, type Response } from 'express'
import bcrypt from 'bcrypt'

import { users } from '../../auth/models'

const secretKey = 'ClaveSecreta'

// Define la interfaz para el modelo de usuario
interface User {
  id: number
  name: string
  password: string
  salt: string
}

const verificarCredenciales = async (username: string, password: string): Promise<number | null> => {
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
    }

    return usuarioEncontrado.id
  } catch (error) {
    console.error('Error al verificar las credenciales:', error)
    throw new Error('Error en el servidor')
  }
}

export default function generarToken (req: Request, res: Response): void {
  const { username, password }: { username: string, password: string } = req.body

  try {
    const userId = verificarCredenciales(username, password)

    if (userId === null) {
      res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
      return
    }

    const token = jwt.sign({ id: userId, username }, secretKey, { expiresIn: '1h' })

    res.json({ token })
  } catch (error) {
    console.error('Error al generar el token:', error)
    res.status(500).json({ error: 'Error en el servidor' })
  }
}
