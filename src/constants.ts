import { config } from 'dotenv'

config()

let port: number

if (process.env.PORT !== undefined) {
  port = parseInt(process.env.PORT)
} else {
  port = 3000
}

export { port }
