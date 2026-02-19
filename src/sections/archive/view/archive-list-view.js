'use client';

import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Badge from '@mui/material/Badge';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

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

  const { documents, pagination, documentsLoading, documentsRefresh } = useGetArchiveDocuments(
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

  // BUG FIX: applyFilter ora è robusta a inputData undefined/null
  const dataFiltered = applyFilter({
    inputData: tableData,
    filters,
  });

  const dataInPage = dataFiltered;

  const denseHeight = table.dense ? 56 : 76;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset) || (!dataFiltered.length && !documentsLoading);

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

        setTableData((prevData) => prevData.filter((row) => row.id !== id));
        documentsRefresh();

        table.onUpdatePageDeleteRow(dataInPage.length);
      } catch (error) {
        console.error('Errore eliminazione:', error);
        enqueueSnackbar("Errore durante l'eliminazione", { variant: 'error' });
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
      enqueueSnackbar("Errore durante l'eliminazione", { variant: 'error' });
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

  const totalCount = pagination?.total ?? dataFiltered.length;
  const selectedCount = table.selected?.length ?? 0;

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
            <Stack direction="row" spacing={1} alignItems="center">
              {/* Contatore documenti inline */}
              {!documentsLoading && totalCount > 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}
                >
                  {totalCount} document{totalCount === 1 ? 'o' : 'i'}
                </Typography>
              )}

              <Button
                variant="outlined"
                size="small"
                startIcon={<Iconify icon="eva:search-fill" />}
                onClick={() => router.push(paths.dashboard.archive.search)}
              >
                Ricerca
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
          {/* Barra di progresso durante caricamento */}
          {documentsLoading && (
            <LinearProgress
              sx={{
                height: 2,
                borderRadius: 0,
                '& .MuiLinearProgress-bar': { borderRadius: 0 },
              }}
            />
          )}

          <DocumentTableToolbar
            filters={filters}
            onFilters={handleFilters}
            canReset={canReset}
            onResetFilters={handleResetFilters}
          />

          {canReset && (
            <DocumentTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              onResetFilters={handleResetFilters}
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
            />
          )}

          {/* Banner selezione multipla migliorato */}
          {selectedCount > 0 && (
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                bgcolor: 'primary.lighter',
                borderBottom: 1,
                borderColor: 'primary.light',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Chip
                label={`${selectedCount} selezionat${selectedCount === 1 ? 'o' : 'i'}`}
                color="primary"
                size="small"
                variant="soft"
              />
              <Box sx={{ flex: 1 }} />
              <Tooltip title="Elimina selezionati">
                <IconButton
                  color="error"
                  size="small"
                  onClick={handleDeleteRows}
                  sx={{
                    bgcolor: 'error.lighter',
                    '&:hover': { bgcolor: 'error.light' },
                  }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Tooltip>
            </Box>
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={selectedCount}
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
                  numSelected={selectedCount}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) =>
                    table.onSelectAllRows(
                      checked,
                      tableData.map((row) => row.id)
                    )
                  }
                />

                <TableBody>
                  {documentsLoading
                    ? // Skeleton rows durante il caricamento
                      Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} dense={table.dense} />
                      ))
                    : dataFiltered.map((row) => (
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

                  <TableNoData notFound={notFound && !documentsLoading} />
                </TableBody>
              </Table>
            </Scrollbar>
          </TableContainer>

          <TablePaginationCustom
            count={totalCount}
            page={table.page}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={table.onChangeRowsPerPage}
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
// Skeleton row durante caricamento

function SkeletonRow({ dense }) {
  return (
    <tr>
      <td style={{ padding: '0 8px', width: 44 }}>
        <Skeleton variant="rectangular" width={20} height={20} sx={{ borderRadius: 0.5 }} />
      </td>
      <td style={{ padding: dense ? '8px 16px' : '16px' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Skeleton variant="rounded" width={40} height={40} />
          <Stack spacing={0.5}>
            <Skeleton width={180} height={16} />
            <Skeleton width={120} height={12} />
          </Stack>
        </Stack>
      </td>
      <td style={{ padding: dense ? '8px 16px' : '16px' }}>
        <Skeleton width={80} height={24} sx={{ borderRadius: 2 }} />
      </td>
      <td style={{ padding: dense ? '8px 16px' : '16px' }}>
        <Skeleton width={90} height={24} sx={{ borderRadius: 2 }} />
      </td>
      <td style={{ padding: dense ? '8px 16px' : '16px' }}>
        <Skeleton width={70} height={24} sx={{ borderRadius: 2 }} />
      </td>
      <td style={{ padding: dense ? '8px 16px' : '16px' }}>
        <Skeleton width={80} height={16} />
        <Skeleton width={50} height={12} sx={{ mt: 0.5 }} />
      </td>
      <td style={{ padding: dense ? '8px 8px' : '16px 8px', textAlign: 'right' }}>
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Skeleton variant="circular" width={34} height={34} />
          <Skeleton variant="circular" width={34} height={34} />
        </Stack>
      </td>
    </tr>
  );
}

// ----------------------------------------------------------------------
// BUG FIX: difesa completa su inputData e doc.original_filename

function applyFilter({ inputData, filters }) {
  // Guard: se inputData non è un array, ritorna array vuoto
  if (!Array.isArray(inputData)) return [];

  const { name, status, priority, documentType } = filters;

  let data = [...inputData];

  if (name) {
    const lowerName = name.toLowerCase();
    data = data.filter(
      (doc) =>
        // BUG FIX: optional chaining su original_filename che potrebbe essere null/undefined
        doc.original_filename?.toLowerCase().includes(lowerName) ||
        doc.title?.toLowerCase().includes(lowerName)
    );
  }

  if (status?.length) {
    data = data.filter((doc) => status.includes(doc.processing_status));
  }

  if (priority?.length) {
    data = data.filter((doc) => priority.includes(doc.priority));
  }

  if (documentType?.length) {
    data = data.filter((doc) => documentType.includes(doc.document_type));
  }

  return data;
}
