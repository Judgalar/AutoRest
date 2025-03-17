import fs from 'node:fs'
import path from 'path'

export default function createFile (directoryPath: string, fileName: string, content: string): void {
  const filePath = path.join(directoryPath, fileName)

  // Create directory if it doesn't exist
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true })
  }

  // Write content to the file
  fs.writeFileSync(filePath, content, 'utf-8')

  console.log(`Archivo ${fileName} creado en ${directoryPath}`)
}
