import express from 'express'

import registerUser from './controllers/registerUser.js'
import generateToken from './controllers/generateToken.js'

const router = express.Router()

// User registration route
router.post('/signup', registerUser)

// Token generation route
router.post('/token', generateToken)

export default router
