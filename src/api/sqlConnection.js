const { Sequelize } = require('sequelize')

const config = require('../config.json')
const { name, user, password, host, dialect } = config.database

const sqlConnection = new Sequelize(name, user, password, {
  host,
  dialect
})

module.exports = { Sequelize, sqlConnection }
