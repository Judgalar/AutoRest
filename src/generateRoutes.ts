import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

import createFile from './utils/createFile.js'
const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const modelsPath = path.join(dirname, 'models')
const routesDirectory = path.join(dirname, 'routes')

export default async function generateRoutes (): Promise<void> {
  if (fs.existsSync(routesDirectory)) {
    fs.rmSync(routesDirectory, { recursive: true })
  } else fs.mkdirSync(routesDirectory, { recursive: true })

  const modelFiles = fs.readdirSync(modelsPath)
  // Importa los modelos dinámicamente y agrega las rutas al objeto de configuración
  for (const file of modelFiles) {
    const modulePath = `./models/${file}`
    if (modulePath === './models/init-models.js') continue
    const defineModelModule = await import(modulePath)
    const defineModel = defineModelModule.default
    const modelName: string = defineModel.name

    if (modelName === undefined || modelName === null || modelName === '') continue

    const content = `import express from 'express'
import { Sequelize, sqlConnection } from '../sqlConnection'
import defineModel_${modelName} from '../models/${modelName}' // Asegúrate de importar el modelo correcto
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

export default router

`

    const fileName = `${modelName}.js`
    const RoutesPath = path.join(dirname, 'routes')

    createFile(RoutesPath, fileName, content)
  }
}
