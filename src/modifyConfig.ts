import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import readline from 'node:readline'
import readJSON from './utils/readJSON.js'
import type { Dialect } from 'sequelize/types'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const configPath = path.join(dirname, 'config.json')

const config = readJSON(configPath)
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

export default function modifyConfig (callback: () => void): void {
  rl.question(`Enter new database name (${database.name}): `, (name) => {
    rl.question(`Enter new database user (${database.user}): `, (user) => {
      rl.question('Enter new database password: ', (password) => {
        rl.question(`Enter new database host (${database.host}): `, (host) => {
          let newDialect: Dialect | null = null
          do {
            rl.question(`Enter new database dialect (${database.dialect}): `, (dialectInput) => {
              switch (dialectInput) {
                case 'mysql':
                  newDialect = 'mysql'
                  break
                case 'postgres':
                  newDialect = 'postgres'
                  break
                case 'sqlite' :
                  newDialect = 'sqlite'
                  break
                case 'mariadb' :
                  newDialect = 'mariadb'
                  break
                case 'mssql' :
                  newDialect = 'mssql'
                  break

                default:
                  console.log(`Invalid dialect: ${dialectInput}`)
                  break
              }
              if (newDialect !== null) {
                if (name !== '') database.name = name
                if (user !== '') database.user = user
                database.password = password
                if (host !== '') database.host = host
                database.dialect = newDialect

                fs.writeFile(configPath, JSON.stringify(config, null, 4), 'utf8', (err) => {
                  if (err !== null) {
                    console.error('Error writing config file:', err)
                    process.exit(1)
                  }

                  console.log('Config file modified successfully.')
                  rl.close()

                  const modelsDirectory = path.join(dirname, 'models')
                  const swaggerFilePath = path.join(dirname, 'swagger.json')

                  if (fs.existsSync(modelsDirectory)) {
                    fs.rmSync(modelsDirectory, { recursive: true })
                    console.log('Carpeta "models" eliminada.')
                  }

                  if (fs.existsSync(swaggerFilePath)) {
                    fs.unlinkSync(swaggerFilePath)
                    console.log('Archivo "swagger.json" eliminado.')
                  }
                })
              }
            })
          } while (newDialect === null)
        })
      })
    })
  })
  callback()
}
