'use client';

import React, { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
// MUI Components
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

// Routes
import { paths } from '../../../routes/paths';
import { useRouter } from '../../../routes/hooks';
import Iconify from '../../../components/iconify';
import { applyFilter } from '../scadenziario-filter';
import Scrollbar from '../../../components/scrollbar';
// Scadenziario Components
// Hooks and Components
import { useBoolean } from '../../../hooks/use-boolean';
import { useSnackbar } from '../../../components/snackbar';
import ScadenziarioTableRow from '../scadenziario-table-row';
import ScadenziarioEditModal from '../scadenziario-edit-modal';
import { useSettingsContext } from '../../../components/settings';
import { ConfirmDialog } from '../../../components/custom-dialog';
import ScadenziarioCreateModal from '../scadenziario-create-modal';
import ScadenziarioTableToolbar from '../scadenziario-table-toolbar';
import ScadenziarioDetailsModal from '../scadenziario-details-modal';
import ScadenziarioDashboard from '../scadenziario-dashboard-updated';
import ScadenziarioNotifications from '../scadenziario-notifications';
import CustomBreadcrumbs from '../../../components/custom-breadcrumbs';
// API
import { useEnhancedGetScadenziario } from '../../../api/enhanced-services';
import ScadenziarioTableFiltersResult from '../scadenziario-table-filters-result';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableSkeleton,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from '../../../components/table';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'subject', label: 'Soggetto' },
  { id: 'description', label: 'Descrizione' },
  { id: 'causale', label: 'Causale' },
  { id: 'date', label: 'Data scadenza' },
  { id: 'amount', label: 'Importo', align: 'right' },
  { id: 'paymentDate', label: 'Data pagamento' },
  { id: 'status', label: 'Stato pagamento' },
  { id: '', width: 88 },
];

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Pagato', color: 'success' },
  { value: 'overdue', label: 'Scaduto', color: 'error' },
  { value: 'upcoming', label: 'In scadenza', color: 'warning' },
  { value: 'future', label: 'Da pagare', color: 'info' },
];

const defaultFilters = {
  searchQuery: '',
  startDate: null,
  endDate: null,
  status: [],
};

// ----------------------------------------------------------------------

export function ScadenziarioListView() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const table = useTable();

  const settings = useSettingsContext();

  const confirm = useBoolean();
  
  // Stati per gestire le modali
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const [filters, setFilters] = useState(defaultFilters);

  // Recupero dati dall'API con il servizio migliorato
  const { scadenziario: scadenze, scadenziarioLoading: scadenzeLoading, scadenziarioMutate } = useEnhancedGetScadenziario();

  // Debug: visualizza i dati originali ricevuti dall'API e verifica la presenza di elementi problematici
  useEffect(() => {
    if (scadenze) {
      console.log('Numero elementi scadenziario:', scadenze.length);
      
      // Verifica se ci sono record con campi fondamentali mancanti
      const problematicItems = scadenze.filter(item => !item || !item.id || !item.subject || !item.date);
      if (problematicItems.length > 0) {
        console.warn('Record potenzialmente problematici:', problematicItems);
      }
    }
  }, [scadenze]);

  const dataFiltered = applyFilter({
    inputData: scadenze,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 56 : 76;

  const canReset = !!filters.searchQuery || (!!filters.startDate && !!filters.endDate);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  // Calcola totali per visualizzazione
  const totaleDebito = Array.isArray(scadenze) 
    ? scadenze
        .filter(item => item && item.status !== 'completed')
        .reduce((sum, item) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0)
    : 0;
  
  const totalePagato = Array.isArray(scadenze)
    ? scadenze
        .filter(item => item && item.status === 'completed')
        .reduce((sum, item) => sum + (typeof item.amount === 'number' ? item.amount : 0), 0)
    : 0;

  const handleFilters = useCallback(
    (name, value) => {
      table.onResetPage();
      setFilters((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    },
    [table]
  );

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        // Importa la funzione per eliminare una scadenza
        const { deleteScadenziario } = await import('../../../api/scadenziario-services');
        await deleteScadenziario(id);
        
        enqueueSnackbar('Scadenza eliminata con successo!');
        table.onUpdatePageDeleteRow(dataInPage.length);
        
        // Aggiorna la lista delle scadenze
        if (scadenziarioMutate) {
          scadenziarioMutate();
        }
      } catch (error) {
        console.error('Errore durante l\'eliminazione della scadenza:', error);
        enqueueSnackbar('Si è verificato un errore durante l\'eliminazione!', { variant: 'error' });
      }
    },
    [dataInPage.length, enqueueSnackbar, table, scadenziarioMutate]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      // Importa la funzione per eliminare più scadenze
      const { deleteMultipleScadenze } = await import('../../../api/scadenziario-services');
      await deleteMultipleScadenze(table.selected);
      
      enqueueSnackbar('Scadenze eliminate con successo!');
      table.onUpdatePageDeleteRows({
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
      
      // Aggiorna la lista delle scadenze
      if (scadenziarioMutate) {
        scadenziarioMutate();
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione delle scadenze:', error);
      enqueueSnackbar('Si è verificato un errore durante l\'eliminazione!', { variant: 'error' });
    }
  }, [dataFiltered.length, dataInPage.length, enqueueSnackbar, table, scadenziarioMutate]);

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleViewRow = useCallback(
    (id) => {
      setSelectedId(id);
      setOpenDetailsModal(true);
    },
    []
  );

  const handleEditRow = useCallback(
    (id) => {
      setSelectedId(id);
      setOpenEditModal(true);
    },
    []
  );

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <Card 
          sx={{ 
            mb: { xs: 3, md: 5 },
            p: 3,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'flex-start', md: 'center' },
            justifyContent: 'space-between',
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.lighter} 0%, ${theme.palette.background.paper} 60%)`,
            boxShadow: (theme) => theme.customShadows.z8,
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: { xs: 2, md: 0 } }}>
            <CustomBreadcrumbs
              links={[
                {
                  name: 'Dashboard',
                  href: paths.dashboard.root,
                },
                {
                  name: 'Scadenziario',
                },
              ]}
              sx={{ mb: 1 }}
            />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Iconify icon="eva:calendar-fill" sx={{ width: 28, height: 28, color: 'primary.main' }} /> 
              Scadenziario
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Gestione dei pagamenti e delle scadenze finanziarie
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            <ScadenziarioNotifications 
              scadenze={scadenze} 
              onClick={(notification) => {
                if (notification && notification.id) {
                  handleViewRow(notification.id);
                }
              }}
            />
            <Button
              variant="contained"
              size="large"
              startIcon={<Iconify icon="eva:plus-circle-fill" />}
              onClick={() => setOpenCreateModal(true)}
              sx={{ 
                boxShadow: (theme) => theme.customShadows.primary,
                fontWeight: 'bold',
                px: 2.5,
              }}
            >
              Nuovo scadenziario
            </Button>
          </Stack>
        </Card>
        
        <Box 
          sx={{ 
            width: '100%', 
            px: 0, 
            mx: 0,
            '& > *': { maxWidth: 'none !important' } // Sovrascrive qualsiasi limite di larghezza
          }}
        >
          <ScadenziarioDashboard scadenze={scadenze} />
        </Box>

        <Card>
          <ScadenziarioTableToolbar 
            filters={filters}
            onFilters={handleFilters}
            statusOptions={STATUS_OPTIONS}
          />

          {canReset && (
            <ScadenziarioTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              results={dataFiltered.length}
              statusOptions={STATUS_OPTIONS}
            />
          )}

          <Box sx={{ position: 'relative' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                )
              }
              action={
                <Stack direction="row">
                  <Tooltip title="Elimina">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              }
            />

            <Scrollbar>
              <TableContainer 
                sx={{ 
                  position: 'relative', 
                  overflow: 'unset',
                  borderRadius: 2,
                  boxShadow: (theme) => theme.customShadows.z8,
                }}
              >
                <Table 
                  size={table.dense ? 'small' : 'medium'} 
                  sx={{ 
                    minWidth: 960,
                    '& .MuiTableRow-root:hover': {
                      backgroundColor: (theme) => alpha(theme.palette.primary.lighter, 0.4)
                    },
                  }}
                >
                  <TableHeadCustom
                    order={table.order}
                    orderBy={table.orderBy}
                    headLabel={TABLE_HEAD}
                    rowCount={dataFiltered.length}
                    numSelected={table.selected.length}
                    onSort={table.onSort}
                    sx={{
                      '& .MuiTableCell-root': {
                        bgcolor: (theme) => alpha(theme.palette.primary.lighter, 0.2),
                        fontWeight: 'bold',
                      },
                    }}
                    onSelectAllRows={(checked) =>
                      table.onSelectAllRows(
                        checked,
                        dataFiltered.map((row) => row.id)
                      )
                    }
                  />

                  <TableBody>
                    {scadenzeLoading ? (
                      [...Array(table.rowsPerPage)].map((i, index) => (
                        <TableSkeleton key={index} sx={{ height: denseHeight }} />
                      ))
                    ) : (
                      <>
                        {notFound ? (
                          <TableNoData notFound={notFound} sx={{ py: 10 }} />
                        ) : (
                          <>
                            {dataInPage.map((row) => (
                              <ScadenziarioTableRow
                                key={row.id}
                                row={row}
                                selected={table.selected.includes(row.id)}
                                onSelectRow={() => table.onSelectRow(row.id)}
                                onDeleteRow={() => handleDeleteRow(row.id)}
                                onViewRow={() => handleViewRow(row.id)}
                                onEditRow={() => handleEditRow(row.id)}
                              />
                            ))}
                          </>
                        )}
                      </>
                    )}

                    <TableEmptyRows
                      height={denseHeight}
                      emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                    />
                  </TableBody>
                </Table>
              </TableContainer>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </Container>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina"
        content={
          <>
            Sei sicuro di voler eliminare <strong> {table.selected.length} </strong> elementi?
          </>
        }
        action={
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              handleDeleteRows();
              confirm.onFalse();
            }}
          >
            Elimina
          </Button>
        }
      />

      {/* Modale di creazione */}
      <ScadenziarioCreateModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCreated={() => {
          if (scadenziarioMutate) {
            scadenziarioMutate();
          }
        }}
      />

      {/* Modale di modifica */}
      {selectedId && (
        <ScadenziarioEditModal
          id={selectedId}
          open={openEditModal}
          onClose={() => setOpenEditModal(false)}
          onEdited={() => {
            if (scadenziarioMutate) {
              scadenziarioMutate();
            }
          }}
        />
      )}

      {/* Modale di dettagli */}
      {selectedId && (
        <ScadenziarioDetailsModal
          id={selectedId}
          open={openDetailsModal}
          onClose={() => setOpenDetailsModal(false)}
        />
      )}
    </>
  );
}
