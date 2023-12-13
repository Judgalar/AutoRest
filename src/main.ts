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

import { port } from './constants.js'
import { sqlConnection } from './sqlConnection.js'
import generateRoutes from './generateRoutes.js'
import generateSwagger from './swagger.js'

import authRouter from './auth/auth.js'

await sqlConnection.authenticate()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (fs.existsSync(join(dirname, 'models'))) {
  console.log('Directorio models encontrado')
} else {
  console.log(pc.blue('Directorio models no encontrado. Generando modelos...'))
  try {
    await import('./sequelizeAutoCmd')
  } catch (error) {
    console.error(error)
    process.exit(1) // Cierra la aplicacion si la generacion de modelos falla.
  }
}

if (fs.existsSync(join(dirname, 'routes'))) {
  console.log('Directorio Routes encontrado')
} else {
  console.log(pc.blue('Directorio routes no encontrado. Generando rutas...'))
  try {
    await generateRoutes()
  } catch (error) {
    console.error(error)
    process.exit(1) // Cierra la aplicacion si la generacion de modelos falla.
  }
}

if (fs.existsSync(join(dirname, 'swagger.json'))) {
  console.log('swagger.json encontrado')
} else {
  console.log(pc.blue('Documento swagger no encontrado. Generando swagger.json...'))
  try {
    await generateSwagger()
  } catch (error) {
    console.error(error)
    process.exit(1) // Cierra la aplicacion si la generacion de modelos falla.
  }
}

const app = express()

// MIDDLEWARE

// Permite solicitudes de origen cruzado (Cross-Origin Resource Sharing) y te ayuda a controlar las políticas de acceso a tu API.
app.use(cors())

// Comprime las respuestas enviadas desde el servidor para reducir el tamaño de los datos transferidos y mejorar el rendimiento.
app.use(compression())

// Registra los registros de solicitud HTTP para ayudarte a depurar y monitorear tus solicitudes entrantes
app.use(morgan('dev'))

// Middleware para análisis de JSON y URL-encoded
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Analiza y administra las cookies de las solicitudes
app.use(cookieParser())

// Middleware para registro de solicitudes
app.use((req, res, next) => {
  console.log('Solicitud recibida:', req.method, req.url)
  next()
})

app.use('/auth', authRouter)

// RUTAS DINÁMICAS
const routesPath = join(dirname, 'routes')
const routeFiles = fs.readdirSync(routesPath)

console.log('Creando rutas dinámicas')

for (const routeFile of routeFiles) {
  const routeName = path.parse(routeFile).name

  const routerModule = await import(`./routes/${routeFile}`)
  const router: Router = routerModule.default

  app.use(`/${routeName}`, router)

  console.log(`/${routeName}`)
}

// Ruta al archivo JSON de Swagger
const swaggerFilePath = path.join(dirname, 'swagger.json')

// Leer el archivo JSON de Swagger
try {
  const jsonSwagger = fs.readFileSync(swaggerFilePath, 'utf-8')
  const swaggerDocument = JSON.parse(jsonSwagger)
  // Configurar Swagger UI
  app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDocument))
} catch (error) {
  console.error('Error al leer el archivo JSON de Swagger:', error)
  process.exit(1) // Termina la aplicación en caso de error
}

app.listen(port, () => {
  console.log(pc.green(` Servidor iniciado en el puerto ${port} `))
})
