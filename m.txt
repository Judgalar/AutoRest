import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import pc from 'picocolors'
import { sqlConnection } from './src/sqlConnection.js'
import modifyConfig from './src/modifyConfig.js'
import server from './src/main.js'
import { port } from './src/constants.js'
import generateModels from './src/generateModels.js'
import generateRoutes from './src/generateRoutes.js'
import generateSwagger from './src/generateSwagger.js'
const args = process.argv.slice(2)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const modelsDirectory = path.join(dirname, 'src', 'api', 'models.js')
const routesDirectory = path.join(dirname, 'src', 'api', 'routes.js')
const swaggerFile = path.join(dirname, 'src', 'api', 'swagger.json')

try {
  await generateModels()
  console.log('modelos generados')
} catch (e) {
  console.log('problema al generar los modelos', e)
}

try {
  await generateRoutes()
  console.log('modelos generados')
} catch (e) {
  console.log('problema al generar las rutas', e)
}

generateSwagger()

function deleteModels (): void {
  if (fs.existsSync(modelsDirectory)) {
    try {
      fs.rmSync(modelsDirectory, { recursive: true })
      console.log(`Directorio ${modelsDirectory} eliminado con éxito.`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Error al eliminar el directorio: ${err.message}`)
      } else {
        console.error('Error desconocido al eliminar el directorio.')
      }
    }
  }
}

function deleteRoutes (): void {
  if (fs.existsSync(routesDirectory)) {
    try {
      fs.rmSync(routesDirectory, { recursive: true })
      console.log(`Directorio ${routesDirectory} eliminado con éxito.`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Error al eliminar el directorio: ${err.message}`)
      } else {
        console.error('Error desconocido al eliminar el directorio.')
      }
    }
  }
}

function deleteSwagger (): void {
  if (fs.existsSync(swaggerFile)) {
    try {
      fs.rmSync(swaggerFile)
      console.log(`Fichero ${swaggerFile} eliminado con éxito.`)
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(`Error al eliminar el fichero: ${err.message}`)
      } else {
        console.error('Error desconocido al eliminar el fichero.')
      }
    }
  }
}

async function startServer (): Promise<void> {
  await sqlConnection.authenticate()

  if (!fs.existsSync(modelsDirectory)) {
    console.log(pc.blue('Directorio models no encontrado. Generando modelos...'))
    try {
      await generateModels()
    } catch (error) {
      console.error(error)
      process.exit(1) // Cierra la aplicacion si la generacion de modelos falla.
    }
  }

  const swaggerPromise = !fs.existsSync(swaggerFile)
    ? (async () => {
        console.log(pc.blue('swagger.json no encontrado. Generando swagger...'))
        generateSwagger()
      })()
    : Promise.resolve()

  const routesPromise = !fs.existsSync(routesDirectory)
    ? (async () => {
        console.log(pc.blue('Directorio routes no encontrado. Generando routes...'))
        try {
          await generateRoutes()
        } catch (error) {
          console.error(error)
          process.exit(1)
        }
      })()
    : Promise.resolve()

  // Esperar a que las promesas de swagger y routes se resuelvan en paralelo
  await Promise.all([swaggerPromise, routesPromise])

  // Iniciar el servidor
  server.listen(port, () => {
    console.log(pc.bgYellow(` Servidor iniciado en el puerto ${port} `))
  })
}

if (args.includes('--config') || args.includes('-c')) {
  modifyConfig(() => {
    try {
      deleteModels()
      deleteRoutes()
      deleteSwagger()
    } catch (error) {
      console.error(error)
      process.exit(1)
    }
  })
} else {
  await startServer()
}
