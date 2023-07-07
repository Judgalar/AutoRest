const express = require('express');
const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');
const { Sequelize } = require('sequelize');


const configPath = './config.json';
const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const { name, user, password, host, dialect } = config.database;

const app = express();
const port = 3000;

const sequelize = new Sequelize(name, user, password, {
    host,
    dialect
});

const modelsPath = join(__dirname, 'models');
const modelFiles = readdirSync(modelsPath);

// Importa los modelos dinámicamente
modelFiles.forEach((file) => {
    const model = require(join(modelsPath, file))(sequelize, Sequelize.DataTypes);
    // Asume que cada archivo de modelo exporta una función que recibe el objeto Sequelize y los DataTypes como argumentos y devuelve el modelo definido
    const modelName = model.name; // Nombre del modelo (asumimos que el modelo tiene una propiedad "name")

    //RUTAS 
    // Ruta para obtener todos los registros
    app.get(`/${modelName}`, async (req, res) => {
        try {
            const data = await model.findAll();
            res.json(data);
        } catch (error) {
            console.error(`Error al obtener los registros de ${modelName}:`, error);
            res.status(500).json({ error: `Error al obtener los registros de ${modelName}` });
        }
    });

    // Ruta para crear un nuevo registro
    app.post(`/${modelName}`, async (req, res) => {
        try {
            const newData = req.body;
            const createdData = await model.create(newData);
            res.status(201).json(createdData);
        } catch (error) {
            console.error(`Error al crear un registro de ${modelName}:`, error);
            res.status(500).json({ error: `Error al crear un registro de ${modelName}` });
        }
    });

    // Ruta para obtener un registro por su ID
    app.get(`/${modelName}/:id`, async (req, res) => {
        try {
            const { id } = req.params;
            const registro = await model.findByPk(id);
            if (!registro) {
                res.status(404).json({ error: `${modelName} no encontrado` });
            } else {
                res.json(registro);
            }
        } catch (error) {
            console.error(`Error al obtener ${modelName} por ID:`, error);
            res.status(500).json({ error: `Error al obtener ${modelName} por ID` });
        }
    });

    // Otras rutas para el modelo actual
});

// MIDDLEWARE
// Middleware para análisis de JSON
app.use(express.json());

// Middleware para registro de solicitudes
app.use((req, res, next) => {
    console.log('Solicitud recibida:', req.method, req.url);
    next();
});

// Middleware para manejar la solicitud de /favicon.ico
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

app.listen(port, () => {
    console.log(`Servidor iniciado en el puerto ${port}`);
});