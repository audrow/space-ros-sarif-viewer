import * as z from 'zod'
import getConfig from '../../sarif/get-config'
import {
getSarifData,
groupConsolidatedSarifDataByFile,
groupConsolidatedSarifDataByRuleId
} from '../../sarif/get-sarif-data'
import { procedure, router } from '../trpc'

const sarifWorkspaces = getConfig().sarifWorkspaces
if (sarifWorkspaces.length === 0) {
  throw new Error('No SARIF workspaces found')
}

function getWorkspacePath(name: string) {
  const ws =  sarifWorkspaces.find((ws) => ws.name === name)
  if (!ws) {
    throw new Error(`No workspace found with name ${name}`)
  }
  return ws.path
}

const GetSarifDataInput = z.object({
  workspaceName: z.string().min(1),
  searchText: z.string().min(1).optional(),
})

export const sarifRouter = router({
  getSarifWorkspaceNames: procedure.query(() => {
    return sarifWorkspaces.map((ws) => ws.name)
  }),
  getResults: procedure
    .input(GetSarifDataInput)
    .query(async ({input: {workspaceName, searchText}}) => {
      console.log(`Getting SARIF data for workspace ${workspaceName} with search text ${searchText || '(none)'}`)
      const directoryPath = getWorkspacePath(workspaceName)
      const data = getSarifData(directoryPath)
      if (searchText) {
        return data.filter((d) => JSON.stringify(d).includes(searchText))
      }
      return data
    }),
  getResultsGroupedByFile: procedure
    .input(GetSarifDataInput)
    .query(async ({input: {workspaceName}}) => {
      const directoryPath = getWorkspacePath(workspaceName)
      const data = getSarifData(directoryPath)
      return groupConsolidatedSarifDataByFile(data)
    }),
  getResultsGroupedByRuleId: procedure
    .input(GetSarifDataInput)
    .query(async ({input: {workspaceName}}) => {
      const directoryPath = getWorkspacePath(workspaceName)
      const data = getSarifData(directoryPath)
      return groupConsolidatedSarifDataByRuleId(data)
    }),
})

// export type definition of API
export type AppRouter = typeof sarifRouter
