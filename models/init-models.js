var DataTypes = require("sequelize").DataTypes;
var _Productos = require("./Productos");
var _Usuarios = require("./Usuarios");

function initModels(sequelize) {
  var Productos = _Productos(sequelize, DataTypes);
  var Usuarios = _Usuarios(sequelize, DataTypes);


  return {
    Productos,
    Usuarios,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
