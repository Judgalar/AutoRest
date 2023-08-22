const SequelizeAuto = require('sequelize-auto')
const { join } = require('node:path')
const pc = require('picocolors')

const config = require('./config.json')

const { name, user, password, host, dialect } = config.database
const { caseModel, caseFile, additional } = config.autoModels

const auto = new SequelizeAuto(name, user, password, {
  host,
  dialect,
  caseModel,
  caseFile,
  additional,
  directory: join(__dirname, 'api/models') // Directorio donde se generarán los modelos

});

(
  async () => {
    try {
      await auto.run()
      console.log(pc.green('Los modelos se han generado exitosamente.'))
    } catch (err) {
      console.error(pc.red('Error al generar los modelos:', err))
    }
  }
)()
