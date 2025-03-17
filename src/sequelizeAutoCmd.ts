import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'
import pc from 'picocolors'
import { sqlConnection } from './sqlConnection.js'
import dotenv from 'dotenv'

dotenv.config()

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Use environment variables instead
const { DB_NAME: name, DB_USER: user, DB_PASSWORD: password, DB_HOST: host, DB_PORT: port = '3306', DB_DIALECT: dialect } = process.env

if ((name == null) || (user == null) || (password == null) || (host == null) || (dialect == null)) {
  throw new Error('Missing required database environment variables.')
}

const output = path.join(dirname, 'models')

async function executeSequelizeAuto (cmd: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const sequelizeAuto = spawn(cmd, args)

    sequelizeAuto.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`)
    })

    sequelizeAuto.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`)
    })

    sequelizeAuto.on('close', (code) => {
      console.log(`Child process exited with code ${code}`)
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`sequelize-auto process exited with code ${code}`))
      }
    })

    sequelizeAuto.on('error', (err) => {
      console.error('Error executing sequelize-auto:', err)
      reject(err)
    })
  })
}

// Current file extension
const fileExtension = path.extname(filename)

const isTsFile = fileExtension === '.ts'
const lang = isTsFile ? 'ts' : 'esm'

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const args: string[] = [
  'sequelize-auto',
  '-o', output,
  '-d', name,
  '-h', host,
  '-u', user,
  '-p', port,
  '-x', password,
  '-e', dialect,
  '-l', lang
]
try {
  await sqlConnection.authenticate()

  await executeSequelizeAuto(cmd, args)
  console.log(pc.green('sequelize-auto process completed successfully'))
} catch (error) {
  console.error(pc.red('sequelize-auto process failed:'), error)
}
