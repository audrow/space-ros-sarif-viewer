import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useEffect,useState } from 'react'
import Layout from '../components/Layout'
import type { DropDown } from '../components/MyTable'
import MyTable from '../components/MyTable'
import { trpc } from '../utils/trpc'

export default function Index() {

  const utils = trpc.useContext()

  const [workspaceName, setWorkspaceName] = useState<string | undefined>(undefined)
  const [searchText, setSearchText] = useState<string | undefined>(undefined)

  const sarifWorkspaceNames = trpc.sarif.getSarifWorkspaceNames.useQuery()
  const sarifResults = trpc.sarif.getResults.useQuery({workspaceName: workspaceName!, searchText}, {enabled: !!workspaceName})

  useEffect(() => {
    if (sarifWorkspaceNames.data?.length) {
      setWorkspaceName(sarifWorkspaceNames.data[0])
    }
  }, [sarifWorkspaceNames.data])

  const columns = ['level', 'line', 'file', 'message', 'ruleId']
  return (
    <>
      <Paper sx={{width: '100%', overflow: 'hidden'}}>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const $form = e.currentTarget
            const values = Object.fromEntries(new FormData($form))
            const searchText_ = (values.searchText as string).trim()
            setSearchText(searchText_ === '' ? undefined : searchText_)
            utils.sarif.invalidate()
          }}
        >
          <label htmlFor="search">Search:</label>
          <input type="text" id="search" name="searchText" />
          <button type="submit">Search</button>
        </form>

        {sarifWorkspaceNames.data && (
          <form>
            <label htmlFor="sarif-workspace">Select a SARIF workspace: </label>
            <select
              name="sarif-workspace"
              id="sarif-workspace"
              onChange={(e) => {
                setWorkspaceName(e.target.value)
                utils.sarif.invalidate()
              }}
            >
              {sarifWorkspaceNames.data.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </form>
        )}
        {sarifResults.isLoading ? (
          <div>Loading...</div>
        ) : (
          // <MyTable rows={sarifResults.data!} columns={columns}/>
          <MyTable
            rows={sarifResults.data!}
            columns={columns}
            dropDown={DropDown}
          />
        )}
      </Paper>
    </>
  )
}

const history = [
  {
    date: '2020-01-05',
    customerId: '11091700',
    amount: 3,
  },
  {
    date: '2020-01-02',
    customerId: 'Anonymous',
    amount: 1,
  },
]

const DropDown: DropDown = ({row}) => {
  return (
    <>
      {JSON.stringify(row, null, 2)}
      <Typography variant="h6" gutterBottom component="div">
        History
      </Typography>
      <Table size="small" aria-label="purchases">
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Customer</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Total price ($)</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {history.map((historyRow) => (
            <TableRow key={historyRow.date}>
              <TableCell component="th" scope="row">
                {historyRow.date}
              </TableCell>
              <TableCell>{historyRow.customerId}</TableCell>
              <TableCell align="right">{historyRow.amount}</TableCell>
              <TableCell align="right">
                {Math.round(historyRow.amount * 100) / 100}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
