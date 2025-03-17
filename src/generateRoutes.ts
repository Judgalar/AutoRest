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

  // Dynamically import models and create files
  for (const file of modelFiles) {
    const modulePath = `./models/${file}`

    const isTsFile = file.endsWith('.ts')
    const modelName = file.replace(isTsFile ? '.ts' : '.js', '')
    if (modelName === undefined || modelName === null || modelName === '' || modelName === 'init-models') continue

    const modelModule = await import(modulePath)

    let modelClass
    if (isTsFile) {
      modelClass = modelModule[modelName]
    } else {
      modelClass = modelModule.default
    }

    if (typeof modelClass === 'undefined' || modelClass === null) {
      console.error(`File ${modulePath} does not contain class ${modelName}, continuing...`)
      continue
    }

    const content = generateRoutesContent(modelName, isTsFile) // Generate the route content here

    const fileName = isTsFile ? `${modelName}.ts` : `${modelName}.js`
    const RoutesPath = path.join(dirname, 'routes')

    createFile(RoutesPath, fileName, content)
  }
}

// Generate route content based on the model
function generateRoutesContent (modelName: string, isTsFile: boolean): string {
  const modelClassString = isTsFile
    ? `const ${modelName}Class = defineModel_${modelName}.${modelName}`
    : `const ${modelName}Class = defineModel_${modelName}.default`

  const initModelFunctionString = isTsFile
    ? `const ${modelName} = ${modelName}Class.initModel(sqlConnection)`
    : `const ${modelName} = ${modelName}Class.init(sqlConnection, DataTypes)`

  return `
  import express from 'express'
  import { sqlConnection } from '../sqlConnection.js'
  import * as defineModel_${modelName} from '../models/${modelName}.js'
  import verifyToken from '../middleware/verifyToken.js'
  import { DataTypes } from 'sequelize'

  
  ${modelClassString}
  ${initModelFunctionString}
  
  const router = express.Router()
  
  // Route to get all records
  router.get('/', async (req, res) => {
    try {
      const data = await ${modelName}.findAll();
      res.json(data);
    } catch (error) {
      console.error('Error fetching records for ${modelName}:', error);
      res.status(500).json({ error: 'Error fetching records' });
    }
  });
  
  // Route to get a record by its ID
  router.get('/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const record = await ${modelName}.findByPk(id);
  
      if (!record) {
        res.status(404).json({ error: '${modelName} not found' });
      } else {
        res.json(record);
      }
    } catch (error) {
      console.error('Error fetching record by ID:', error);
      res.status(500).json({ error: 'Error fetching record by ID' });
    }
  });
  
  // Route to create a new record
  router.post('/', verifyToken, async (req, res) => {
    try {
      const newData = req.body;
      const createdData = await ${modelName}.create(newData);
      res.status(201).json(createdData);
    } catch (error) {
      console.error('Error creating a record:', error);
      res.status(500).json({ error: 'Error creating a record' });
    }
  });
  
  // Route to fully update a record
  router.put('/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
  
      const record = await ${modelName}.findByPk(id);
  
      if (!record) {
        res.status(404).json({ error: '${modelName} not found' });
      } else {
        Object.keys(record.dataValues).forEach(field => {
          if (!updatedData.hasOwnProperty(field)) {
            record[field] = null;
          } else {
            record[field] = updatedData[field];
          }
        });
  
        await record.save();
        res.json({ message: 'Fully updated' });
      }
    } catch (error) {
      console.error('Error fully updating:', error);
      res.status(500).json({ error: 'Internal error while fully updating' });
    }
  });
  
  // Route to partially update a record
  router.patch('/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const updatedData = req.body;
  
      const record = await ${modelName}.findByPk(id);
  
      if (!record) {
        res.status(404).json({ error: 'Not found' });
      } else {
        await record.update(updatedData);
        res.json({ message: 'Partially updated' });
      }
    } catch (error) {
      console.error('Error partially updating:', error);
      res.status(500).json({ error: 'Internal error while partially updating' });
    }
  });
  
  // Route to delete a record
  router.delete('/:id', verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const record = await ${modelName}.findByPk(id);
  
      if (!record) {
        res.status(404).json({ error: '${modelName} not found' });
      } else {
        await record.destroy();
        res.json({ message: '${modelName} successfully deleted' });
      }
    } catch (error) {
      console.error('Error deleting the record:', error);
      res.status(500).json({ error: 'Error deleting the record' });
    }
  });
  
  export default router;
  
  `
}

// Function to create a file at a location
function createFile (directory: string, fileName: string, content: string): void {
  const filePath = path.join(directory, fileName)
  fs.writeFileSync(filePath, content)
  console.log(`File ${filePath} created.`)
}
