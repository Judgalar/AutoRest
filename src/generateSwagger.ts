import swaggerAutogen from 'swagger-autogen'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import pc from 'picocolors'

import { port } from './constants.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Rutas de archivos y configuraciones
const configPath = path.join(dirname, 'config.json')

const swaggerFilePath = path.join(dirname, 'swagger.json')
const serverFilePath = path.join(dirname, 'main')
const endpointsFiles = [serverFilePath]

// Cargar configuración
const jsonConfig = fs.readFileSync(configPath, 'utf-8')
const config = JSON.parse(jsonConfig)

if (config === null) {
  throw new Error('No se pudo leer la configuración desde el archivo JSON.')
}
const dbName = config.database.name

// const swaggerAutogenInstance = swaggerAutogen({ openapi: '3.1.0' })

// Definir la información del documento Swagger
const doc = {
  info: {
    title: `${dbName}`,
    description: 'API REST generada automáticamente',
    version: '1.0.0'
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Servidor local'
    }
  ],
  components: {
    schemas: {}
  },
  paths: {}
}

interface ModelSchema {
  properties: Record<string, { type: string }>
}

export default async function generarSwagger (): Promise<void> {
  // Obtener lista de archivos de modelos
  const modelsPath = path.join(dirname, 'models')
  const modelFiles = fs.readdirSync(modelsPath)

  try {
    // Generar la documentación Swagger
    await swaggerAutogen({ openapi: '3.1.0' })(swaggerFilePath, endpointsFiles, doc)

    // Leer el archivo Swagger generado
    const jsonSwagger = fs.readFileSync(swaggerFilePath, 'utf-8')
    const swaggerDocument = JSON.parse(jsonSwagger)

    // Agregar rutas para cada modelo
    for (const file of modelFiles) {
      const modulePath = `./models/${file}`
      if (modulePath === './models/init-models.js') continue
      const defineModelModule = await import(modulePath)
      const model = defineModelModule.default

      const modelName = model.name
      if (modelName === undefined) continue
      // Generar el esquema del modelo dinámicamente
      const modelAttributes = model.rawAttributes
      const modelSchema: ModelSchema = {
        properties: {}
      }

      for (const attrName in modelAttributes) {
        const attribute = modelAttributes[attrName]
        modelSchema.properties[attrName] = {
          type: attribute.type.key.toLowerCase()
        }
      }

      // Agregar el esquema del modelo a components/schemas
      swaggerDocument.components.schemas[modelName] = modelSchema

      swaggerDocument.paths[`/${modelName}`] = {
        get: {
          tags: [modelName],
          description: `Obtener todos los registros de ${modelName}`,
          produces: ['application/json'],
          responses: {
            200: {
              description: 'OK',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      $ref: `#/components/schemas/${modelName}`
                    }
                  }
                }
              }
            },
            500: {
              description: `Error al obtener los registros de ${modelName}`
            }
          }
        },
        post: {
          tags: [modelName],
          description: `Crea un nuevo registro de ${modelName}`,
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${modelName}`
                }
              }
            }
          },
          responses: {
            201: {
              description: `Registro de ${modelName} creado correctamente`,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${modelName}`
                  }
                }
              }
            },
            500: {
              description: `Error al crear el registro de ${modelName}`
            }
          }
        }
      }

      swaggerDocument.paths[`/${modelName}/{id}`] = {
        get: {
          tags: [modelName],
          description: `Obtiene un registro de ${modelName} por su ID`,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID del registro',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: `Registro de ${modelName} encontrado`,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${modelName}`
                  }
                }
              }
            },
            404: {
              description: `No se encontró el registro de ${modelName}`
            },
            500: {
              description: `Error al obtener el registro de ${modelName}`
            }
          }
        },
        put: {
          tags: [modelName],
          description: `Actualiza un registro de ${modelName} por su ID`,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID del registro',
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${modelName}`
                }
              }
            }
          },
          responses: {
            200: {
              description: `Registro de ${modelName} actualizado correctamente`
            },
            404: {
              description: `No se encontró el registro de ${modelName}`
            },
            500: {
              description: `Error al actualizar el registro de ${modelName}`
            }
          }
        },
        patch: {
          tags: [modelName],
          description: `Actualiza parcialmente un registro de ${modelName} por su ID`,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID del registro',
              schema: {
                type: 'string'
              }
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${modelName}`
                }
              }
            }
          },
          responses: {
            200: {
              description: `Registro de ${modelName} actualizado correctamente`
            },
            404: {
              description: `No se encontró el registro de ${modelName}`
            },
            500: {
              description: `Error al actualizar parcialmente el registro de ${modelName}`
            }
          }
        },
        delete: {
          tags: [modelName],
          description: `Elimina un registro de ${modelName} por su ID`,
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              description: 'ID del registro',
              schema: {
                type: 'string'
              }
            }
          ],
          responses: {
            200: {
              description: `Registro de ${modelName} eliminado correctamente`
            },
            404: {
              description: `No se encontró el registro de ${modelName}`
            },
            500: {
              description: `Error al eliminar el registro de ${modelName}`
            }
          }
        }
      }
    }

    // Convertir el objeto swaggerDocument de vuelta a una cadena JSON
    const jsonModificado = JSON.stringify(swaggerDocument, null, 2)

    // Escribir la cadena JSON modificada en el archivo swagger.json
    fs.writeFileSync(swaggerFilePath, jsonModificado)

    console.log(pc.green('Fichero Swagger.json generado correctamente'))
  } catch (error) {
    console.error('Error al generar la documentación Swagger:', error)
    throw (error)
  }
}
