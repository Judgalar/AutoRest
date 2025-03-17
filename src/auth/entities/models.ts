import { Sequelize, DataTypes } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config()

// BD connection configuration
const sequelizeAuth = new Sequelize(
  process.env.APP_DB_DATABASE ?? 'autorest',
  process.env.APP_DB_USERNAME ?? 'root',
  process.env.APP_DB_PASSWORD ?? '',
  {
    host: 'localhost',
    dialect: 'mysql'
  }
)

// User model definition
const User = sequelizeAuth.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(30),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: false
})

export { User }
