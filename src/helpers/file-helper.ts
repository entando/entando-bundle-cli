import * as fs from 'node:fs'

const JSON_INDENTATION_SPACES = 4

export class FileHelper {
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public static writeJSON(filePath: string, data: any): void {
    fs.writeFileSync(
      filePath,
      JSON.stringify(data, null, JSON_INDENTATION_SPACES))
  }
}
