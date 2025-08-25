import { useState } from 'react';
import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { fCurrencyEur } from 'src/utils/format-number';
import { capitalizeCase } from 'src/utils/change-case';

import Scrollbar from 'src/components/scrollbar';
import { TableHeadCustom } from 'src/components/table';

import Iconify from '../../../components/iconify';
import { useBoolean } from '../../../hooks/use-boolean';
import DetailsChartQuickView from './details-chart-quick-view';
import { useSettingsContext } from '../../../components/settings';
import DetailsTransactionsQuickView from './details-transactions-quick-view';

export default function CategoryAverageExpenseSubject({ title, subheader, tableData, tableLabels, onViewRow, ...other }) {
  return (
    <Card {...other}>
      <CardHeader 
        title={title} 
        subheader={
          <>
            {subheader}
            {tableData.averageMonthlyCosts.some(row => 
                row.values && row.values.some(value => parseFloat(value.totalExpense) === 0)
              ) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                * I valori a €0,00 con asterisco indicano voci senza transazioni nell&apos;anno selezionato
              </Typography>
            )}
          </>
        } 
        sx={{ mb: 3 }} 
      />

      <TableContainer sx={{ overflow: 'unset' }}>
        <Scrollbar>
          <Table sx={{ minWidth: 680 }}>
            <TableHeadCustom headLabel={tableLabels} />

            <TableBody>
              {tableData && tableData.averageMonthlyCosts && tableData.averageMonthlyCosts.map((row, index) => (
                <CategoryAverageExpenseSubjectRow
                  categoryId={tableData.categoryId}
                  key={row.id || row.category || `subject-${index}`}
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
    setChartData({
      category: categoryId, 
      subject: row.id, 
      db: settings.db, 
      owner: settings.owner ? settings.owner.id : 'all-accounts', 
      year: settings.year
    })
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
          ) : (
            <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {/* Spazio vuoto per mantenere l'allineamento */}
            </Box>
          )}
        </TableCell>
        <TableCell sx={{ width: '40%' }}>{capitalizeCase(row.category)}</TableCell>
        <TableCell align="right">
          <Tooltip title="Media annuale: Totale uscite diviso per 12 mesi" placement="top" arrow>
            <span>{fCurrencyEur(row.averageCost)}</span>
          </Tooltip>
        </TableCell>
        <TableCell align="right">{fCurrencyEur(row.totalExpense)}</TableCell>
        <TableCell align="right">{fCurrencyEur(row.totalIncome)}</TableCell>
        <TableCell align="right">
          {fCurrencyEur(parseFloat(row.totalIncome || 0) - parseFloat(row.totalExpense || 0))}
        </TableCell>
        {hasValues ? (
          <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
            <Tooltip title="Vedi statistiche e grafici" placement="top" arrow>
              <IconButton 
                color={quickView.value ? 'inherit' : 'default'} 
                onClick={() => handleOpenDetails(row.values)}
              >
                <Iconify icon="solar:chart-2-bold" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Vedi tutti i movimenti" placement="top" arrow>
              <IconButton 
                color={quickView.value ? 'inherit' : 'default'} 
                onClick={() => handleOpenQuickView({ subject: row.id, category: categoryId })}
              >
                <Iconify icon="solar:document-text-bold" />
              </IconButton>
            </Tooltip>
          </TableCell>
        ) : (
          <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
            <Tooltip title="Vedi tutti i movimenti" placement="top" arrow>
              <IconButton 
                color={quickView.value ? 'inherit' : 'default'} 
                onClick={() => handleOpenQuickView({ subject: row.id, category: categoryId })}
              >
                <Iconify icon="solar:document-text-bold" />
              </IconButton>
            </Tooltip>
          </TableCell>
        )}
      </TableRow>

      {hasValues && (
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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
                      <TableCell align="right">Uscite</TableCell>
                      <TableCell align="right">Entrate</TableCell>
                      <TableCell align="right">Delta</TableCell>
                      <TableCell>{' '}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.values.map((value, index) => (
                      <TableRow key={`${value.id || `detail-${index}`}-${row.id || `row-${index}`}`}>
                        <TableCell sx={{ width: '5%' }}/>
                        {value.detailsId ? (
                          <Link
                            noWrap
                            color="inherit"
                            variant="subtitle2"
                            onClick={() => onViewRow({ details: value.id, subject: row.id, category: categoryId, db: settings.db, owner: settings.owner ? settings.owner.id : 'all-accounts', year: settings.year})}
                            sx={{ cursor: 'pointer' }}
                          >
                            <TableCell sx={{ color: 'blue' }}>{capitalizeCase(value.title)}</TableCell>
                          </Link>
                        ) : (
                          <TableCell sx={{ width: '50%' }}>{capitalizeCase(value.title)}</TableCell>
                        )}
                        <TableCell align="right">
                          {parseFloat(value.averageCost) > 0 
                            ? (
                              <Tooltip title="Media annuale: Totale uscite diviso per 12 mesi" placement="top" arrow>
                                <span>{fCurrencyEur(value.averageCost)}</span>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Nessuna transazione trovata per questo dettaglio nell'anno corrente">
                                <span style={{ color: '#999' }}>€0,00*</span>
                              </Tooltip>
                            )
                          }
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(value.totalExpense) > 0 
                            ? fCurrencyEur(value.totalExpense) 
                            : (
                              <Tooltip title="Nessuna transazione trovata per questo dettaglio nell'anno corrente">
                                <span style={{ color: '#999' }}>€0,00*</span>
                              </Tooltip>
                            )
                          }
                        </TableCell>
                        <TableCell align="right">
                          {parseFloat(value.totalIncome) > 0 
                            ? fCurrencyEur(value.totalIncome) 
                            : (
                              <Tooltip title="Nessuna transazione trovata per questo dettaglio nell'anno corrente">
                                <span style={{ color: '#999' }}>€0,00*</span>
                              </Tooltip>
                            )
                          }
                        </TableCell>
                        <TableCell align="right">
                          {fCurrencyEur(parseFloat(value.totalIncome || 0) - parseFloat(value.totalExpense || 0))}
                        </TableCell>
                        {(parseFloat(value.totalExpense) > 0 || parseFloat(value.totalIncome) > 0) ? (
                          <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
                            <Tooltip title="Vedi statistiche e grafici" placement="top" arrow>
                              <IconButton color={qucikViewDetails.value ? 'inherit' : 'default'} onClick={() => {
                                setChartData({
                                  category: categoryId, 
                                  subject: row.id, 
                                  details: value.id,
                                  db: settings.db, 
                                  owner: settings.owner ? settings.owner.id : 'all-accounts', 
                                  year: settings.year
                                });
                                qucikViewDetails.onTrue();
                              }}>
                                <Iconify icon="solar:chart-2-bold" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Vedi tutti i movimenti" placement="top" arrow>
                              <IconButton 
                                color={quickView.value ? 'inherit' : 'default'} 
                                onClick={() => handleOpenQuickView({ details: value.id, subject: row.id, category: categoryId })}
                              >
                                <Iconify icon="solar:document-text-bold" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        ) : (
                          <TableCell align="center" sx={{ px: 1, whiteSpace: 'nowrap' }}>
                            <Tooltip title="Vedi tutti i movimenti" placement="top" arrow>
                              <IconButton 
                                color={quickView.value ? 'inherit' : 'default'} 
                                onClick={() => handleOpenQuickView({ details: value.id, subject: row.id, category: categoryId })}
                              >
                                <Iconify icon="solar:document-text-bold" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
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
