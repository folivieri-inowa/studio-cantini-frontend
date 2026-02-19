'use client';

import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import axios from 'src/utils/axios';
import { endpoints } from 'src/utils/axios';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TableSelectedAction,
  TablePaginationCustom,
} from 'src/components/table';

import { useGetArchiveDocuments } from 'src/api/archive';

import DocumentTableRow from '../document-table-row';
import DocumentUploadDialog from '../document-upload-dialog';
import DocumentTableToolbar from '../document-table-toolbar';
import DocumentTableFiltersResult from '../document-table-filters-result';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'original_filename', label: 'Documento' },
  { id: 'document_type', label: 'Tipo' },
  { id: 'processing_status', label: 'Stato' },
  { id: 'priority', label: 'Priorità' },
  { id: 'created_at', label: 'Data Caricamento' },
  { id: '', width: 88 },
];

const defaultFilters = {
  name: '',
  status: [],
  priority: [],
  documentType: [],
};

// ----------------------------------------------------------------------

export default function ArchiveListView() {
  const table = useTable({ defaultRowsPerPage: 25 });
  const router = useRouter();
  const settings = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const uploadDialog = useBoolean();

  const { documents, pagination, documentsLoading, documentsEmpty, documentsRefresh } = useGetArchiveDocuments(
    settings.db,
    {
      limit: table.rowsPerPage,
      offset: table.page * table.rowsPerPage,
    }
  );

  const [tableData, setTableData] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);

  useEffect(() => {
    if (documents) {
      setTableData(documents);
    }
  }, [documents]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    filters,
  });

  const dataInPage = dataFiltered;

  const denseHeight = table.dense ? 56 : 76;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

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

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleDeleteRow = useCallback(
    async (id) => {
      try {
        await axios.delete(endpoints.archive.delete(id));

        enqueueSnackbar('Documento eliminato con successo', { variant: 'success' });

        // Aggiorna la lista
        setTableData((prevData) => prevData.filter((row) => row.id !== id));
        documentsRefresh();

        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        console.error('Errore eliminazione:', error);
        enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
      }
    },
    [dataInPage.length, enqueueSnackbar, documentsRefresh, table]
  );

  const handleDeleteRows = useCallback(async () => {
    try {
      await Promise.all(
        table.selected.map((id) => axios.delete(endpoints.archive.delete(id)))
      );

      enqueueSnackbar('Documenti eliminati con successo', { variant: 'success' });

      setTableData((prevData) => prevData.filter((row) => !table.selected.includes(row.id)));
      documentsRefresh();

      table.onUpdatePageDeleteRows({
        totalRows: tableData.length,
        totalRowsInPage: dataInPage.length,
        totalRowsFiltered: dataFiltered.length,
      });
    } catch (error) {
      console.error('Errore eliminazione multipla:', error);
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    }
  }, [
    dataFiltered.length,
    dataInPage.length,
    enqueueSnackbar,
    documentsRefresh,
    table,
    tableData.length,
  ]);

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.archive.details(id));
    },
    [router]
  );

  const handleUploadSuccess = useCallback(() => {
    documentsRefresh();
  }, [documentsRefresh]);

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Archivio Digitale"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Archivio', href: paths.dashboard.archive.root },
            { name: 'Documenti' },
          ]}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="eva:search-fill" />}
                onClick={() => router.push(paths.dashboard.archive.search)}
              >
                Ricerca Avanzata
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={uploadDialog.onTrue}
              >
                Carica Documento
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <DocumentTableToolbar
            filters={filters}
            onFilters={handleFilters}
            //
            canReset={canReset}
            onResetFilters={handleResetFilters}
          />

          {canReset && (
            <DocumentTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              //
              onResetFilters={handleResetFilters}
              //
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={tableData.length}
              onSelectAllRows={(checked) =>
                table.onSelectAllRows(
                  checked,
                  tableData.map((row) => row.id)
                )
              }
              action={
                <Tooltip title="Elimina">
                  <IconButton color="primary" onClick={handleDeleteRows}>
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Tooltip>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      tableData.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {dataFiltered
                    .map((row) => (
                      <DocumentTableRow
                        key={row.id}
                        row={row}
                        selected={table.selected.includes(row.id)}
                        onSelectRow={() => table.onSelectRow(row.id)}
                        onDelete={() => handleDeleteRow(row.id)}
                        onView={() => handleViewRow(row.id)}
                      />
                    ))}

                  <TableEmptyRows
                    height={denseHeight}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, tableData.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={pagination?.total ?? dataFiltered.length}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
            //
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </Container>

      <DocumentUploadDialog
        open={uploadDialog.value}
        onClose={uploadDialog.onFalse}
        db={settings.db}
        onSuccess={handleUploadSuccess}
      />
    </>
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, filters }) {
  const { name, status, priority, documentType } = filters;

  let data = [...inputData];

  if (name) {
    data = data.filter(
      (doc) =>
        doc.original_filename.toLowerCase().includes(name.toLowerCase()) ||
        (doc.title && doc.title.toLowerCase().includes(name.toLowerCase()))
    );
  }

  if (status.length) {
    data = data.filter((doc) => status.includes(doc.processing_status));
  }

  if (priority.length) {
    data = data.filter((doc) => priority.includes(doc.priority));
  }

  if (documentType.length) {
    data = data.filter((doc) => documentType.includes(doc.document_type));
  }

  return data;
}
