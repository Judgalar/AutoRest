const swaggerAutogen = require('swagger-autogen')({ openapi: '3.1.0' })
const { join } = require('path')
const fs = require('fs')
const pc = require('picocolors')

const { port } = require('./api/constants.js')
const { Sequelize, sqlConnection } = require('./api/sqlConnection.js')

// Rutas de archivos y configuraciones
const swaggerFilePath = join(__dirname, 'api', 'swagger.json')
const serverFilePath = join(__dirname, 'api', 'server.js')
const endpointsFiles = [serverFilePath]

// Cargar configuración
const config = require('./config.json')

// Obtener lista de archivos de modelos
const modelsPath = join(__dirname, 'api', 'models')
const modelFiles = fs.readdirSync(modelsPath)

// Definir la información del documento Swagger
const doc = {
  info: {
    title: `${config.database.name}`,
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

// Generar la documentación Swagger
swaggerAutogen(swaggerFilePath, endpointsFiles, doc)
  .then(() => {
    // Leer el archivo Swagger generado
    const jsonData = fs.readFileSync(swaggerFilePath, 'utf-8')
    const swaggerDocument = JSON.parse(jsonData)

    // Agregar rutas para cada modelo
    modelFiles.forEach((file) => {
      const model = require(join(modelsPath, file))(sqlConnection, Sequelize.DataTypes)
      const modelName = model.name
      if (modelName !== undefined) {
        // Generar el esquema del modelo dinámicamente
        const modelAttributes = model.rawAttributes
        const modelSchema = {
          type: 'object',
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
    })

    // Convertir el objeto swaggerDocument de vuelta a una cadena JSON
    const jsonModificado = JSON.stringify(swaggerDocument, null, 2)

    // Escribir la cadena JSON modificada en el archivo swagger.json
    fs.writeFileSync(swaggerFilePath, jsonModificado)
  })
  .then(() => {
    console.log(pc.green('Fichero Swagger.json generado correctamente'))
  })
  .catch((error) => {
    console.error('Error al generar la documentación Swagger:', error)
  })
