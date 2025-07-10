'use client';

import isEqual from 'lodash/isEqual';
import { useState, useEffect, useCallback } from 'react';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import axios from '../../../utils/axios';
import CategoryTableRow from '../category-table-row';
import { useGetCategories } from '../../../api/category';
import { useSnackbar } from '../../../components/snackbar';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Categoria principale' },
  { id: 'subcategory', label: 'Sottocategoria' },
  { id: '', width: 88 },
];

const defaultFilters = {
  name: '',
};

// ----------------------------------------------------------------------

export default function CategoryListView() {
  const table = useTable();
  const { enqueueSnackbar } = useSnackbar();

  const settings = useSettingsContext();

  const { categories, refetchCategories } = useGetCategories(settings.db);

  const [tableData, setTableData] = useState(categories);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const filters = defaultFilters

  useEffect(() => {
    if (categories) {
      setTableData(categories);
      table.setRowsPerPage(rowsPerPage);
    }
  }, [categories, rowsPerPage, table]);

  const dataFiltered = applyFilter({
    inputData: tableData,
    comparator: getComparator(table.order, table.orderBy),
    filters,
  });

  const dataInPage = dataFiltered.slice(
    table.page * table.rowsPerPage,
    table.page * table.rowsPerPage + table.rowsPerPage
  );

  const denseHeight = table.dense ? 52 : 72;

  const canReset = !isEqual(defaultFilters, filters);

  const notFound = (!dataFiltered.length && canReset) || !dataFiltered.length;

  const handleDeleteRow = useCallback(
    async (category) => {
      // Debug logging
      console.log('Deleting category:', category);
      
      // Assicuriamoci che l'id sia nel formato corretto
      const payload = {
        id: category.id || category._id, // Usiamo id o _id a seconda di quale è disponibile
        db: category.db || settings.db // Utilizziamo db dalla categoria se disponibile, altrimenti dalle impostazioni
      };
      
      console.log('Delete payload:', payload);
      
      const response = await axios.post('/api/category/delete', payload);
      if (response.status === 200) {
        enqueueSnackbar('Record eliminato con successo', { variant: 'success' });
        refetchCategories();

        table.onUpdatePageDeleteRow(dataInPage.length);
      } else {
        enqueueSnackbar('Errore durante l\'eliminazione del record', { variant: 'error' });
      }
    },
    [dataInPage.length, enqueueSnackbar, refetchCategories, settings.db, table]
  );

  const handleEditRow = useCallback(
    async (updatedCategory) => {
      try {
        // Debug logging
        console.log('Category object ricevuto per la modifica:', updatedCategory);
        
        // Otteniamo la categoria originale dai dati della tabella se necessario
        // Questo è utile per recuperare campi che potrebbero non essere nel form
        const originalCategory = dataFiltered.find(c => 
          (c.id === updatedCategory.id || c._id === updatedCategory._id)
        );
        console.log('Categoria originale trovata:', originalCategory);
        
        // Utilizziamo in modo esplicito il nome dalla categoria aggiornata
        // perché questo è il campo che vogliamo modificare
        const payload = {
          id: updatedCategory.id || updatedCategory._id,
          name: updatedCategory.name, // Ci assicuriamo di usare il nome aggiornato dal form
          db: updatedCategory.db || settings.db
        };
        
        console.log('Payload finale da inviare al server:', payload);
        
        // Assicuriamoci che name contenga il valore aggiornato
        if (!payload.name) {
          console.error('Nome mancante nel payload!');
          enqueueSnackbar('Errore: nome categoria mancante', { variant: 'error' });
          return;
        }
        
        const response = await axios.post('/api/category/edit', payload);
        if (response.status === 200) {
          enqueueSnackbar('Categoria aggiornata con successo', { variant: 'success' });
          refetchCategories();
        } else {
          enqueueSnackbar('Errore durante l\'aggiornamento della categoria', { variant: 'error' });
        }
      } catch (error) {
        console.error(error);
        enqueueSnackbar('Errore durante l\'aggiornamento della categoria', { variant: 'error' });
      }
    },
    [dataFiltered, enqueueSnackbar, refetchCategories, settings.db]
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Elenco Categorie"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Elenco Categorie', href: paths.dashboard.category.root },
            { name: 'Elenco' },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.category.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              Nuova Categoria
            </Button>
          }
          sx={{
            mb: { xs: 3, md: 5 },
          }}
        />

        <Card>
          <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
            <Scrollbar>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={tableData.length}
                  numSelected={table.selected.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataFiltered
                    .slice(
                      table.page * table.rowsPerPage,
                      table.page * table.rowsPerPage + table.rowsPerPage
                    )
                    .map((row) => (
                      <CategoryTableRow
                        key={row.id || row._id}
                        row={row}
                        selected={table.selected.includes(row.id || row._id)}
                        onSelectRow={() => table.onSelectRow(row.id || row._id)}
                        onDeleteRow={() => handleDeleteRow(row)}
                        onEditRow={() => handleEditRow(row)}
                        handleUpdate={refetchCategories}
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
  );
}

// ----------------------------------------------------------------------

function applyFilter({ inputData, comparator, filters }) {
  const { name } = filters;

  const stabilizedThis = inputData.map((el, index) => [el, index]);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  inputData = stabilizedThis.map((el) => el[0]);

  if (name) {
    inputData = inputData.filter(
      (user) => user.name.toLowerCase().indexOf(name.toLowerCase()) !== -1
    );
  }

  return inputData;
}
