import { readFileSync } from 'fs'

export default function readJSON (filePath: string): Record<string, unknown> | null {
  try {
    const jsonContent = readFileSync(filePath, 'utf-8')
    return JSON.parse(jsonContent)
  } catch (error) {
    console.error(`Error reading or parsing ${filePath}:`, error)
    return null
  }
}
