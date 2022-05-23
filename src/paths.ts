import * as path from 'node:path'

export const RESOURCES_FOLDER = 'resources'
export const CONFIG_FOLDER = '.ent'
export const CONFIG_FILE = 'config.json'
export const DEFAULT_CONFIG_FILE = 'default-config.json'
export const OUTPUT_FOLDER = path.join(CONFIG_FOLDER, 'output')
export const DESCRIPTORS_OUTPUT_FOLDER = path.join(OUTPUT_FOLDER, 'descriptors')
export const MICROFRONTENDS_FOLDER = 'microfrontends'
export const MICROSERVICES_FOLDER = 'microservices'
