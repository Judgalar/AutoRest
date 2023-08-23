const fs = require('node:fs')
const { join } = require('node:path')

const { createFile } = require('./utils/createFile.js')
const { Sequelize, sqlConnection } = require('./api/sqlConnection.js')

const modelsPath = join(__dirname, 'api', 'models')
const modelFiles = fs.readdirSync(modelsPath)

const routesDirectory = join(__dirname, 'api', 'routes')

if (fs.existsSync(routesDirectory)) {
  try {
    fs.rmdirSync(routesDirectory, { recursive: true })
    console.log(`Directorio ${routesDirectory} eliminado con éxito.`)
  } catch (err) {
    console.error(`Error al eliminar el directorio: ${err.message}`)
  }
} else fs.mkdirSync(routesDirectory, { recursive: true })

// Importa los modelos dinámicamente y agrega las rutas al objeto de configuración
modelFiles.forEach((file) => {
  const model = require(join(modelsPath, file))(sqlConnection, Sequelize.DataTypes)
  // Asume que cada archivo de modelo exporta una función que recibe el objeto Sequelize y los DataTypes como argumentos y devuelve el modelo definido
  const modelName = model.name

  if (!model.name) return

  const content = `const express = require('express')
const { Sequelize, sqlConnection } = require('../sqlConnection.js')
const defineModel_${modelName} = require('../models/${modelName}') // Asegúrate de importar el modelo correcto
const ${modelName} = defineModel_${modelName}(sqlConnection, Sequelize.DataTypes)

const router = express.Router()

// Ruta para obtener todos los registros
router.get('/', async (req, res) => {
  try {
    const data = await ${modelName}.findAll()
    res.json(data)
  } catch (error) {
    console.error('Error al obtener los registros de ${modelName}:', error)
    res.status(500).json({ error: 'Error al obtener los registros de ${modelName}' })
  }
})

// Ruta para obtener un registro por su ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const registro = await ${modelName}.findByPk(id)

    if (!registro) {
      res.status(404).json({ error: '${modelName} no encontrado' })
    } else {
      res.json(registro)
    }
  } catch (error) {
    console.error('Error al obtener registro de ${modelName} por ID:', error)
    res.status(500).json({ error: 'Error al obtener registro de ${modelName} por ID' })
  }
})

// Ruta para crear un nuevo registro
router.post('/', async (req, res) => {
  try {
    const newData = req.body
    const createdData = await ${modelName}.create(newData)
    res.status(201).json(createdData)
  } catch (error) {
    console.error('Error al crear un registro de ${modelName}:', error)
    res.status(500).json({ error: 'Error al crear un registro de ${modelName}' })
  }
})

// Ruta para actualizar un registro en el modelo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updatedData = req.body
    const registro = await ${modelName}.findByPk(id)

    if (!registro) {
      res.status(404).json({ error: '${modelName} no encontrado' })
    } else {
      await registro.update(updatedData)
      res.json({ message: '${modelName} actualizado correctamente' })
    }
  } catch (error) {
    console.error('Error al actualizar:', error)
    res.status(500).json({ error: 'Error al actualizar' })
  }
})

// Ruta para actualizar parcialmente un registro en el modelo
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const updatedFields = req.body
    const registro = await ${modelName}.findByPk(id)

    if (!registro) {
      res.status(404).json({ error: '${modelName} no encontrado' })
    } else {
      await registro.update(updatedFields)
      res.json({ message: '${modelName} actualizado parcialmente' })
    }
  } catch (error) {
    console.error('Error al actualizar parcialmente el registro de ${modelName}:', error)
    res.status(500).json({ error: 'Error al actualizar parcialmente el registro de ${modelName}' })
  }
})

// Ruta para eliminar un registro en el modelo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const registro = await ${modelName}.findByPk(id)

    if (!registro) {
      res.status(404).json({ error: '${modelName} no encontrado' })
    } else {
      await registro.destroy()
      res.json({ message: '${modelName} eliminado correctamente' })
    }
  } catch (error) {
    console.error('Error al eliminar el registro de ${modelName}:', error)
    res.status(500).json({ error: 'Error al eliminar el registro de ${modelName}' })
  }
})

module.exports = router
`

  const fileName = `${modelName}.js`
  const RoutesPath = join(__dirname, 'api', 'routes')

  createFile(RoutesPath, fileName, content)
})
