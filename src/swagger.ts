import swaggerAutogen from 'swagger-autogen'
import fs from 'fs'
import pc from 'picocolors'
import path from 'path'
import { fileURLToPath } from 'url'
import { port } from './constants.js'
import { sqlConnection } from './sqlConnection.js'
import { type Dialect } from 'sequelize/types'
import { DataTypes } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Load configuration from .env
const database = {
  name:
    process.env.DB_NAME ??
    (() => {
      throw new Error('DB_NAME is not defined in environment variables.')
    })(),
  user:
    process.env.DB_USER ??
    (() => {
      throw new Error('DB_USER is not defined in environment variables.')
    })(),
  password:
    process.env.DB_PASSWORD ??
    (() => {
      throw new Error('DB_PASSWORD is not defined in environment variables.')
    })(),
  host:
    process.env.DB_HOST ??
    (() => {
      throw new Error('DB_HOST is not defined in environment variables.')
    })(),
  dialect:
    (process.env.DB_DIALECT as Dialect) ??
    (() => {
      throw new Error('DB_DIALECT is not defined in environment variables.')
    })()
}

if (
  database.name === undefined ||
  database.name === '' ||
  database.user === undefined ||
  database.user === '' ||
  database.password === undefined ||
  database.host === undefined ||
  database.host === '' ||
  database.dialect === undefined ||
  database.dialect === null
) {
  throw new Error(
    'Missing required database configuration in environment variables.'
  )
}

const doc = {
  info: {
    version: '', // default: '1.0.0'
    title: `${database.name}`,
    description: 'Automatically generated REST API'
  },
  servers: [
    {
      url: `http://${database.host}:${port}`
    }
  ],
  consumes: [], // default: ['application/json']
  produces: [], // default: ['application/json']
  tags: [], // default: empty array
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

// Generate Swagger documentation
export default async function generateSwagger (): Promise<void> {
  try {
    await swaggerAutogen({ openapi: '3.1.0' })(swaggerFilePath, endpointsFiles, doc)

    // Read the generated Swagger file
    const jsonData = fs.readFileSync(swaggerFilePath, 'utf-8')
    const swaggerDocument = JSON.parse(jsonData)

    // Get list of model files
    const modelsPath = path.join(dirname, 'models')
    const modelFiles = fs.readdirSync(modelsPath)

    swaggerDocument.paths['/auth/signup'] = {
      post: {
        tags: ['Sign Up'],
        description: 'Register API user',
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
            description: 'User already exists'
          },
          500: {
            description: 'Error creating the record'
          }
        }
      }
    }

    swaggerDocument.paths['/auth/token'] = {
      post: {
        tags: ['GenerateToken'],
        description: 'Generate a token for an authenticated user',
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
            description: 'Token successfully generated',
            content: {
              'application/json': {
                example: {
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXIiLCJpYXQiOjE2MzA0NjA3NjEsImV4cCI6MTYzMDQ2NDM2MX0.xxxxxxxxxxxxxxx'
                }
              }
            }
          },
          401: {
            description: 'Incorrect credentials'
          },
          500: {
            description: 'Internal server error'
          }
        }
      }
    }

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

      const model = isTsFile ? modelClass.initModel(sqlConnection) : modelClass.init(sqlConnection, DataTypes)

      // Generate the model schema dynamically
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

      const primaryKeyType = getPrimaryKeyType(modelClass)

      // Add the model schema to components/schemas
      swaggerDocument.components.schemas[modelName] = modelSchema

      swaggerDocument.paths[`/${modelName}`] = {
        get: {
          tags: [modelName],
          description: `Get all records of ${modelName}`,
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
              description: `Error retrieving records of ${modelName}`
            }
          }
        },
        post: {
          tags: [modelName],
          description: `Create a new record of ${modelName}`,
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
              description: `${modelName} record created successfully`,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${modelName}`
                  }
                }
              }
            },
            500: {
              description: `Error creating ${modelName} record`
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
          description: `Get a ${modelName} record by its PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey of the record',
              schema: {
                type: primaryKeyType
              }
            }
          ],
          responses: {
            200: {
              description: `${modelName} record found`,
              content: {
                'application/json': {
                  schema: {
                    $ref: `#/components/schemas/${modelName}`
                  }
                }
              }
            },
            404: {
              description: `${modelName} record not found`
            },
            500: {
              description: `Error retrieving ${modelName} record`
            }
          }
        },
        put: {
          tags: [modelName],
          description: `Update a ${modelName} record by its PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey of the record',
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
              description: `${modelName} record updated successfully`
            },
            404: {
              description: `${modelName} record not found`
            },
            500: {
              description: `Error updating ${modelName} record`
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
          description: `Partially update a ${modelName} record by its PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey of the record',
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
              description: `${modelName} record partially updated`
            },
            404: {
              description: `${modelName} record not found`
            },
            500: {
              description: `Error partially updating ${modelName} record`
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
          description: `Delete a ${modelName} record by its PrimaryKey`,
          parameters: [
            {
              name: 'pk',
              in: 'path',
              required: true,
              description: 'PrimaryKey of the record',
              schema: {
                type: primaryKeyType
              }
            }
          ],
          responses: {
            200: {
              description: `${modelName} record deleted successfully`
            },
            404: {
              description: `${modelName} record not found`
            },
            500: {
              description: `Error deleting ${modelName} record`
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

    // Convert the swaggerDocument object back to a JSON string
    const modifiedJson = JSON.stringify(swaggerDocument, null, 2)
    // Write the modified JSON string to the swagger.json file
    fs.writeFileSync(swaggerFilePath, modifiedJson)

    console.log(pc.green('Swagger.json file generated successfully'))
  } catch (error) {
    console.error('Error generating Swagger documentation:', error)
  }
}

function getPrimaryKeyType (modelClass: any): string {
  const primaryKeyField = Object.keys(modelClass.rawAttributes as Record<string, any>).find(
    (fieldName) => modelClass.rawAttributes[fieldName].primaryKey
  )

  if (primaryKeyField !== null && primaryKeyField !== undefined) {
    return modelClass.rawAttributes[primaryKeyField].type.key.toLowerCase()
  }

  // Error handling if the primary key is not found
  throw new Error(`Primary key not found in model ${modelClass.name}`)
}
