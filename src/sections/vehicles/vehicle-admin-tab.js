'use client';

import { useState, useCallback } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
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
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid2';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';

import { useGetVehicleTaxes, deleteVehicleTax, useGetVehicleZtl, deleteVehicleZtl, updateVehicle } from 'src/api/vehicles';

import VehicleTaxDialog from './vehicle-tax-dialog';
import VehicleZtlDialog from './vehicle-ztl-dialog';

const TAX_STATUS_COLORS = { da_pagare: 'warning', pagato: 'success', esente: 'info' };
const ZTL_STATUS_COLORS = { attiva: 'success', scaduta: 'default', in_rinnovo: 'warning' };

export default function VehicleAdminTab({ vehicle, onVehicleUpdate }) {
  const { enqueueSnackbar } = useSnackbar();
  const vehicleId = vehicle?.id;

  const [openTaxDialog, setOpenTaxDialog] = useState(false);
  const [editTax, setEditTax] = useState(null);
  const [openZtlDialog, setOpenZtlDialog] = useState(false);
  const [editZtl, setEditZtl] = useState(null);
  const [telepassSerial, setTelepassSerial] = useState(vehicle?.telepass_serial || '');
  const [telepassNotes, setTelepassNotes] = useState(vehicle?.telepass_notes || '');
  const [savingTelepass, setSavingTelepass] = useState(false);

  const { taxes, taxesLoading, taxesMutate } = useGetVehicleTaxes(vehicleId);
  const { ztlList, ztlLoading, ztlMutate } = useGetVehicleZtl(vehicleId);

  const handleDeleteTax = useCallback(async (id) => {
    try { await deleteVehicleTax(id); taxesMutate(); enqueueSnackbar('Eliminato', { variant: 'success' }); }
    catch { enqueueSnackbar('Errore eliminazione', { variant: 'error' }); }
  }, [taxesMutate, enqueueSnackbar]);

  const handleDeleteZtl = useCallback(async (id) => {
    try { await deleteVehicleZtl(id); ztlMutate(); enqueueSnackbar('Eliminato', { variant: 'success' }); }
    catch { enqueueSnackbar('Errore eliminazione', { variant: 'error' }); }
  }, [ztlMutate, enqueueSnackbar]);

  const handleSaveTelepass = async () => {
    setSavingTelepass(true);
    try {
      await updateVehicle(vehicleId, { telepass_serial: telepassSerial, telepass_notes: telepassNotes });
      enqueueSnackbar('Telepass salvato', { variant: 'success' });
      if (onVehicleUpdate) onVehicleUpdate();
    } catch { enqueueSnackbar('Errore salvataggio', { variant: 'error' });
    } finally { setSavingTelepass(false); }
  };

  return (
    <Stack spacing={3}>
      {/* BOLLO / SUPERBOLLO */}
      <Card>
        <CardHeader
          title="Bollo & Superbollo"
          action={
            <Button size="small" startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => { setEditTax(null); setOpenTaxDialog(true); }}>
              Nuovo
            </Button>
          }
        />
        <Scrollbar>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Anno</TableCell>
                  <TableCell>Regione</TableCell>
                  <TableCell>Bollo</TableCell>
                  <TableCell>Superbollo</TableCell>
                  <TableCell>Totale</TableCell>
                  <TableCell>Scadenza</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {!taxesLoading && taxes.length === 0 && (
                  <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Nessun bollo registrato</Typography></TableCell></TableRow>
                )}
                {taxes.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell><strong>{t.year}</strong></TableCell>
                    <TableCell>{t.region || '—'}</TableCell>
                    <TableCell>€ {Number(t.bollo_amount).toLocaleString('it-IT')}</TableCell>
                    <TableCell>{Number(t.superbollo_amount) > 0 ? `€ ${Number(t.superbollo_amount).toLocaleString('it-IT')}` : '—'}</TableCell>
                    <TableCell><strong>€ {Number(t.total_amount).toLocaleString('it-IT')}</strong></TableCell>
                    <TableCell>{t.due_date || '—'}</TableCell>
                    <TableCell><Chip size="small" label={t.status} color={TAX_STATUS_COLORS[t.status] || 'default'} variant="soft" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setEditTax(t); setOpenTaxDialog(true); }}><Iconify icon="solar:pen-bold" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteTax(t.id)}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      {/* ZTL */}
      <Card>
        <CardHeader
          title="ZTL"
          action={
            <Button size="small" startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => { setEditZtl(null); setOpenZtlDialog(true); }}>
              Nuovo
            </Button>
          }
        />
        <Scrollbar>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Targa</TableCell>
                  <TableCell>Proprietario</TableCell>
                  <TableCell>Città</TableCell>
                  <TableCell>N° Autorizzazione</TableCell>
                  <TableCell>Tipologia</TableCell>
                  <TableCell>Scadenza</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {!ztlLoading && ztlList.length === 0 && (
                  <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Nessuna ZTL registrata</Typography></TableCell></TableRow>
                )}
                {ztlList.map((z) => (
                  <TableRow key={z.id} hover>
                    <TableCell><strong>{vehicle?.plate}</strong></TableCell>
                    <TableCell>{vehicle?.owner_name || '—'}</TableCell>
                    <TableCell>{z.city || '—'}</TableCell>
                    <TableCell>{z.authorization_number || '—'}</TableCell>
                    <TableCell>{z.permit_type || '—'}</TableCell>
                    <TableCell>{z.valid_until || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setEditZtl(z); setOpenZtlDialog(true); }}><Iconify icon="solar:pen-bold" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteZtl(z.id)}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      {/* TELEPASS */}
      <Card>
        <CardHeader title="Telepass" />
        <CardContent>
          <Stack spacing={2}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField label="Matricola dispositivo" value={telepassSerial} onChange={(e) => setTelepassSerial(e.target.value)} fullWidth />
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField label="Note" value={telepassNotes} onChange={(e) => setTelepassNotes(e.target.value)} fullWidth />
              </Grid>
            </Grid>
            <Stack direction="row" justifyContent="flex-end">
              <Button variant="contained" size="small" onClick={handleSaveTelepass} disabled={savingTelepass}>Salva Telepass</Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <VehicleTaxDialog open={openTaxDialog} onClose={() => setOpenTaxDialog(false)}
        vehicleId={vehicleId} vehicleKw={vehicle?.kw} editItem={editTax} onSuccess={taxesMutate} />
      <VehicleZtlDialog open={openZtlDialog} onClose={() => setOpenZtlDialog(false)}
        vehicleId={vehicleId} editItem={editZtl} onSuccess={ztlMutate} />
    </Stack>
  );
}
