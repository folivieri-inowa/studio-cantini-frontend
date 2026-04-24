'use client';

import { useState, useCallback } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
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
import Divider from '@mui/material/Divider';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';

import { useGetVehiclePolicies, deleteVehiclePolicy, useGetVehicleIncidents, deleteVehicleIncident, useGetVehicleFines, deleteVehicleFine } from 'src/api/vehicles';

import VehiclePolicyDialog from './vehicle-policy-dialog';
import VehicleIncidentDialog from './vehicle-incident-dialog';
import VehicleFineDialog from './vehicle-fine-dialog';

const POLICY_STATUS_COLORS = { attiva: 'success', scaduta: 'default', disdetta: 'error' };
const INCIDENT_STATUS_COLORS = { aperto: 'error', in_lavorazione: 'warning', chiuso: 'success' };
const FINE_STATUS_COLORS = { da_pagare: 'warning', pagato: 'success', ricorsato: 'info', annullato: 'default' };

export default function VehicleInsuranceTab({ vehicleId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [openPolicyDialog, setOpenPolicyDialog] = useState(false);
  const [editPolicy, setEditPolicy] = useState(null);
  const [openIncidentDialog, setOpenIncidentDialog] = useState(false);
  const [editIncident, setEditIncident] = useState(null);
  const [openFineDialog, setOpenFineDialog] = useState(false);
  const [editFine, setEditFine] = useState(null);

  const { policies, policiesLoading, policiesMutate } = useGetVehiclePolicies(vehicleId);
  const { incidents, incidentsLoading, incidentsMutate } = useGetVehicleIncidents(vehicleId);
  const { fines, finesLoading, finesMutate } = useGetVehicleFines(vehicleId);

  const handleDeletePolicy = useCallback(async (id) => {
    try {
      await deleteVehiclePolicy(id);
      policiesMutate();
      enqueueSnackbar('Polizza eliminata', { variant: 'success' });
    } catch { enqueueSnackbar('Errore eliminazione', { variant: 'error' }); }
  }, [policiesMutate, enqueueSnackbar]);

  const handleDeleteIncident = useCallback(async (id) => {
    try {
      await deleteVehicleIncident(id);
      incidentsMutate();
      enqueueSnackbar('Sinistro eliminato', { variant: 'success' });
    } catch { enqueueSnackbar('Errore eliminazione', { variant: 'error' }); }
  }, [incidentsMutate, enqueueSnackbar]);

  const handleDeleteFine = useCallback(async (id) => {
    try {
      await deleteVehicleFine(id);
      finesMutate();
      enqueueSnackbar('Contravvenzione eliminata', { variant: 'success' });
    } catch { enqueueSnackbar('Errore eliminazione', { variant: 'error' }); }
  }, [finesMutate, enqueueSnackbar]);

  return (
    <Stack spacing={3}>
      {/* POLIZZE */}
      <Card>
        <CardHeader
          title="Polizze assicurative"
          action={
            <Button size="small" startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => { setEditPolicy(null); setOpenPolicyDialog(true); }}>
              Nuova polizza
            </Button>
          }
        />
        <Scrollbar>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>N° Polizza</TableCell>
                  <TableCell>Compagnia</TableCell>
                  <TableCell>Coperture</TableCell>
                  <TableCell>Scadenza</TableCell>
                  <TableCell>Premio</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {!policiesLoading && policies.length === 0 && (
                  <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Nessuna polizza registrata</Typography></TableCell></TableRow>
                )}
                {policies.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.policy_number}</TableCell>
                    <TableCell>{p.insurer}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap">
                        {(p.policy_types || []).map((t) => <Chip key={t} label={t} size="small" variant="soft" />)}
                      </Stack>
                    </TableCell>
                    <TableCell>{p.end_date}</TableCell>
                    <TableCell>{p.premium_amount ? `€ ${Number(p.premium_amount).toLocaleString('it-IT')}` : '—'}</TableCell>
                    <TableCell><Chip size="small" label={p.status} color={POLICY_STATUS_COLORS[p.status] || 'default'} variant="soft" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setEditPolicy(p); setOpenPolicyDialog(true); }}><Iconify icon="solar:pen-bold" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeletePolicy(p.id)}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      <Divider />

      {/* SINISTRI */}
      <Card>
        <CardHeader
          title="Sinistri"
          action={
            <Button size="small" startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => { setEditIncident(null); setOpenIncidentDialog(true); }}>
              Nuovo sinistro
            </Button>
          }
        />
        <Scrollbar>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Titolo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Data</TableCell>
                  <TableCell>Danno</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {!incidentsLoading && incidents.length === 0 && (
                  <TableRow><TableCell colSpan={6}><Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Nessun sinistro registrato</Typography></TableCell></TableRow>
                )}
                {incidents.map((inc) => (
                  <TableRow key={inc.id} hover>
                    <TableCell>{inc.title}</TableCell>
                    <TableCell>{inc.incident_type}</TableCell>
                    <TableCell>{inc.incident_date}</TableCell>
                    <TableCell>{inc.damage_amount ? `€ ${Number(inc.damage_amount).toLocaleString('it-IT')}` : '—'}</TableCell>
                    <TableCell><Chip size="small" label={inc.status} color={INCIDENT_STATUS_COLORS[inc.status] || 'default'} variant="soft" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setEditIncident(inc); setOpenIncidentDialog(true); }}><Iconify icon="solar:pen-bold" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteIncident(inc.id)}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      <Divider />

      {/* CONTRAVVENZIONI */}
      <Card>
        <CardHeader
          title="Contravvenzioni"
          action={
            <Button size="small" startIcon={<Iconify icon="solar:add-circle-bold" />}
              onClick={() => { setEditFine(null); setOpenFineDialog(true); }}>
              Nuova contravvenzione
            </Button>
          }
        />
        <Scrollbar>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>N° Verbale</TableCell>
                  <TableCell>Ente</TableCell>
                  <TableCell>Infrazione</TableCell>
                  <TableCell>Importo</TableCell>
                  <TableCell>Scadenza</TableCell>
                  <TableCell>Stato</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {!finesLoading && fines.length === 0 && (
                  <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>Nessuna contravvenzione registrata</Typography></TableCell></TableRow>
                )}
                {fines.map((f) => (
                  <TableRow key={f.id} hover>
                    <TableCell>{f.fine_date}</TableCell>
                    <TableCell>{f.violation_number || '—'}</TableCell>
                    <TableCell>{f.issuing_authority || '—'}</TableCell>
                    <TableCell>{f.violation_type || '—'}</TableCell>
                    <TableCell>€ {Number(f.amount).toLocaleString('it-IT')}</TableCell>
                    <TableCell>{f.due_date || '—'}</TableCell>
                    <TableCell><Chip size="small" label={f.status} color={FINE_STATUS_COLORS[f.status] || 'default'} variant="soft" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => { setEditFine(f); setOpenFineDialog(true); }}><Iconify icon="solar:pen-bold" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDeleteFine(f.id)}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>
      </Card>

      <VehiclePolicyDialog open={openPolicyDialog} onClose={() => setOpenPolicyDialog(false)}
        vehicleId={vehicleId} editItem={editPolicy} onSuccess={policiesMutate} />
      <VehicleIncidentDialog open={openIncidentDialog} onClose={() => setOpenIncidentDialog(false)}
        vehicleId={vehicleId} editItem={editIncident} onSuccess={incidentsMutate} />
      <VehicleFineDialog open={openFineDialog} onClose={() => setOpenFineDialog(false)}
        vehicleId={vehicleId} editItem={editFine} onSuccess={finesMutate} />
    </Stack>
  );
}
