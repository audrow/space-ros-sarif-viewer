import yaml from 'js-yaml';
import * as z from 'zod'
import {join} from 'path'
import {readFileSync} from 'fs'

export const ConfigFile = z.object({
  sarifWorkspaces: z.array(z.object({
    name: z.string().min(1),
    path: z.string().min(1),
    date: z.date()
  })),
})
export type ConfigFile = z.infer<typeof ConfigFile>

export default function getConfig(filePath?: string) {
  if (!filePath) {
    filePath = z.string().min(1).parse(process.env.SARIF_VIEWER_CONFIG_PATH, {
      path: ['getConfig', 'SARIF_VIEWER_CONFIG_PATH'],
    })
  }
  const fileContents = readFileSync(filePath, 'utf8')
  const results = ConfigFile.safeParse(yaml.load(fileContents), {
    path: ['ConfigFile', filePath],
  })
  if (!results.success) {
    throw results.error
  }
  return results.data

}

async function main() {
  const dotenv = await require('dotenv')
  dotenv.config({path: join(__dirname, '..', '..', '.env')})
  const config = getConfig()
  console.log(JSON.stringify(config, null, 2))
}

if (require.main === module) {
  main()
}