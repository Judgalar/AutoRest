import express, { type Router } from 'express'
import fs from 'fs'
import path, { join } from 'path'
import { fileURLToPath } from 'url'
import swaggerUI from 'swagger-ui-express'
import { readFile } from 'fs/promises'
import pc from 'picocolors'

import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import compression from 'compression'

import { port } from './constants.js'
import authRoutes from './auth/auth.js'
import { sqlConnection } from './sqlConnection.js'
import generarModelos from './sequelizeAutoESM.js'
import generateRoutes from './generateRoutes.js'
import generateSwagger from './generateSwagger.js'

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

// if (fs.existsSync(join(dirname, 'routes'))) {
//   console.log('Directorio Routes encontrado')
// } else {
//   console.log(pc.blue('Directorio routes no encontrado. Generando rutas...'))
//   try {
//     await generateRoutes()
//   } catch (error) {
//     console.error(error)
//     process.exit(1) // Cierra la aplicacion si la generacion de modelos falla.
//   }
// }

// if (fs.existsSync(join(dirname, 'swagger.json'))) {
//   console.log('swagger.json encontrado')
// } else {
//   console.log(pc.blue('swagger.json no encontrado. Generando swagger...'))
//   try {
//     await generateSwagger()
//   } catch (error) {
//     console.error(error)
//     process.exit(1) // Cierra la aplicacion si la generacion de modelos falla.
//   }
// }

console.log('HOLA')

// const app = express()

// // MIDDLEWARE
// // Proporciona configuraciones de seguridad para proteger tu aplicación de diversas vulnerabilidades web, como ataques de inyección, secuencias de comandos entre sitios (XSS) y falsificación de solicitudes entre sitios (CSRF).
// app.use(helmet())

// // Permite solicitudes de origen cruzado (Cross-Origin Resource Sharing) y te ayuda a controlar las políticas de acceso a tu API.
// app.use(cors())

// // Comprime las respuestas enviadas desde el servidor para reducir el tamaño de los datos transferidos y mejorar el rendimiento.
// app.use(compression())

// // Registra los registros de solicitud HTTP para ayudarte a depurar y monitorear tus solicitudes entrantes
// app.use(morgan('dev'))

// // Middleware para análisis de JSON y URL-encoded
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }))

// // Analiza y administra las cookies de las solicitudes
// app.use(cookieParser())

// // Middleware para registro de solicitudes
// app.use((req, res, next) => {
//   console.log('Solicitud recibida:', req.method, req.url)
//   next()
// })

// const routesPath = join(dirname, 'routes')
// const routesFiles = fs.readdirSync(routesPath)

// const clientesRouter: Router = await import('./routes/cliente')
// app.use('/clientes')

// RUTAS DINÁMICAS
// for (const routeFile of routesFiles) {
//   const route = routeFile.split('.js')[0]
//   //const router: Router = await import(`./routes/${routeFile}`)
//   // app.use(`/${route}`, router)
// }

// app.use('/auth', authRoutes)

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

// app.listen(port, () => {
//   console.log(pc.bgYellow(` Servidor iniciado en el puerto ${port} `))
// })
