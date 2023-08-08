const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const chalk = require('chalk');


const args = process.argv.slice(2);

const modelsDirectory = path.join(__dirname, 'models');
const swaggerFile = path.join(__dirname, 'swagger.json');

function generateModels() {
  return new Promise((resolve, reject) => {
    exec('node generateModels.mjs', (error, stdout, stderr) => {
      if (error) {
        reject(`Error ejecutando generateModels.mjs: ${error.message}`);
      } else {
        console.log(`generateModels.mjs output: ${stdout}`);
        resolve();
      }
    });
  });
}

function generateSwagger() {
  return new Promise((resolve, reject) => {
    exec('node swagger.js', (error, stdout, stderr) => {
      if (error) {
        reject(`Error ejecutando swagger.js: ${error.message}`);
      } else {
        console.log(`swagger.js output: ${stdout}`);
        resolve();
      }
    });
  });
}

async function startServer() {
  if (!fs.existsSync(modelsDirectory)) {
    console.log(chalk.blue("Directorio models no encontrado. Generando modelos..."));
    try {
      await generateModels();
      console.log(chalk.green("Modelos generados exitosamente."));
    } catch (error) {
      console.error(error);
      process.exit(1); // Cierra la aplicacion si la generacion de modelos falla.
    }
  }

  if (!fs.existsSync(swaggerFile)) {
    console.log(chalk.blue("swagger.json no encontado. Generando swagger..."));
    try {
      await generateSwagger();
      console.log(chalk.green("Swagger generado exitosamente."));
    } catch (error) {
      console.error(error);
      process.exit(1); // Cierra la aplicacion si la generacion de swagger falla.
    }
  }

  // Iniciar el servidor
  require('./server');
}

if (args.includes('--config') || args.includes('-c')) {

  const modifyConfig = require('./modifyConfig');

  modifyConfig(async () => {
    try {
      await generateModels();
      console.log(chalk.green("Modelos generados exitosamente."));
      await generateSwagger();
      console.log(chalk.green("Swagger generado exitosamente."));

      startServer();

    }
    catch (error) {
      console.error(error);
      process.exit(1);
    }
  });
}
else {
  startServer();
}
