const { Sequelize, DataTypes } = require('sequelize')
const pc = require('picocolors')

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
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  salt: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  timestamps: false // Desactivar las columnas "createdAt" y "updatedAt"
})

// Definición del modelo Token
const tokens = sequelizeAuth.define('tokens', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
})

// Establecer las relaciones entre los modelos
users.hasMany(tokens, { onDelete: 'CASCADE' })
tokens.belongsTo(users)

// Sincronizar los modelos con la base de datos
sequelizeAuth.sync()
  .then(() => {
    console.log(pc.green('Modelos sincronizados correctamente'))
  })
  .catch((error) => {
    console.error('Error al sincronizar modelos:', error)
  })

module.exports = { sequelizeAuth, users, tokens }
