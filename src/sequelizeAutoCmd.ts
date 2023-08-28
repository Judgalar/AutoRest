import { spawn } from 'child_process'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import pc from 'picocolors'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const jsonConfig = fs.readFileSync(path.join(dirname, 'config.json'), 'utf-8')
if (jsonConfig === null) {
  throw new Error('No se pudo leer la configuración desde el archivo JSON.')
}
const config = JSON.parse(jsonConfig)

const { name, user, password, host, dialect } = config.database

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
      console.log(`child process exited with code ${code}`)
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

export default async function sequelizeAutoESM (): Promise<void> {
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
  const args = [
    'sequelize-auto',
    '-o', output,
    '-d', name,
    '-h', host,
    '-u', user,
    '-p', 3306,
    '-x', password,
    '-e', dialect,
    '-l', 'ts' // Use the -l es6 option to generate ES6 classes
  ]
  try {
    await executeSequelizeAuto(cmd, args)
    console.log(pc.green('sequelize-auto process completed successfully'))
  } catch (error) {
    console.error(pc.red('sequelize-auto process failed:'), error)
  }
}
