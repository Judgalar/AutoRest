import jwt from 'jsonwebtoken'
import { type Request, type Response } from 'express'
import bcrypt from 'bcrypt'

import { users } from '../../auth/models.js'

export const secretKey = 'SecretKey'

// Define the interface for the user model
interface User {
  id: number
  username: string
  password: string
}

const verifyCredentials = async (username: string, password: string): Promise<number | null> => {
  try {
    const user = await users.findOne({ where: { username } })

    if (user === null) {
      return null
    }

    // Transform the user into a simple object
    const foundUser: User = user.get() as User

    const passwordMatch = await bcrypt.compare(password, foundUser.password)

    if (!passwordMatch) {
      return null // Invalid credentials
    } else return foundUser.id
  } catch (error) {
    console.error('Error verifying credentials:', error)
    throw new Error('Server error')
  }
}

export default function generateToken (req: Request, res: Response): void {
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
      errorResponse.username = 'Not a string'
    }

    if (typeof password !== 'string') {
      errorResponse.password = 'Not a string'
    }

    res.status(400).json({ error: errorResponse })
    return
  }

  verifyCredentials(username, password)
    .then((userId) => {
      if (userId === null) {
        res.status(401).json({ error: 'Invalid username or password' })
        return
      }

      const token = jwt.sign({ username }, secretKey, { expiresIn: '1h' })
      res.json({ token })
    })
    .catch((error) => {
      console.error('Error generating token:', error)
      res.status(500).json({ error: 'Server error' })
    })
}
