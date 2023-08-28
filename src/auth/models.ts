import { Sequelize, DataTypes } from 'sequelize'

// Configuración de la conexión a la base de datos
const sequelizeAuth = new Sequelize('autoapi', 'root', '', {
  host: 'localhost',
  dialect: 'mysql'
})

// Definición del modelo users
const users = sequelizeAuth.define('users', {
  id: {
    type: DataTypes.INTEGER,
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
  timestamps: false // Desactivar las columnas "createdAt" y "updatedAt"
})

export { users }
