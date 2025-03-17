import express from 'express'

import registerUser from '../controllers/auth/registerUser.js'
import generateToken from '../controllers/auth/generateToken.js'

const router = express.Router()

// User registration route
router.post('/signup', registerUser)

// Token generation route
router.post('/token', generateToken)

export default router
