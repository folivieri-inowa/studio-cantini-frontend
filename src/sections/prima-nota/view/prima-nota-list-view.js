'use client';

import * as Yup from 'yup';
import PropTypes from 'prop-types';
import isEqual from 'lodash/isEqual';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import { styled } from '@mui/material/styles';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
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
} from 'src/components/table';

import axios from '../../../utils/axios';
import { useGetOwners } from '../../../api/owner';
import PrimaNotaTableRow from '../prima-nota-table-row';
import { fTimestamp } from '../../../utils/format-time';
import { useGetCategories } from '../../../api/category';
import { useGetPrimaNota } from '../../../api/prima-nota';
import { useSnackbar } from '../../../components/snackbar';
import ImportHistoryDialog from '../import-history-dialog';
import PrimaNotaTotalModal from '../prima-nota-total-modal';
import PrimaNotaTableToolbar from '../prima-nota-table-toolbar';
import { ConfirmDialog } from '../../../components/custom-dialog';
import PrimaNotaTableFiltersResult from '../prima-nota-table-filters-result';
import PrimaNotaMultipleQuickEditForm from '../prima-nota-multiple-quick-edit-form';
import FormProvider, { RHFUpload, RHFSelect, RHFTextField } from '../../../components/hook-form';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'date', label: 'Data' },
  { id: 'description', label: 'Descrizione' },
  { id: 'owner', label: 'Intestatario conto', width: 180 },
  { id: 'amount', label: 'Importo' },
  { id: 'status', label: 'Stato' },
  { id: '', width: 88 },
];

const PUBLISH_OPTIONS = [
  { value: 'pending', label: 'In revisione' },
  { value: 'completed', label: 'Completate' },
  { value: 'toCheck', label: 'Da controllare' },
];

const defaultFilters = {
  owner: [],
  description: '',
  status: [],
  startDate: null,
  endDate: null,
  categories: [],
};

// ----------------------------------------------------------------------

export default function PrimaNotaListView() {
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const table = useTable();

  const settings = useSettingsContext();

  const [tableData, setTableData] = useState([]);
  const [dataToImport, setDataToImport] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  const [filters, setFilters] = useState(defaultFilters);

  const { transactions, transactionsLoading, transactionsEmpty, refetch } = useGetPrimaNota(settings.db);
  const { owners } = useGetOwners(settings.db);
  const { categories } = useGetCategories(settings.db);

  const quickEdit = useBoolean();
  const importData = useBoolean();
  const confirm = useBoolean();
  const importHistory = useBoolean();
  const totalModal = useBoolean();

  // table.order = 'desc';
  // table.orderBy = 'date';

  useEffect(() => {
    if (transactions.length && owners.length) {
      setTableData(transactions);
      table.setRowsPerPage(rowsPerPage);
    }
  }, [owners.length, rowsPerPage, table, transactions]);

  // Ordina i conti correnti alfabeticamente per nome
  const sortedOwners = useMemo(() => 
    owners ? owners.slice().sort((a, b) => a.name.localeCompare(b.name)) : []
  , [owners]);

  const dateError =
    filters.startDate && filters.endDate
      ? filters.startDate.getTime() > filters.endDate.getTime()
      : false;

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 60 : 80;

  const canReset = !isEqual(defaultFilters, filters) || (!!filters.startDate && !!filters.endDate);

  const notFound = (!dataFiltered.length && canReset) || transactionsEmpty;

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
      const deleteRow = tableData.filter((row) => row.id !== id);
      setTableData(deleteRow);

      table.onUpdatePageDeleteRow(dataInPage.length);

      const response = await axios.post('/api/prima-nota/delete', { ids: [id] });

      if (response.status === 200) {
        confirm.onFalse()
        refetch();
        enqueueSnackbar('File caricato con successo!');
      } else {
        enqueueSnackbar('File caricato con successo!', { variant: 'error' });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataInPage.length, enqueueSnackbar, refetch, table, tableData]
  );

  const handleDeleteRows = useCallback(async () => {
    const deleteRows = tableData.filter((row) => !table.selected.includes(row.id));
    setTableData(deleteRows);

    table.onUpdatePageDeleteRows({
      totalRows: tableData.length,
      totalRowsInPage: dataInPage.length,
      totalRowsFiltered: dataFiltered.length,
    });

    const response = await axios.post('/api/prima-nota/delete', { ids: table.selected });

    if (response.status === 200) {
      confirm.onFalse()
      refetch();
      enqueueSnackbar('Record eliminato correttamente!');
    }else{
      enqueueSnackbar('Si è verificato un errore durante l\'eliminazione!', { variant: 'error' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataFiltered.length, dataInPage.length, enqueueSnackbar, refetch, table, tableData]);

  const handleEditRow = useCallback(
    (id) => {
      router.push(paths.dashboard.prima_nota.edit(id));
    },
    [router]
  );

  const handleViewRow = useCallback(
    (id) => {
      router.push(paths.dashboard.prima_nota.details(id));
    },
    [router]
  );

  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const handleImportRow = useCallback(
    (row) => {
      setDataToImport(row);
      importData.onTrue();
    },
    [importData]
  );

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Elenco"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            {
              name: 'Prima nota',
              href: paths.dashboard.prima_nota.root,
            },
            { name: 'Elenco' },
          ]}
          action={
            <Stack direction="row" spacing={1}>
              <Button
                onClick={importHistory.onTrue}
                variant="outlined"
                startIcon={<Iconify icon="solar:clock-circle-bold" />}
              >
                Storico Importazioni
              </Button>
              <Button
                component={RouterLink}
                href={paths.dashboard.prima_nota.new}
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                Nuova voce
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 5 } }}
        />

        <Card>
          <PrimaNotaTableToolbar
            filters={filters}
            onFilters={handleFilters}
            publishOptions={PUBLISH_OPTIONS}
            ownersOptions={sortedOwners}
            categoriesOptions={categories}
            onImportOpen={importData.onTrue}
            onHistoryOpen={importHistory.onTrue}
          />

          {canReset && (
            <PrimaNotaTableFiltersResult
              filters={filters}
              onFilters={handleFilters}
              //
              onResetFilters={handleResetFilters}
              //
              results={dataFiltered.length}
              sx={{ p: 2.5, pt: 0 }}
              publishOptions={PUBLISH_OPTIONS}
              ownersOptions={sortedOwners}
              categoriesOptions={categories}
            />
          )}

          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <TableSelectedAction
              dense={table.dense}
              numSelected={table.selected.length}
              rowCount={dataFiltered.length}
              onSelectAllRows={(checked) => {
                table.onSelectAllRows(
                  checked,
                  dataFiltered.map((row) => row.id)
                );
              }}
              action={
                <>
                  <Tooltip title="Calcola totale">
                    <IconButton color="primary" onClick={totalModal.onTrue}>
                      <Iconify icon="solar:calculator-bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifica">
                    <IconButton color="primary" onClick={quickEdit.onTrue}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Elimina">
                    <IconButton color="primary" onClick={confirm.onTrue}>
                      <Iconify icon="solar:trash-bin-minimalistic-bold" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Storico importazioni">
                    <IconButton
                      color="primary"
                      onClick={importHistory.onTrue}
                    >
                      <Iconify icon="solar:clock-history" />
                    </IconButton>
                  </Tooltip>
                </>
              }
            />

            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={dataFiltered.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                  onSelectAllRows={(checked) => {
                    table.onSelectAllRows(
                      checked,
                      dataFiltered.map((row) => row.id)
                    );
                  }}
                />

                <TableBody>
                  {transactionsLoading
                    ? [...Array(table.rowsPerPage)].map((i, index) => (
                        <TableSkeleton key={index} sx={{ height: denseHeight }} />
                      ))
                    : dataFiltered
                        .slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <PrimaNotaTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onSelectRow={() => table.onSelectRow(row.id)}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                            onEditRow={() => handleEditRow(row.id)}
                            onViewRow={() => handleViewRow(row.id)}
                            onImportData={() => handleImportRow(row)}
                            onUpdate={refetch}
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
            count={dataFiltered.length}
            page={table.page}
            rowsPerPage={rowsPerPage}
            onPageChange={table.onChangePage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(e.target.value)
              table.setRowsPerPage(e.target.value);
            }}
            //
            dense={table.dense}
            onChangeDense={table.onChangeDense}
          />
        </Card>
      </Container>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Elimina righe selezionate"
        content="Sei sicuro di voler eliminare le righe selezionate?"
        action={
          <Button variant="contained" color="error" onClick={handleDeleteRows}>
            Elimina
          </Button>
        }
      />

      <PrimaNotaMultipleQuickEditForm
        open={quickEdit.value}
        onClose={quickEdit.onFalse}
        transactions={table.selected}
        onUpdate={() => {
          table.onSelectAllRows(
            false,
            tableData.map((row) => row.id)
          );
          refetch();
        }}
      />

      <UploadDialog
        open={importData}
        selectedRow={dataToImport}
        db={settings.db}
        onUpdate={() => {
          refetch();
        }}
      />

      <ImportHistoryDialog
        open={importHistory}
        onClose={importHistory.onFalse}
        onUpdate={refetch}
      />

      <PrimaNotaTotalModal
        open={totalModal.value}
        onClose={totalModal.onFalse}
        transactions={dataFiltered.filter((row) => table.selected.includes(row.id))}
      />
    </>
  );
}

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}));

const UploadDialog = ({ open, selectedRow, onUpdate, db }) => {
  const {owners} = useGetOwners(db);
  const {categories} = useGetCategories(db);
  const loadingSend = useBoolean();
  const { enqueueSnackbar } = useSnackbar();

  const ImportSchema = Yup.object().shape({
    category: Yup.string().required('Categoria è un campo obbligatorio'),
    subject: Yup.string().required('Soggetto è un campo obbligatorio'),
  });

  const defaultValues = useMemo(
    () => ({
      file: null,
      owner: '',
      status: '',
      date: '',
      amount: '',
      paymentType: '',
      description: '',
      commissions: 0, // nuovo campo commissioni
      category: '', // campo per la categoria
      subject: ''  // campo per il soggetto
    }),
    []
  );

  const methods = useForm({
    resolver: yupResolver(ImportSchema),
    defaultValues,
  });

  const {
    control,
    setValue,
    watch,
    reset,
    trigger,
    handleSubmit,
    formState: { errors },
  } = methods;

  useEffect(() => {
    if (selectedRow && owners) {
      reset({
        owner: owners.find((o) => o.id === selectedRow.ownerid).name,
        status: selectedRow.status,
        date: selectedRow.date,
        amount: selectedRow.amount,
        paymentType: selectedRow.paymenttype,
        description: selectedRow.description,
        commissions: selectedRow.commissions || '', // valorizza se presente
        category: selectedRow.categoryid || '',
        subject: ''
      })
    }
  }, [owners, reset, selectedRow]);

  const values = watch();

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const files = values.documents || [];

      const newFiles = acceptedFiles.map((file) =>
        Object.assign(file, {
          preview: URL.createObjectURL(file),
        })
      );

      setValue('file', [...files, ...newFiles], { shouldValidate: true });
    },
    [setValue, values.documents]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.file && values.file?.filter((file) => file !== inputFile);
      setValue('file', filtered);
    },
    [setValue, values.file]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('file', []);
  }, [setValue]);

  const handleCreateAndSend = handleSubmit(async (data) => {
    // Attiva la validazione dei campi
    await trigger('category');
    await trigger('subject');
    
    // Verifica che sia specificata almeno categoria e soggetto
    if (!data.category) {
      enqueueSnackbar('È necessario specificare una categoria', { variant: 'error' });
      return;
    }

    if (!data.subject) {
      enqueueSnackbar('È necessario specificare un soggetto', { variant: 'error' });
      return;
    }

    loadingSend.onTrue();

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const formData = new FormData();

      if (data.file && data.file[0]) {
        formData.append('file', data.file[0]); // Il file viene inviato normalmente
      }

      // aggiungi commissioni, categoria e soggetto nei metadata
      formData.append('metadata', JSON.stringify({ 
        db, 
        id: selectedRow.id, 
        commissions: data.commissions,
        categoryId: data.category,
        subject: data.subject
      }));

      const response = await axios.post('/api/prima-nota/import/associated', formData);
      if (response.status === 200) {
        open.onFalse();
        onUpdate()
        enqueueSnackbar('File caricato con successo!');
      }else{
        enqueueSnackbar('Si è verificato un errore');
      }
      loadingSend.onFalse();
      reset();
    } catch (error) {
      console.error(error);
      loadingSend.onFalse();
    }
  });

  return (
    <BootstrapDialog
      open={open.value}
      onClose={open.onFalse}
      maxWidth='md'
      fullWidth
    >
      <DialogTitle sx={{ m: 0, p: 2 }}>
        Importa dati da file
        <Typography variant="body1" color="textPrimary">
          I dati importati verranno associati alla voce selezionata
        </Typography>
      </DialogTitle>
      <IconButton
        aria-label="close"
        onClick={open.onFalse}
        sx={() => ({
          position: 'absolute',
          right: 8,
          top: 8,
        })}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent>
        <FormProvider methods={methods}>
          <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
            <Stack
              direction="row"
              spacing={2}
              sx={{ width: '100%', mb: { xs: 3, md: 0 } }}
              justifyContent="space-between"
            >
              <RHFTextField
                name="owner"
                label="Intestatario Conto"
                disabled
              />
            </Stack>
            <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
              <Controller
                name="date"
                control={control}
                render={({ field, fieldState: { error } }) => (
                  <DatePicker
                    label="Data"
                    value={field.value ? new Date(field.value) : null}
                    disabled
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!error,
                        helperText: error?.message,
                      },
                    }}
                  />
                )}
              />

              <RHFTextField
                type="number"
                name="amount"
                label="Importo"
                placeholder="0.00"
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>€</Box>
                    </InputAdornment>
                  ),
                }}
              />
              <RHFTextField
                name="paymentType"
                label="Metodo di pagamento"
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Stack>

            {/* Campo commissioni */}
            
            <Stack spacing={2}>
              <RHFTextField
                name="description"
                label="Descrizione"
                InputLabelProps={{ shrink: true }}
                disabled
              />
            </Stack>

            <Stack spacing={2}>
              <RHFTextField
                type="number"
                name="commissions"
                label="Commissioni"
                placeholder="-0.00"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box sx={{ typography: 'subtitle2', color: 'text.disabled' }}>€</Box>
                    </InputAdornment>
                  ),
                }}
                onChange={(e) => {
                  const newValue = e.target.value < 0 ? e.target.value : e.target.value * -1;
                  setValue('commissions', newValue);
                }}
              />
            </Stack>
            
            <Stack direction={{ sm: 'column', md: 'row' }} spacing={2}>
              <RHFSelect
                name="category"
                label="Categoria *"
                InputLabelProps={{ shrink: true }}
                error={!!errors.category}
                helperText={errors?.category?.message}
              >
                <option value="" />
                {categories?.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </RHFSelect>
              
              <RHFTextField
                name="subject"
                label="Soggetto *"
                InputLabelProps={{ shrink: true }}
                error={!!errors.subject}
                helperText={errors?.subject?.message}
              />
            </Stack>

            <Stack spacing={2}>
              <RHFUpload
                // thumbnail
                multiple
                accept="application/*"
                name="file"
                maxSize={10485760}
                onDrop={handleDrop}
                onRemove={handleRemoveFile}
                onRemoveAll={handleRemoveAllFiles}
                onUpload={handleCreateAndSend}
              />
            </Stack>
          </Stack>
        </FormProvider>
      </DialogContent>
    </BootstrapDialog>
  );
}

UploadDialog.propTypes = {
  open: PropTypes.object,
  selectedRow: PropTypes.array,
  onUpdate: PropTypes.func,
  db: PropTypes.object,
}


// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters, dateError }) {
  const { name, description, status, startDate, endDate, owner, categories } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    const searchTerms = name.toLowerCase().split(' ').filter(term => term.length > 0);

    inputData = inputData.filter(transaction => {
      const ownerName = transaction.owner.name.toLowerCase();
      // Check if all search terms are included in the owner name
      return searchTerms.every(term => ownerName.includes(term));
    });
  }

  if (description) {
    const searchTerms = description.toLowerCase().split(' ').filter(term => term.length > 0);

    inputData = inputData.filter(transaction => {
      const txDescription = transaction.description.toLowerCase();
      const txAmount = transaction.amount ? transaction.amount.toString() : '';
      
      // Prepara diverse rappresentazioni dell'importo per supportare sia virgola che punto
      const txAmountWithComma = txAmount.replace('.', ','); // Converte 123.45 in 123,45
      const txAmountFormatted = new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(transaction.amount).toLowerCase(); // Formato completo con €
      
      // Check if all search terms are included in the description or amount (in any format)
      return searchTerms.every(term => 
        txDescription.includes(term) || 
        txAmount.includes(term) || 
        txAmountWithComma.includes(term) ||
        txAmountFormatted.includes(term)
      );
    });
  }

  if (status.length) {
    inputData = inputData.filter((transaction) => status.includes(transaction.status));
  }

  if (owner.length) {
    inputData = inputData.filter((transaction) => owner.includes(transaction.ownerid));
  }

  if (categories.length) {
    inputData = inputData.filter((transaction) => categories.includes(transaction.categoryid));
  }

  if (!dateError) {
    if (startDate && endDate) {
      inputData = inputData.filter(
        (transaction) =>
          fTimestamp(transaction.date) >= fTimestamp(startDate) &&
          fTimestamp(transaction.date) <= fTimestamp(endDate)
      );
    }
  }

  return inputData;
}
