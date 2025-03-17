import { Sequelize } from 'sequelize'

const sequelizeAuth = new Sequelize({
  dialect: 'sqlite',
  storage: './data/autorest.db',
  logging: false
})

export default sequelizeAuth
