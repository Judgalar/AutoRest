import express, { type Router, type Request, type Response } from 'express'
import fs from 'fs'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import swaggerUI from 'swagger-ui-express'
import pc from 'picocolors'
import swaggerJsdoc from 'swagger-jsdoc'

import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import verificarToken from './middleware/verificarToken.js'

import { port } from './constants.js'
import { sqlConnection } from './sqlConnection.js'
import generarModelos from './sequelizeAutoCmd.js'
import generateRoutes from './generateRoutes.js'
import swaggerConfig from './swaggerConfig.js'

import authRouter from './auth/auth.js'

await sqlConnection.authenticate()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

if (fs.existsSync(join(dirname, 'models'))) {
  console.log('Directorio models encontrado')
} else {
  console.log(pc.blue('Directorio models no encontrado. Generando modelos...'))
  try {
    await generarModelos()
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

// Genera el archivo Swagger JSON a partir de la configuración
const specs = swaggerJsdoc(swaggerConfig)

// Convierte el objeto en formato JSON
const swaggerJSON = JSON.stringify(specs, null, 2)

// Ruta donde deseas guardar el archivo swagger.json
const outputPath = path.join(dirname, 'swagger.json')

// Guarda el archivo JSON
fs.writeFileSync(outputPath, swaggerJSON)

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
const routesFiles = fs.readdirSync(routesPath)
console.log('Importando routers')
for (const routeFile of routesFiles) {
  const routeName = path.parse(routeFile).name

  const routerModule = await import(`./routes/${routeFile}`)
  const router: Router = routerModule.default

  app.use(`/${routeName}`, router)

  console.log(`/${routeName}`)
}

// Ruta protegida que utiliza el middleware de verificación
app.get('/ruta-protegida', verificarToken, (req: Request, res: Response) => {
  // El usuario ha pasado la verificación del token, puedes acceder a req.usuario
  res.json({ mensaje: 'Acceso permitido', usuario: req.usuario })
})

// // Ruta al archivo JSON de Swagger
// const swaggerFilePath = path.join(dirname, 'swagger.json')

// // Leer el archivo JSON de Swagger
// let swaggerDocument: any
// try {
//   const jsonSwagger = await readFile(swaggerFilePath, 'utf-8')
//   swaggerDocument = JSON.parse(jsonSwagger)
// } catch (error) {
//   console.error('Error al leer el archivo JSON de Swagger:', error)
//   process.exit(1) // Termina la aplicación en caso de error
// }

// // Configurar Swagger UI
// app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDocument))
// // Ruta para acceder al archivo JSON de Swagger
// app.get('/swagger.json', (req, res) => {
//   res.setHeader('Content-Type', 'application/json')
//   res.send(swaggerDocument)
// })

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(specs))

app.listen(port, () => {
  console.log(pc.bgYellow(` Servidor iniciado en el puerto ${port} `))
})
