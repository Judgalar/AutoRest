// generateModels.js
import SequelizeAuto from 'sequelize-auto';
import { readFileSync } from 'fs';

const configPath = './config.json';
const config = JSON.parse(readFileSync(configPath, 'utf-8'));
const { name, user, password, host, dialect } = config.database;

const auto = new SequelizeAuto(name, user, password, {
    host,
    dialect,
    directory: './models', // Directorio donde se generarán los modelos
    caseModel: 'p', // Caso de las letras en los nombres de los modelos (pascal case)
    caseFile: 'p', // Caso de las letras en los nombres de los archivos (pascal case)
    additional: {
        timestamps: false // Desactiva las columnas de fecha de creación y actualización
    }
});

async function generateModels() {
    try {
        await auto.run();
        console.log('Los modelos se han generado exitosamente.');
    } catch (err) {
        console.error('Error al generar los modelos:', err);
    }
}

generateModels();


