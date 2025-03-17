import express, { type Router } from 'express'
import fs from 'fs'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import swaggerUI from 'swagger-ui-express'
import pc from 'picocolors'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import compression from 'compression'

import { port, useSwaggerUI } from './constants.js'
import { sqlConnection } from './sqlConnection.js'
import generateRoutes from './generateRoutes.js'
import generateSwagger from './swagger.js'

import authRouter from './auth/router.js'
import sequelizeAuth from './auth/database.js'

void (async () => {
  try {
    await sequelizeAuth.sync() // Create DB if not exists
    console.log('✅ Database ready in "data/auth.db"')
  } catch (error) {
    console.error('❌ Error synchronizing database:', error)
  }
})()

await sqlConnection.authenticate()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (fs.existsSync(join(dirname, 'models'))) {
  console.log('Models directory found')
} else {
  console.log(pc.blue('Models directory not found. Generating models...'))
  try {
    await import('./sequelizeAutoCmd.js')
  } catch (error) {
    console.error(error)
    process.exit(1) // Closes the application if model generation fails.
  }
}

if (fs.existsSync(join(dirname, 'routes'))) {
  console.log('Routes directory found')
} else {
  console.log(pc.blue('Routes directory not found. Generating routes...'))
  try {
    await generateRoutes()
  } catch (error) {
    console.error(error)
    process.exit(1) // Closes the application if route generation fails.
  }
}

if (fs.existsSync(join(dirname, 'swagger.json'))) {
  console.log('swagger.json found')
} else {
  console.log(pc.blue('Swagger document not found. Generating swagger.json...'))
  try {
    await generateSwagger()
  } catch (error) {
    console.error(error)
    process.exit(1) // Closes the application if swagger generation fails.
  }
}

const app = express()

// MIDDLEWARE

// Allows cross-origin requests (Cross-Origin Resource Sharing) and helps control access policies for your API.
app.use(cors())

// Compresses responses sent from the server to reduce data size and improve performance.
app.use(compression())

// Logs HTTP request records to help debug and monitor incoming requests.
app.use(morgan('dev'))

// Middleware for JSON and URL-encoded parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Parses and manages cookies from requests
app.use(cookieParser())

// Middleware for request logging
app.use((req, _res, next) => {
  console.log('Request received:', req.method, req.url)
  next()
})

app.use('/auth', authRouter)

// DYNAMIC ROUTES
const routesPath = join(dirname, 'routes')
const routeFiles = fs.readdirSync(routesPath)

console.log('Creating dynamic routes')

for (const routeFile of routeFiles) {
  const routeName = path.parse(routeFile).name

  const routerModule = await import(`./routes/${routeFile}`)
  const router: Router = routerModule.default

  app.use(`/${routeName}`, router)

  console.log(`/${routeName}`)
}

if (useSwaggerUI) {
  // Path to the Swagger JSON file
  const swaggerFilePath = path.join(dirname, 'swagger.json')

  // Read the Swagger JSON file
  try {
    const jsonSwagger = fs.readFileSync(swaggerFilePath, 'utf-8')
    const swaggerDocument: swaggerUI.JsonObject = JSON.parse(jsonSwagger)
    // Configure Swagger UI
    app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDocument))
  } catch (error) {
    console.error('Error reading the Swagger JSON file:', error)
    process.exit(1) // Terminates the application in case of error
  }
}

app.listen(port, () => {
  console.log(pc.green(` Server started on port ${port} `))
})
