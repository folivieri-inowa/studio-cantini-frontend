import PropTypes from 'prop-types';
import { useState } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import CardHeader from '@mui/material/CardHeader';
import TableContainer from '@mui/material/TableContainer';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TableHeadCustom } from 'src/components/table';
import { fCurrencyEur } from 'src/utils/format-number';
import Scrollbar from 'src/components/scrollbar';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Link from '@mui/material/Link';
import TableHead from '@mui/material/TableHead';
import Tooltip from '@mui/material/Tooltip';
import Iconify from '../../../components/iconify';
import { useBoolean } from '../../../hooks/use-boolean';
import DetailsTransactionsQuickView from './details-transactions-quick-view';
import { useSettingsContext } from '../../../components/settings';
import DetailsChartQuickView from './details-chart-quick-view';

export default function CategoryAverageExpenseSubject({ title, subheader, tableData, tableLabels, onViewRow, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 3 }} />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 680 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData.averageMonthlyCosts.map((row) => (
                <CategoryAverageExpenseSubjectRow
                  categoryId={tableData.categoryId}
                  key={`${row.id || row.category}`}
                  row={row}
                  onViewRow={onViewRow}
                />
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>
    </Card>
  );
}

CategoryAverageExpenseSubject.propTypes = {
  subheader: PropTypes.string,
  tableData: PropTypes.array,
  tableLabels: PropTypes.array,
  title: PropTypes.string,
  onViewRow: PropTypes.func
};

function CategoryAverageExpenseSubjectRow({ categoryId, row, onViewRow }) {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [open, setOpen] = useState(false);
  const settings = useSettingsContext();
  const quickView = useBoolean()
  const qucikViewDetails = useBoolean();

  const handleOpenQuickView = (props) => {
    const dataToSend = {
      db: settings.db,
      owner: settings.owner ? settings.owner.id : 'all-accounts',
      year: settings.year,
      ...props
    }
    setData(dataToSend);
    quickView.onTrue()
  }

  const handleOpenDetails = (prop) => {
    setChartData({category: categoryId, subject: row.id, db: settings.db, owner: settings.owner ? settings.owner.id : 'all-accounts', year: settings.year,})
    qucikViewDetails.onTrue()
  }

  const handleCloseQuickView = () => {
    setData(null);
    quickView.onFalse()
  }

  const hasValues = row.values && row.values.length > 0;

  return (
    <>
      <TableRow>
        <TableCell sx={{ width: '5%' }}>
          {hasValues ? (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          ) : null}
        </TableCell>
        <TableCell sx={{ width: '50%' }}>{row.category}</TableCell>
        <TableCell align="right">{fCurrencyEur(row.averageCost)}</TableCell>
        <TableCell align="right">{fCurrencyEur(row.totalExpense)}</TableCell>
        {hasValues ? (
          <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
            <Tooltip title="Vedi dettaglio spese" placement="top" arrow>
              <IconButton color={quickView.value ? 'inherit' : 'default'} onClick={()=>handleOpenDetails(row.values)}>
                <Iconify icon="solar:eye-bold" />
              </IconButton>
            </Tooltip>
          </TableCell>
        ) : (
          <TableCell align="right" sx={{ px: 1, whiteSpace: 'nowrap' }} />
        )}
      </TableRow>

      {hasValues && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 1 }}>
                <Typography variant="subtitle1" gutterBottom component="div">
                  Dettagli
                </Typography>
                <Table size="small" aria-label="details">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '5%' }}/>
                      <TableCell>Nome</TableCell>
                      <TableCell align="right">Media spesa mensile</TableCell>
                      <TableCell align="right">Totale spesa annuale</TableCell>
                      <TableCell>{' '}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.values.map((value) => (
                      <TableRow key={`${value.id}-${row.id}`}>
                        <TableCell sx={{ width: '5%' }}/>
                        {value.detailsId ? (
                          <Link
                            noWrap
                            color="inherit"
                            variant="subtitle2"
                            onClick={() => onViewRow({ details: value.id, subject: row.id, category: categoryId, db: settings.db, owner: settings.owner ? settings.owner.id : 'all-accounts', year: settings.year})}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ color: 'blue' }}>{value.title}</TableCell>
                          </Link>
                        ) : (
                          <TableCell sx={{ width: '50%' }}>{value.title}</TableCell>
                        )}
                        <TableCell align="right">{fCurrencyEur(value.averageCost)}</TableCell>
                        <TableCell align="right">{fCurrencyEur(value.totalExpense)}</TableCell>
                        <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
                          <Tooltip title="Vedi dettaglio spese" placement="top" arrow>
                            <IconButton color={quickView.value ? 'inherit' : 'default'} onClick={()=>handleOpenQuickView({ details: value.id, subject: row.id, category: categoryId })}>
                              <Iconify icon="solar:eye-bold" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}

      <DetailsTransactionsQuickView
        data={data}
        open={quickView.value}
        onClose={handleCloseQuickView}
      />

      <DetailsChartQuickView
        data={chartData}
        open={qucikViewDetails.value}
        onClose={qucikViewDetails.onFalse}
      />
    </>
  );
}

CategoryAverageExpenseSubjectRow.propTypes = {
  categoryId: PropTypes.string,
  row: PropTypes.object,
  onViewRow: PropTypes.func,
};
