import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';

import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import DetailTableRow from './detail-table-row';
import axios, { endpoints } from '../../../utils/axios';
import { useSnackbar } from '../../../components/snackbar';
import Scrollbar from '../../../components/scrollbar/scrollbar';
import { useSettingsContext } from '../../../components/settings';
import {
  useTable,
  emptyRows,
  TableNoData,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from '../../../components/table';

// ----------------------------------------------------------------------

export default function DetailNewEditForm({ rowId, open, onClose, onUpdate }) {
  const [details, setDetails] = useState([]);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const table = useTable();
  const { db } = useSettingsContext();
  const denseHeight = table.dense ? 52 : 72;
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post(endpoints.detail.list, { db, subjectId: rowId });
        if (response.status === 200) {
          setDetails(response.data.data);
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (open){
      fetchData();
      table.setRowsPerPage(rowsPerPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const notFound = details.length === 0;

  const handleAddValue = async (value) => {
    try {
      const response = await axios.post('/api/detail/create', { db, name: value, subjectId: rowId });
      if (response.status === 200){
        const newDetail = response.data.data.detail[0];
        setDetails((prevDetails) => [...prevDetails, newDetail]);
        enqueueSnackbar('Dettaglio creato con successo', { variant: 'success' });
      }
    } catch (error) {
      enqueueSnackbar('Errore durante la creazione del dettaglio', { variant: 'error' });
      console.error(error);
    }
  };

  const handleEditRow = async (data) => {
    try {
      const response = await axios.post('/api/detail/edit', { ...data, db, });
      if (response.status === 200) {
        setDetails((prevSubjects) =>
          prevSubjects.map((subject) =>
            subject.id === data.id ? { ...subject, name: data.name } : subject
          )
        );
        
        // Notifica del successo con il messaggio corretto
        enqueueSnackbar('Dettaglio aggiornato con successo', { variant: 'success' });
        
        // Aggiorniamo anche il componente padre
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      enqueueSnackbar('Errore durante la modifica del dettaglio', { variant: 'error' });
      console.error(error);
    }
  }

  const handleDeleteRow = async (id) => {
    try {
      const response = await axios.post('/api/detail/delete', { db, id });
      if (response.status === 200) {
        const updatedSubjects = details.filter(val => val.id !== id);
        setDetails(updatedSubjects);
        enqueueSnackbar('Dettaglio eliminato con successo', { variant: 'success' });
        
        // Aggiorniamo anche il componente padre
        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (error) {
      enqueueSnackbar('Errore durante l\'eliminazione del dettaglio', { variant: 'error' });
      console.log(error);
    }
  };

  return (
    <Dialog fullWidth maxWidth="lg" open={open} onClose={onClose}>
      <DialogTitle>Nuovo Dettaglio</DialogTitle>

      <DialogContent>
        <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />} spacing={3}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }}>
            <TextField
              label="Nuovo dettaglio"
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

          <Scrollbar>
            <Table size="medium" sx={{ minWidth: 960 }}>
              <TableHeadCustom
                order={table.order}
                orderBy={table.orderBy}
                headLabel={[
                  { id: 'name', label: 'Nome' },
                  { id: '', width: 88 },
                ]}
                rowCount={details.length}
                numSelected={table.selected.length}
                onSort={table.onSort}
              />

              <TableBody>
                {details
                  .slice(
                    table.page * table.rowsPerPage,
                    table.page * table.rowsPerPage + table.rowsPerPage
                  )
                  .map((row) => (
                    <DetailTableRow
                      key={row.id}
                      row={row}
                      selected={table.selected.includes(row.id)}
                      onDeleteRow={() => handleDeleteRow(row.id)}
                      onEditRow={(prop) => handleEditRow(prop)}
                    />
                  ))}

                <TableEmptyRows
                  height={denseHeight}
                  emptyRows={emptyRows(table.page, table.rowsPerPage, details.length)}
                />

                <TableNoData notFound={notFound} />
              </TableBody>
            </Table>
          </Scrollbar>

          <TablePaginationCustom
            count={details.length}
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
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button
          variant="outlined"
          onClick={() => {
            onUpdate()
            onClose();
          }}
        >
          Chiudi
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DetailNewEditForm.propTypes = {
  rowId: PropTypes.string,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  onUpdate: PropTypes.func,
};
