import { type Options } from 'swagger-jsdoc'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { port } from './constants.js'
import { type Dialect } from 'sequelize/types'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Rutas de archivos y configuraciones
const configPath = path.join(dirname, 'config.json')
// Cargar configuración
const jsonConfig = fs.readFileSync(configPath, 'utf-8')
const config = JSON.parse(jsonConfig)

if (config === null) {
  throw new Error('No se pudo leer la configuración desde el archivo JSON.')
}

const database = config.database as {
  name: string
  user: string
  password: string
  host: string
  dialect: Dialect
}

const options: Options = {
  // Especifica la ruta a tus archivos que contienen comentarios JSDoc.
  apis: [
    './src/routes/**/*'
  ],
  // Opcional: especifica las opciones de Swagger aquí, como info, host, etc.
  definition: {
    openapi: '3.1.0',
    info: {
      title: `${database.name}`,
      description: 'API REST generada automáticamente',
      version: '1.0.0'
    },
    servers: [
      {
        url: `http://${database.host}:${port}`
      }
    ],
    components: {
      schemas: {},
      securitySchemes: {
        bearerAuth: { // Define el esquema de seguridad Bearer
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths: {},
    security: [ // Agrega aquí la seguridad a nivel de ruta si es necesario
      {
        bearerAuth: [] // Usar el esquema de seguridad definido
      }
    ]
  }
}

export default options
