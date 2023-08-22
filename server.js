const express = require('express')
const { readdirSync, readFileSync } = require('fs')
const { join } = require('path')
const { Sequelize } = require('sequelize')
const swaggerUI = require('swagger-ui-express')
const pc = require('picocolors')

const configPath = './config.json'
const config = JSON.parse(readFileSync(configPath, 'utf-8'))
const { name, user, password, host, dialect } = config.database

const app = express()
const port = process.env.PORT || 3000

const sequelize = new Sequelize(name, user, password, {
  host,
  dialect
})

// MIDDLEWARE
// Proporciona configuraciones de seguridad para proteger tu aplicación de diversas vulnerabilidades web, como ataques de inyección, secuencias de comandos entre sitios (XSS) y falsificación de solicitudes entre sitios (CSRF).
const helmet = require('helmet')
app.use(helmet())

// Permite solicitudes de origen cruzado (Cross-Origin Resource Sharing) y te ayuda a controlar las políticas de acceso a tu API.
const cors = require('cors')
app.use(cors())

// Comprime las respuestas enviadas desde el servidor para reducir el tamaño de los datos transferidos y mejorar el rendimiento.
const compression = require('compression')
app.use(compression())

// Registra los registros de solicitud HTTP para ayudarte a depurar y monitorear tus solicitudes entrantes
const morgan = require('morgan')
app.use(morgan('dev'))

// Middleware para análisis de JSON y URL-encoded
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Analiza y administra las cookies de las solicitudes
const cookieParser = require('cookie-parser')
app.use(cookieParser())

// Middleware para registro de solicitudes
app.use((req, res, next) => {
  console.log('Solicitud recibida:', req.method, req.url)
  next()
})

const modelsPath = join(__dirname, 'models')
const modelFiles = readdirSync(modelsPath)

// Importa los modelos dinámicamente y agrega las rutas al objeto de configuración
modelFiles.forEach((file) => {
  const model = require(join(modelsPath, file))(sequelize, Sequelize.DataTypes)
  // Asume que cada archivo de modelo exporta una función que recibe el objeto Sequelize y los DataTypes como argumentos y devuelve el modelo definido
  const modelName = model.name // Nombre del modelo (asumimos que el modelo tiene una propiedad "name")

  // RUTAS
  // Ruta para obtener todos los registros
  app.get(`/${modelName}`, async (_req, res) => {
    try {
      const data = await model.findAll()
      res.json(data)
    } catch (error) {
      console.error(`Error al obtener los registros de ${modelName}:`, error)
      res.status(500).json({ error: `Error al obtener los registros de ${modelName}` })
    }
  })

  // Ruta para obtener un registro por su ID
  app.get(`/${modelName}/:id`, async (req, res) => {
    try {
      const { id } = req.params
      const registro = await model.findByPk(id)

      if (!registro) {
        res.status(404).json({ error: `${modelName} no encontrado` })
      } else {
        res.json(registro)
      }
    } catch (error) {
      console.error(`Error al obtener ${modelName} por ID:`, error)
      res.status(500).json({ error: `Error al obtener ${modelName} por ID` })
    }
  })

  // Ruta para crear un nuevo registro
  app.post(`/${modelName}`, async (req, res) => {
    try {
      const newData = req.body
      const createdData = await model.create(newData)

      res.status(201).json(createdData)
    } catch (error) {
      console.error(`Error al crear un registro de ${modelName}:`, error)
      res.status(500).json({ error: `Error al crear un registro de ${modelName}` })
    }
  })

  // Ruta para actualizar un registro en el modelo
  app.put(`/${modelName}/:id`, async (req, res) => {
    try {
      const { id } = req.params
      const updatedData = req.body
      const registro = await model.findByPk(id)

      if (!registro) {
        res.status(404).json({ error: `${modelName} no encontrado` })
      } else {
        await model.update(updatedData, { where: { id } })

        const updatedRegistro = await model.findByPk(id) // Obtener el registro actualizado desde la base de datos

        res.json({
          message: `${modelName} actualizado correctamente`,
          registro: updatedRegistro // Agregar el registro actualizado en la respuesta
        })
      }
    } catch (error) {
      console.error(`Error al actualizar ${modelName}:`, error)
      res.status(500).json({ error: `Error al actualizar ${modelName}` })
    }
  })

  // Ruta para actualizar parcialmente un registro en el modelo
  app.patch(`/${modelName}/:id`, async (req, res) => {
    try {
      const { id } = req.params
      const updatedFields = req.body
      const registro = await model.findByPk(id)

      if (!registro) {
        res.status(404).json({ error: `${modelName} no encontrado` })
      } else {
        await model.update(updatedFields, { where: { id } })

        res.json({ message: `${modelName} actualizado correctamente` })
      }
    } catch (error) {
      console.error(`Error al actualizar parcialmente ${modelName}:`, error)
      res.status(500).json({ error: `Error al actualizar parcialmente ${modelName}` })
    }
  })

  // Ruta para eliminar un registro en el modelo
  app.delete(`/${modelName}/:id`, async (req, res) => {
    try {
      const { id } = req.params
      const registro = await model.findByPk(id)

      if (!registro) {
        res.status(404).json({ error: `${modelName} no encontrado` })
      } else {
        await model.destroy({ where: { id } })

        res.json({ message: `${modelName} eliminado correctamente` })
      }
    } catch (error) {
      console.error(`Error al eliminar ${modelName}:`, error)
      res.status(500).json({ error: `Error al eliminar ${modelName}` })
    }
  })
})

const authRoutes = require('./auth/auth')
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
