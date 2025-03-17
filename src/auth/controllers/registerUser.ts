import { type Request, type Response } from 'express'
import bcrypt from 'bcrypt'

import { users } from '../../auth/models.js'

// Define the interface for the user model
interface User {
  id: number
  username: string
  password: string
}

export default function registerUser (req: Request, res: Response): void {
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

  findUser(username)
    .then((foundUser) => {
      if (foundUser !== null) {
        console.log('User found:', foundUser)
        res.status(409).json({ message: 'The user already exists' })
      } else {
        createUser(username, password)
          .then(() => {
            res.status(201).json({ message: 'User registered successfully' })
          })
          .catch((error) => {
            console.error('Error in the createUser function:', error)
            res.status(500).json({ error: 'Server error' })
          })
      }
    })
    .catch((error) => {
      console.error('Error in the findUser function:', error)
      res.status(500).json({ error: 'Server error' })
    })
}

const findUser = async (username: string): Promise<User | null> => {
  try {
    // Search for the user in the database
    const user = await users.findOne({ where: { username } })

    if (user === null) {
      return null
    }

    // Transform the user into a simple object
    const foundUser: User = user.get() as User

    return foundUser
  } catch (error) {
    console.error('Error while searching for user:', error)
    throw new Error('Server error')
  }
}

const createUser = async (username: string, password: string): Promise<void> => {
  try {
    // Generate a salt for hashing
    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt)

    // Perform the registration operation in the database using create
    await users.create({ username, password: hashedPassword })
    console.log('User registered successfully')
  } catch (error) {
    console.error('Error while registering user:', error)
    throw new Error('Server error')
  }
}
