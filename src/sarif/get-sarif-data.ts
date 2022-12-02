import { existsSync,readFileSync } from 'fs'
import glob from 'glob'
import cache from 'node-cache'
import { join } from 'path'

import { ConsolidatedSarif,Sarif } from './__types__'

const consolidatedSarifCache = new cache()

export function getSarifData(directory: string, isRemoveDuplicates?: boolean): ConsolidatedSarif[] {
  if (!consolidatedSarifCache.has(directory)) {
    if (!existsSync(directory)) {
      throw new Error(`Directory ${directory} does not exist`)
    }
    const files = glob.sync(join(directory, '**/*.sarif'))
    const data: Sarif[] = []
    for (const file of files) {
      const fileText = readFileSync(file, 'utf8')
      const result = Sarif.safeParse(JSON.parse(fileText), {path: [file]})
      if (!result.success) {
        console.log(result.error)
        throw new Error('Invalid SARIF')
      } else {
        data.push(result.data)
      }
    }
    consolidatedSarifCache.set(
      directory,
      consolidateSarifResults(data, isRemoveDuplicates),
    )
  }
  const results = consolidatedSarifCache.get<ConsolidatedSarif[]>(directory)
  if (!results) {
    throw new Error('Unable to get SARIF data from cache')
  }
  return results
}

function consolidateSarifResults(
  sarifData: Sarif[],
  isRemoveDuplicates = true,
): ConsolidatedSarif[] {
  const out: ConsolidatedSarif[] = []
  sarifData.forEach((sarif) => {
    sarif.runs.forEach((run) => {
      const name = run.tool.driver.name
      run.results.forEach((result) => {
        const message = result.message.text
        const level = result.level
        const ruleId = result.ruleId
        result.locations.forEach((location) => {
          const line = location.physicalLocation?.region?.startLine
          const file = location.physicalLocation?.artifactLocation?.uri
          out.push({name, message, level, ruleId, line, file})
        })
      })
    })
  })
  if (isRemoveDuplicates) {
    return out.filter((value, index, self) => {
      return (
        self.findIndex((v) => {
          return (
            v.name === value.name &&
            v.message === value.message &&
            v.level === value.level &&
            v.ruleId === value.ruleId &&
            v.line === value.line &&
            v.file === value.file
          )
        }) === index
      )
    })
  }
  return out
}

export function groupConsolidatedSarifDataByFile(data: ConsolidatedSarif[]) {
  return data.reduce((acc, result) => {
    if (result.file === undefined) {
      return acc
    }
    if (acc[result.file] === undefined) {
      acc[result.file] = []
    }
    acc[result.file].push(result)
    return acc
  }, {} as Record<string, ConsolidatedSarif[]>)
}

export function groupConsolidatedSarifDataByRuleId(data: ConsolidatedSarif[]) {
  return data.reduce((acc, result) => {
    if (acc[result.ruleId] === undefined) {
      acc[result.ruleId] = []
    }
    acc[result.ruleId].push(result)
    return acc
  }, {} as Record<string, ConsolidatedSarif[]>)
}

async function main() {
  const dataDir = join(__dirname, '..', '..', 'data')
  const results = getSarifData(dataDir)

  console.log(groupConsolidatedSarifDataByFile)
  console.log(groupConsolidatedSarifDataByRuleId)
  console.log(results)
  console.log(results.length)
}

if (require.main === module) {
  main()
}
