import { DataTypes, Model, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelizeAuth from '../database.js'

class User extends Model<InferAttributes<User>, InferCreationAttributes<User, { omit: 'id' }>> {
  declare id: number
  declare username: string
  declare password: string
}

User.init({
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
  sequelize: sequelizeAuth,
  tableName: 'users',
  timestamps: false
})

export default User
