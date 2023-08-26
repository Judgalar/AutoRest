import { SequelizeAuto, type AutoOptions } from 'sequelize-auto'
import { type Dialect } from 'sequelize/types'
import path from 'path'
import pc from 'picocolors'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import fs from 'fs/promises'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const configFilePath = path.join(dirname, './config.json')
const jsonConfig = readFileSync(configFilePath, 'utf-8')
if (jsonConfig === null) {
  throw new Error('No se pudo leer la configuración desde el archivo JSON.')
}
const config = JSON.parse(jsonConfig)

const database = config.database as {
  name: string
  user: string
  password: string
  host: string
  dialect: Dialect
}

const automodels = config.autoModels as AutoOptions

const { name, user, password, host, dialect } = database
const { caseModel, caseFile, additional } = automodels

const auto = new SequelizeAuto(name, user, password, {
  host,
  dialect,
  caseModel,
  caseFile,
  additional,
  directory: path.join(dirname, 'models'), // Directorio donde se generarán los modelos
  singularize: false, // Agrega esta propiedad con el valor adecuado
  useDefine: true // Agrega esta propiedad con el valor adecuado
})

export default async function generateModels (): Promise<void> {
  await auto.run()

  // Obtener la lista de archivos generados
  const modelFiles = await fs.readdir(auto.options.directory)

  // Renombrar los archivos generados de .js a .cjs
  for (const modelFile of modelFiles) {
    if (modelFile.endsWith('.js')) {
      const oldPath = path.join(auto.options.directory, modelFile)
      const newFileName = modelFile.replace('.js', '.cjs')
      const newPath = path.join(auto.options.directory, newFileName)
      await fs.rename(oldPath, newPath)
    }
  }
  console.log(pc.green('Los modelos se han generado exitosamente.'))
}
