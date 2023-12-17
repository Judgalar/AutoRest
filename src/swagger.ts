import swaggerAutogen from 'swagger-autogen'
import fs from 'fs'
import pc from 'picocolors'
import path from 'path'
import { fileURLToPath } from 'url'
import { port } from './constants.js'
import { sqlConnection } from './sqlConnection.js'
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

const doc = {
  info: {
    version: '', // por defecto: '1.0.0'
    title: `${database.name}`,
    description: 'API REST generada automáticamente'
  },
  servers: [
    {
      url: `http://${database.host}:${port}`
    }
  ],
  consumes: [], // por defecto: ['application/json']
  produces: [], // por defecto: ['application/json']
  tags: [], // por defecto: array vacio
  securityDefinitions: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT'
    }
  },
  components: {
    schemas: {}
  }
}

const swaggerFilePath = path.join(dirname, 'swagger.json')
const endpointsFiles = ['./main']

// Generar la documentación Swagger
export default async function generateSwagger (): Promise<void> {
  try {
    await swaggerAutogen({ openapi: '3.1.0' })(swaggerFilePath, endpointsFiles, doc)

    // Leer el archivo Swagger generado
    const jsonData = fs.readFileSync(swaggerFilePath, 'utf-8')
    const swaggerDocument = JSON.parse(jsonData)

    // Obtener lista de archivos de modelos
    const modelsPath = path.join(dirname, 'models')
    const modelFiles = fs.readdirSync(modelsPath)

    swaggerDocument.paths['/auth/registro'] = {
      post: {
        tags: ['Registro'],
        description: 'Registrar usuario de la API',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string'
                  },
                  password: {
                    type: 'string'
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'OK'
          },
          409: {
            description: 'El usuario ya existe'
          },
          500: {
            description: 'Error al crear el registro'
          }
        }
      }
    }

    swaggerDocument.paths['/auth/token'] = {
      post: {
        tags: ['GenerarToken'],
        description: 'Generar un token para un usuario autenticado',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  username: {
                    type: 'string'
                  },
                  password: {
                    type: 'string'
                  }
                },
                required: ['username', 'password']
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Token generado exitosamente',
            content: {
              'application/json': {
                example: {
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpYXQiOjE2MzA0NjA3NjEsImV4cCI6MTYzMDQ2NDM2MX0.xxxxxxxxxxxxxxx'
                }
              }
            }
          },
          401: {
            description: 'Credenciales incorrectas'
          },
          500: {
            description: 'Error interno del servidor'
          }
        }
      }
    }

    for (const file of modelFiles) {
      const modulePath = `./models/${file}`

      const isTsFile = file.endsWith('.ts')
      const modelName = file.replace(isTsFile ? '.ts' : '.js', '')
      if (modelName === undefined || modelName === null || modelName === '' || modelName === 'init-models') continue

      const defineModelModule = await import(modulePath)

      const modelClass = defineModelModule[modelName]

      if (typeof modelClass === 'undefined' || modelClass === null) {
        console.error(`Fichero ${modulePath} no contiene clase ${modelName}, continuando...`)
        continue
      }

      const model = modelClass.initModel(sqlConnection)

      // const model = await import(join(modelsPath, file))(sqlConnection, Sequelize.DataTypes)

      // Generar el esquema del modelo dinámicamente
      const modelAttributes = model.rawAttributes
      const modelSchema: {
        type: string
        properties: Record<string, { type: string }>
      } = {
        type: 'object',
        properties: {}
      }

      for (const attrName in modelAttributes) {
        const attribute = modelAttributes[attrName]
        modelSchema.properties[attrName] = {
          type: attribute.type.key.toLowerCase()
        }
      }

      const primaryKeyType = getPrimaryKeyType(modelClass);

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
          },
          security: [
            {
              bearerAuth: []
            }
          ]
        }
      }

      swaggerDocument.paths[`/${modelName}/{pk}`] = {
        get: {
          tags: [modelName],
          description: `Obtiene un registro de ${modelName} por su PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey del registro',
              schema: {
                type: primaryKeyType
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
          description: `Actualiza un registro de ${modelName} por su PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey del registro',
              schema: {
                type: primaryKeyType
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
          },
          security: [
            {
              bearerAuth: []
            }
          ]
        },
        patch: {
          tags: [modelName],
          description: `Actualiza parcialmente un registro de ${modelName} por su PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey del registro',
              schema: {
                type: primaryKeyType
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
          },
          security: [
            {
              bearerAuth: []
            }
          ]
        },
        delete: {
          tags: [modelName],
          description: `Elimina un registro de ${modelName} por su PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey del registro',
              schema: {
                type: primaryKeyType
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
          },
          security: [
            {
              bearerAuth: []
            }
          ]
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
  }
}

function getPrimaryKeyType(modelClass: any) {
  const primaryKeyField = Object.keys(modelClass.rawAttributes).find(
    (fieldName) => modelClass.rawAttributes[fieldName].primaryKey
  );

  if (primaryKeyField) {
    return modelClass.rawAttributes[primaryKeyField].type.key.toLowerCase();
  }

  // Manejo de errores si no se encuentra la clave primaria
  throw new Error(`No se encontró la clave primaria en el modelo ${modelClass.name}`);
}
