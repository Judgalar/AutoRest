import { Sequelize } from 'sequelize'
import type { Dialect } from 'sequelize/types'
import readJSON from './utils/readJSON.js'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const configFilePath = path.join(dirname, './config.json')
const config = readJSON(configFilePath)

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

const sqlConnection = new Sequelize(
  database.name,
  database.user,
  database.password,
  {
    host: database.host,
    dialect: database.dialect
  }
)

export { Sequelize, sqlConnection }
