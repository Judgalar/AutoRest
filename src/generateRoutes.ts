import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'

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

    const isTsFile = file.endsWith('.ts')
    const modelName = file.replace(isTsFile ? '.ts' : '.js', '')
    if (modelName === undefined || modelName === null || modelName === '' || modelName === 'init-models') continue

    const defineModelModule = await import(modulePath)

    const defineModel = defineModelModule[modelName]

    if (typeof defineModel === 'undefined' || defineModel === null) {
      console.error(`Fichero ${modulePath} no contiene clase ${modelName}, continuando...`)
      continue
    }

    const content = generateRoutesContent(modelName) // Genera el contenido de las rutas aquí

    const fileName = `${modelName}.js`
    const RoutesPath = path.join(dirname, 'routes')

    createFile(RoutesPath, fileName, content)
  }
}

// Genera el contenido de las rutas basado en el modelo
function generateRoutesContent (modelName: string): string {
  return `
  import express from 'express'
  import { sqlConnection } from '../sqlConnection.js'
  import * as defineModel_${modelName} from '../models/${modelName}.js'
  import verificarToken from '../middleware/verificarToken.js'
  
  const ${modelName}Class = defineModel_${modelName}.${modelName}
  const ${modelName} = ${modelName}Class.initModel(sqlConnection)
  
  const router = express.Router()
  
  // Ruta para obtener todos los registros
  router.get('/', async (req, res) => {
    try {
      const data = await ${modelName}.findAll();
      res.json(data);
    } catch (error) {
      console.error('Error al obtener los registros de ${modelName}:', error);
      res.status(500).json({ error: 'Error al obtener los registros' });
    }
  });
  
  // Ruta para obtener un registro por su ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const registro = await ${modelName}.findByPk(id);
  
      if (!registro) {
        res.status(404).json({ error: '${modelName} no encontrado' });
      } else {
        res.json(registro);
      }
    } catch (error) {
      console.error('Error al obtener el registro por ID:', error);
      res.status(500).json({ error: 'Error al obtener el registro por ID' });
    }
  });
  
  // Ruta para crear un nuevo registro
  router.post('/', verificarToken, async (req, res) => {
    try {
      const newData = req.body;
      const createdData = await ${modelName}.create(newData);
      res.status(201).json(createdData);
    } catch (error) {
      console.error('Error al crear un registro:', error);
      res.status(500).json({ error: 'Error al crear un registro' });
    }
  });
  
  // Ruta para actualizar totalmente un registro
  router.put('/:id', verificarToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
  
      const registro = await cliente.findByPk(id);
  
      if (!registro) {
        res.status(404).json({ error: 'Cliente no encontrado' });
      } else {
        Object.keys(registro.dataValues).forEach(field => {
          if (!updatedData.hasOwnProperty(field)) {
            registro[field] = null;
          } else {
            registro[field] = updatedData[field];
          }
        });
  
        await registro.save();
        res.json({ message: 'Actualizado completamente' });
      }
    } catch (error) {
      console.error('Error al actualizar completamente:', error);
      res.status(500).json({ error: 'Error interno al actualizar completamente' });
    }
  });
  
  // Ruta para actualizar parcialmente un registro
  router.patch('/:id', verificarToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
  
      const registro = await cliente.findByPk(id);
  
      if (!registro) {
        res.status(404).json({ error: 'No encontrado' });
      } else {
        await registro.update(updatedData);
        res.json({ message: 'Actualizado parcialmente' });
      }
    } catch (error) {
      console.error('Error al actualizar parcialmente:', error);
      res.status(500).json({ error: 'Error interno al actualizar parcialmente' });
    }
  });
  
  // Ruta para eliminar un registro
  router.delete('/:id', verificarToken, async (req, res) => {
    try {
      const { id } = req.params;
      const registro = await ${modelName}.findByPk(id);
  
      if (!registro) {
        res.status(404).json({ error: '${modelName} no encontrado' });
      } else {
        await registro.destroy();
        res.json({ message: '${modelName} eliminado correctamente' });
      }
    } catch (error) {
      console.error('Error al eliminar el registro:', error);
      res.status(500).json({ error: 'Error al eliminar el registro' });
    }
  });
  
  export default router;
  
  `
}

// Función para crear un archivo en una ubicación
function createFile (directory: string, fileName: string, content: string): void {
  const filePath = path.join(directory, fileName)
  fs.writeFileSync(filePath, content)
  console.log(`Archivo ${filePath} creado.`)
}
