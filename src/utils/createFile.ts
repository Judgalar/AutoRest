import fs from 'node:fs'
import path from 'path'

export default function createFile (directoryPath: string, fileName: string, content: string): void {
  const filePath = path.join(directoryPath, fileName)

  // Crear el directorio si no existe
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }

  // Escribir el contenido en el archivo
  fs.writeFileSync(filePath, content, 'utf-8')

  console.log(`Archivo ${fileName} creado en ${directoryPath}`)
}
