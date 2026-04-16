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

import { useGetVehicleIncidents, deleteVehicleIncident } from 'src/api/vehicles';

import VehicleIncidentDialog from './vehicle-incident-dialog';

// ----------------------------------------------------------------------

const STATUS_COLORS = { aperto: 'error', in_lavorazione: 'warning', chiuso: 'success' };

// ----------------------------------------------------------------------

export default function VehicleIncidentsTab({ vehicleId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const { incidents, incidentsLoading, incidentsMutate } = useGetVehicleIncidents(vehicleId);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteVehicleIncident(id);
      enqueueSnackbar('Sinistro eliminato');
      incidentsMutate();
    } catch {
      enqueueSnackbar('Errore eliminazione', { variant: 'error' });
    }
  }, [incidentsMutate, enqueueSnackbar]);

  const handleEdit = useCallback((item) => { setEditItem(item); setOpenDialog(true); }, []);
  const handleClose = useCallback(() => { setOpenDialog(false); setEditItem(null); }, []);

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h6">Sinistri / Eventi</Typography>
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
                <TableCell>Danno (€)</TableCell>
                <TableCell>N. Sinistro</TableCell>
                <TableCell>Stato</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidentsLoading && (
                <TableRow><TableCell colSpan={7} align="center">Caricamento...</TableCell></TableRow>
              )}
              {!incidentsLoading && incidents.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ color: 'text.disabled' }}>Nessun sinistro</TableCell></TableRow>
              )}
              {incidents.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.incident_type}</TableCell>
                  <TableCell>{item.title}</TableCell>
                  <TableCell>{item.incident_date}</TableCell>
                  <TableCell>{item.damage_amount != null ? Number(item.damage_amount).toLocaleString('it-IT') : '—'}</TableCell>
                  <TableCell>{item.insurance_claim_number || '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={item.status} color={STATUS_COLORS[item.status] || 'default'} variant="soft" />
                  </TableCell>
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

      <VehicleIncidentDialog
        open={openDialog}
        onClose={handleClose}
        vehicleId={vehicleId}
        editItem={editItem}
        onSuccess={() => { handleClose(); incidentsMutate(); }}
      />
    </Card>
  );
}
