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
  console.log(modelFiles)
  // Importa los modelos dinámicamente y agrega las rutas al objeto de configuración
  for (const file of modelFiles) {
    const modulePath = `./models/${file}`
    if (modulePath === './models/init-models') continue

    const isTsFile = file.endsWith('.ts')
    const modelName = file.replace(isTsFile ? '.ts' : '.js', '')
    if (modelName === undefined || modelName === null || modelName === '') continue

    const defineModelModule = await import(modulePath)

    const defineModel = defineModelModule[modelName]

    if (typeof defineModel === 'undefined' || defineModel === null) {
      console.error(`Error al importar el modelo desde ${modulePath}`)
      continue
    }

    const content = generateRoutesContent(modelName) // Genera el contenido de las rutas aquí

    const fileName = `${modelName}.ts`
    const RoutesPath = path.join(dirname, 'routes')

    createFile(RoutesPath, fileName, content)
  }
}

// Genera el contenido de las rutas basado en el modelo
function generateRoutesContent (modelName: string): string {
  return `
  import express from 'express';
  import * as defineModel_${modelName} from '../models/${modelName}';
  
  const ${modelName} = defineModel_${modelName}.${modelName};
  
  const router = express.Router();
  
/**
 * @swagger
 * /${modelName}:
 *   get:
 *     summary: Obtener todos los registros de ${modelName}
 *     responses:
 *       200:
 *         description: Lista de ${modelName}
 *         content:
 *           application/json:
 *             example:
 *               - codigo_${modelName}: 1
 *                 nombre_${modelName}: ${modelName} 1
 *               - codigo_${modelName}: 2
 *                 nombre_${modelName}: ${modelName} 2  
 *       500:
 *         description: Error al obtener los registros
 *         content:
 *           application/json:
 *             example:
 *               error: Error al obtener los registros
 *   post:
 *     summary: Crear un nuevo registro de ${modelName}
 *     requestBody:
 *       required: true
 *       description: Datos del nuevo registro de ${modelName}
 *       content:
 *         application/json:
 *           schema:
 *             nombre_cliente: Nuevo Cliente
 *             telefono: 123456789
 *     responses:
 *       201:
 *         description: ${modelName} creado exitosamente
 *         content:
 *           application/json:
 *             example:
 *               codigo_cliente: 3
 *               nombre_cliente: Nuevo Cliente
 */

/**
 * @swagger
 * /clientes/{id}:
 *   get:
 *     summary: Obtener un registro de ${modelName} por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de ${modelName}
 *     responses:
 *       200:
 *         description: Detalles de ${modelName}
 *         content:
 *           application/json:
 *             example:
 *               codigo_cliente: 1
 *               nombre_cliente: Cliente 1
 *   put:
 *     summary: Actualizar un registro de ${modelName} por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de ${modelName}
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           example:
 *             nombre_cliente: Cliente Modificado
 *     responses:
 *       200:
 *         description: ${modelName} actualizado exitosamente
 *   delete:
 *     summary: Eliminar un registro de ${modelName} por su ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID de ${modelName}
 *     responses:
 *       200:
 *         description: ${modelName} eliminado exitosamente
 */
  
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
  router.post('/', async (req, res) => {
    try {
      const newData = req.body;
      const createdData = await ${modelName}.create(newData);
      res.status(201).json(createdData);
    } catch (error) {
      console.error('Error al crear un registro:', error);
      res.status(500).json({ error: 'Error al crear un registro' });
    }
  });
  
  // Ruta para actualizar un registro
  router.put('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
      const registro = await ${modelName}.findByPk(id);
  
      if (!registro) {
        res.status(404).json({ error: '${modelName} no encontrado' });
      } else {
        await registro.update(updatedData);
        res.json({ message: '${modelName} actualizado correctamente' });
      }
    } catch (error) {
      console.error('Error al actualizar:', error);
      res.status(500).json({ error: 'Error al actualizar' });
    }
  });
  
  // Ruta para eliminar un registro
  router.delete('/:id', async (req, res) => {
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
