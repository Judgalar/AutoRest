import { type Request, type Response } from 'express'
import bcrypt from 'bcrypt'

import { users } from '../../auth/models'

// Define la interfaz para el modelo de usuario
interface User {
  id: number
  username: string
  password: string
}

export default function registroUsuario (req: Request, res: Response): void {
  const { username, password } = req.body

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

  buscarUsuario(username)
    .then((usuarioEncontrado) => {
      if (usuarioEncontrado !== null) {
        console.log('Usuario encontrado:', usuarioEncontrado)
        res.status(409).json({ message: 'El usuario ya existe', usuario: usuarioEncontrado })
      } else {
        registrarUsuario(username, password)
          .then(() => {
            res.status(201).json({ message: 'Usuario registrado correctamente' })
          })
          .catch((error) => {
            console.error('Error en la función registrarUsuario:', error)
            res.status(500).json({ error: 'Error en el servidor' })
          })
      }
    })
    .catch((error) => {
      console.error('Error en la función buscarUsuario:', error)
      res.status(500).json({ error: 'Error en el servidor' })
    })
}

const buscarUsuario = async (username: string): Promise<User | null> => {
  try {
    // Buscar al usuario en la base de datos
    const usuario = await users.findOne({ where: { username } })

    if (usuario === null) {
      return null
    }

    // Transformar el usuario a un objeto simple
    const usuarioEncontrado: User = usuario.get() as User

    return usuarioEncontrado
  } catch (error) {
    console.error('Error al buscar usuario:', error)
    throw new Error('Error en el servidor')
  }
}

const registrarUsuario = async (username: string, password: string): Promise<void> => {
  try {
    // Generar un salt para el hashing
    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, salt)

    // Realizar la operación de registro en la base de datos usando create
    await users.create({ username, password: hashedPassword })
    console.log('Usuario registrado correctamente')
  } catch (error) {
    console.error('Error al registrar usuario:', error)
    throw new Error('Error en el servidor')
  }
}
