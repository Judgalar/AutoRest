const path = require('node:path')
const { createFile } = require('./createFile.js')

function createRoute (fileName, fileContent) {
  const directoryPath = path.join(__dirname, 'api', 'routes')

  createFile(directoryPath, fileName, fileContent)
}

module.exports = { createRoute }
