'use client';

import { useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';

import { useGetVehicleMaintenance, deleteVehicleMaintenance } from 'src/api/vehicles';

import VehicleMaintenanceDialog from './vehicle-maintenance-dialog';

// ----------------------------------------------------------------------

export default function VehicleMaintenanceTab({ vehicleId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { maintenance, maintenanceLoading, maintenanceMutate } = useGetVehicleMaintenance(vehicleId);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteVehicleMaintenance(id);
      enqueueSnackbar('Manutenzione eliminata');
      maintenanceMutate();
    } catch {
      enqueueSnackbar('Errore eliminazione', { variant: 'error' });
    }
  }, [maintenanceMutate, enqueueSnackbar]);

  const handleEdit = useCallback((item) => {
    setEditItem(item);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditItem(null);
  }, []);

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h6">Manutenzioni</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenDialog(true)}
        >
          Aggiungi
        </Button>
      </Stack>

      <Scrollbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tipo</TableCell>
                <TableCell>Titolo</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Km</TableCell>
                <TableCell>Fornitore</TableCell>
                <TableCell>Importo</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {maintenanceLoading && (
                <TableRow><TableCell colSpan={7} align="center">Caricamento...</TableCell></TableRow>
              )}
              {!maintenanceLoading && maintenance.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.disabled' }}>Nessuna manutenzione</TableCell></TableRow>
              )}
              {maintenance.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.maintenance_type}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.maintenance_date}</TableCell>
                  <TableCell>{item.mileage ? `${item.mileage.toLocaleString('it-IT')} km` : '—'}</TableCell>
                  <TableCell>{item.vendor || '—'}</TableCell>
                  <TableCell>{item.amount != null ? `€ ${Number(item.amount).toLocaleString('it-IT')}` : '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end">
                      <IconButton size="small" onClick={() => handleEdit(item)}>
                        <Iconify icon="solar:pen-bold" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                        <Iconify icon="solar:trash-bin-trash-bold" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      <VehicleMaintenanceDialog
        open={openDialog}
        onClose={handleCloseDialog}
        vehicleId={vehicleId}
        editItem={editItem}
        onSuccess={() => { handleCloseDialog(); maintenanceMutate(); }}
      />
    </Card>
  );
}
