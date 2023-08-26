import { type Options } from 'swagger-jsdoc'
import path from 'path'

const options: Options = {
  // Especifica la ruta a tus archivos que contienen comentarios JSDoc.
  apis: [
    './src/routes/**/*.ts'
  ],
  // Opcional: especifica las opciones de Swagger aquí, como info, host, etc.
  swaggerDefinition: {
    info: {
      title: 'API Documentation',
      version: '1.0.0'
    }
    // ... otras opciones de Swagger
  }
}

export default options
