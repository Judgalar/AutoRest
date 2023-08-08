const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const configPath = 'config.json';

async function clearFiles() {   // Borra la carpeta 'models' y el swagger.json si existen

    const modelsDirectory = path.join(__dirname, 'models');
    const swaggerFilePath = path.join(__dirname, 'swagger.json');

    try {
        if (fs.existsSync(modelsDirectory)) {
            fs.rmSync(modelsDirectory, { recursive: true });
            console.log('Carpeta "models" eliminada.');
        }

        if (fs.existsSync(swaggerFilePath)) {
            fs.unlinkSync(swaggerFilePath);
            console.log('Archivo "swagger.json" eliminado.');
        }
    } catch (err) {
        console.error('Error al eliminar carpetas/archivos:', err);
    }
}

function modifyConfig(callback) {

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading config file:', err);
            process.exit(1);
        }

        const config = JSON.parse(data);

        rl.question(`Enter new database name (${config.database.name}): `, (name) => {
            rl.question(`Enter new database user (${config.database.user}): `, (user) => {
                rl.question(`Enter new database password: `, (password) => {
                    rl.question(`Enter new database host (${config.database.host}): `, (host) => {
                        rl.question(`Enter new database dialect (${config.database.dialect}): `, (dialect) => {
                            config.database.name = name || config.database.name;
                            config.database.user = user || config.database.user;
                            config.database.password = password;
                            config.database.host = host || config.database.host;
                            config.database.dialect = dialect || config.database.dialect;

                            fs.writeFile(configPath, JSON.stringify(config, null, 4), 'utf8', (err) => {
                                if (err) {
                                    console.error('Error writing config file:', err);
                                    process.exit(1);
                                }

                                console.log('Config file modified successfully.');
                                rl.close();

                                clearFiles();

                                callback();

                            });
                        });
                    });
                });
            });
        });
    });

}

module.exports = modifyConfig;