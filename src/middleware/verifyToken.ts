import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

import { secretKey } from '../auth/controllers/generateToken.js'

declare module 'express-serve-static-core' {
  interface Request {
    usuario?: { username: string }
  }
}

// Middleware function to verify the JWT token
const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  // Get the token from the authorization header
  const bearerToken = req.header('Authorization')

  console.log(bearerToken)

  // Check if the token exists
  if (bearerToken === undefined) {
    res.status(401).json({ message: 'Token not provided' })
    return
  }

  try {
    // Split the header into parts using space as a separator
    const headerParts = bearerToken.split(' ')

    // Check if the header has at least two parts and the first part is "Bearer"
    if (headerParts.length !== 2 || headerParts[0] !== 'Bearer') {
      res.status(401).json({ message: 'Invalid token' })
      return
    }

    // The token is in the second part of the header
    const token = headerParts[1]

    // Verify the token using the secret key
    const decoded = jwt.verify(token, secretKey) as { username: string }
    console.log(decoded)

    // Add the decoded data to the request object
    req.usuario = decoded

    // Continue with the next middleware or controller
    next()
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' })
  }
}

export default verifyToken
