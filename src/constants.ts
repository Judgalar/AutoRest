import dotenv from 'dotenv'

dotenv.config()

let port: number
if (process.env.PORT !== undefined) {
  port = parseInt(process.env.PORT)
} else {
  port = 3000
}

let useSwaggerUI: boolean = true
if (process.env.SWAGGERUI !== undefined) {
  useSwaggerUI = (process.env.SWAGGERUI === 'true' || process.env.SWAGGERUI === 'TRUE')
}

export { port, useSwaggerUI }
