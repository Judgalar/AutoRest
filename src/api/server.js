const express = require('express')
const { readdirSync } = require('fs')
const { join } = require('path')
const swaggerUI = require('swagger-ui-express')
const pc = require('picocolors')

const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const cookieParser = require('cookie-parser')
const compression = require('compression')

const { port } = require('./constants.js')

const app = express()

// MIDDLEWARE
// Proporciona configuraciones de seguridad para proteger tu aplicación de diversas vulnerabilidades web, como ataques de inyección, secuencias de comandos entre sitios (XSS) y falsificación de solicitudes entre sitios (CSRF).
app.use(helmet())

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

const routesPath = join(__dirname, 'routes')
const routesFiles = readdirSync(routesPath)

// RUTAS DINÁMICAS
routesFiles.forEach(routeFile => {
  const route = routeFile.split('.js')[0]
  const router = require(`./routes/${routeFile}`)

  app.use(`/${route}`, router)
})

const authRoutes = require('./auth/auth.js')
app.use('/auth', authRoutes)

const swaggerDocument = require('./swagger.json')

// Configurar Swagger UI
app.use('/', swaggerUI.serve, swaggerUI.setup(swaggerDocument))
// Ruta para acceder al archivo JSON de Swagger
app.get('/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerDocument)
})

app.listen(port, () => {
  console.log(pc.bgYellow(` Servidor iniciado en el puerto ${port} `))
})
