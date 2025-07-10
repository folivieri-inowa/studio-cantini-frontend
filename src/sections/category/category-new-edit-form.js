import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { useSnackbar } from 'src/components/snackbar';

import axios from '../../utils/axios';
import CategoryTableRow from './category-table-row';
import Scrollbar from '../../components/scrollbar/scrollbar';
import { useSettingsContext } from '../../components/settings';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from '../../components/table';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Nome Categoria' },
  { id: 'subject', label: 'Soggetti associati' },
  { id: '', width: 88 },
];

export default function CategoryNewEditForm({ categoryData, handleUpdate }) {
  const [categories, setCategories] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const settings = useSettingsContext();
  const table = useTable();

  const denseHeight = table.dense ? 52 : 72;

  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (categoryData) {
      setCategories(categoryData);
      table.setRowsPerPage(rowsPerPage);
    }
  }, [categoryData, rowsPerPage, table]);

  const notFound = categories.length === 0;

  const handleAddValue = async (value) => {
    try {
      const response = await axios.post('/api/category/create', { db: settings.db, name: value });
      if (response.data.data.status === 200){
        handleUpdate();
        enqueueSnackbar('Categoria creata con successo', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Errore durante la creazione della categoria', { variant: 'error' });
      console.error(error);
    }
  };

  const handleEditRow = async (data) => {
    try {
      const response = await axios.post('/api/category/edit', { ...data, db: settings.db, });
      if (response.data.data.status === 200) {
        handleUpdate();
        enqueueSnackbar('Categoria aggiornata con successo', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Errore durante la modifica della categoria', { variant: 'error' });
      console.error(error);
    }
  }

  const handleDeleteRow = async (id) => {
    const response = await axios.post('/api/category/delete', { db: settings.db, id });
    if (response.data.data.status === 200) {
      const updatedCategories = categories.filter(val => val.id !== id);
      setCategories(updatedCategories);
      enqueueSnackbar('Categoria eliminata con successo', { variant: 'success' });
    } else {
      enqueueSnackbar('Errore durante l\'eliminazione della categoria', { variant: 'error' });
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item size={12}>
        <Card sx={{ p: 3, mt: 3 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
            sx={{ my: 3 }}
          >
            <Typography variant="h6">Categorie</Typography>
          </Stack>

          <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
              <TextField
                label="Nuova categoria"
                variant="outlined"
                sx={{ width: '100%' }}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await handleAddValue(e.target.value);
                    e.target.value = ''; // Resetta l'input
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={async (e) => {
                  const input = e.target.previousSibling.querySelector('input');
                  if (input) {
                    await handleAddValue(input.value);
                    input.value = '';
                  }
                }}
              >
                <AddIcon /> Aggiungi
              </Button>
            </Stack>
            <Stack direction="row">
              <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
                <Scrollbar>
                  <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 960 }}>
                    <TableHeadCustom
                      order={table.order}
                      orderBy={table.orderBy}
                      headLabel={TABLE_HEAD}
                      rowCount={categories.length}
                      numSelected={table.selected.length}
                      onSort={table.onSort}
                    />

                    <TableBody>
                      {categories
                        .slice(
                          table.page * table.rowsPerPage,
                          table.page * table.rowsPerPage + table.rowsPerPage
                        )
                        .map((row) => (
                          <CategoryTableRow
                            key={row.id}
                            row={row}
                            selected={table.selected.includes(row.id)}
                            onDeleteRow={() => handleDeleteRow(row.id)}
                            onEditRow={(props) => handleEditRow(props)}
                          />
                        ))}

                      <TableEmptyRows
                        height={denseHeight}
                        emptyRows={emptyRows(table.page, table.rowsPerPage, categories.length)}
                      />

                      <TableNoData notFound={notFound} />
                    </TableBody>
                  </Table>
                  <TablePaginationCustom
                    count={categories.length}
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
                </Scrollbar>
              </TableContainer>
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

CategoryNewEditForm.propTypes = {
  categoryData: PropTypes.object,
  handleUpdate: PropTypes.func,
};
