import { Sequelize } from 'sequelize'
import type { Dialect } from 'sequelize/types'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

dotenv.config({ path: path.join(dirname, '.env') })

const database = {
  name: process.env.DB_NAME ?? (() => { throw new Error('DB_NAME is not defined in environment variables.') })(),
  user: process.env.DB_USER ?? (() => { throw new Error('DB_USER is not defined in environment variables.') })(),
  password: process.env.DB_PASSWORD ?? (() => { throw new Error('DB_PASSWORD is not defined in environment variables.') })(),
  host: process.env.DB_HOST ?? (() => { throw new Error('DB_HOST is not defined in environment variables.') })(),
  dialect: process.env.DB_DIALECT as Dialect ?? (() => { throw new Error('DB_DIALECT is not defined in environment variables.') })(),
  port: parseInt(process.env.DB_PORT ?? '0', 10)
}

if (
  database.name === undefined || database.name === '' ||
  database.user === undefined || database.user === '' ||
  database.password === undefined ||
  database.host === undefined || database.host === '' ||
  database.dialect === undefined || database.dialect === null
) {
  throw new Error('Missing required database configuration in environment variables.')
}

const sqlConnection = new Sequelize(
  database.name,
  database.user,
  database.password,
  {
    host: database.host,
    port: database.port,
    dialect: database.dialect
  }
)

export { Sequelize, sqlConnection }
