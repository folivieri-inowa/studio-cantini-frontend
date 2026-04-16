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
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';

import { useGetVehicleTires, deleteVehicleTire } from 'src/api/vehicles';

import VehicleAssignmentDialog from './vehicle-assignment-dialog';

// ----------------------------------------------------------------------

export default function VehicleTiresTab({ vehicleId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { tires, tiresLoading, tiresMutate } = useGetVehicleTires(vehicleId);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteVehicleTire(id);
      enqueueSnackbar('Record eliminato');
      tiresMutate();
    } catch {
      enqueueSnackbar('Errore eliminazione', { variant: 'error' });
    }
  }, [tiresMutate, enqueueSnackbar]);

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h6">Pneumatici</Typography>
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
                <TableCell>Marca / Modello</TableCell>
                <TableCell>Misura</TableCell>
                <TableCell>Montaggio</TableCell>
                <TableCell>Deposito</TableCell>
                <TableCell>Condizione</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiresLoading && (
                <TableRow><TableCell colSpan={7} align="center">Caricamento...</TableCell></TableRow>
              )}
              {!tiresLoading && tires.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.disabled' }}>Nessun record pneumatici</TableCell></TableRow>
              )}
              {tires.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.tire_type}</TableCell>
                  <TableCell>{[item.brand, item.model].filter(Boolean).join(' / ') || '—'}</TableCell>
                  <TableCell>{item.size || '—'}</TableCell>
                  <TableCell>{item.install_date || '—'}</TableCell>
                  <TableCell>{item.storage_location || '—'}</TableCell>
                  <TableCell>
                    {item.condition ? (
                      <Chip size="small" label={item.condition} variant="soft" />
                    ) : '—'}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleDelete(item.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      {/* Reuse assignment dialog or a dedicated tire dialog — using assignment dialog as placeholder */}
      <VehicleAssignmentDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        vehicleId={vehicleId}
        mode="tires"
        editItem={editItem}
        onSuccess={() => { setOpenDialog(false); tiresMutate(); }}
      />
    </Card>
  );
}
