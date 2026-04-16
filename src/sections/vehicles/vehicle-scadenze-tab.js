'use client';

import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import Iconify from 'src/components/iconify';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';

import { useGetScadenziario } from 'src/api/scadenziario';

import VehicleScadenzaDialog from './vehicle-scadenza-dialog';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  completed: 'success',
  upcoming: 'warning',
  overdue: 'error',
  future: 'info',
};

// ----------------------------------------------------------------------

export default function VehicleScadenzeTab({ vehicleId }) {
  const [openDialog, setOpenDialog] = useState(false);
  const { scadenziario, scadenziarioLoading, scadenziarioMutate } = useGetScadenziario({ vehicleId });

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h6">Scadenze</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setOpenDialog(true)}
        >
          Nuova Scadenza
        </Button>
      </Stack>

      <Scrollbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Soggetto</TableCell>
                <TableCell>Scadenza</TableCell>
                <TableCell>Importo</TableCell>
                <TableCell>Stato</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scadenziarioLoading && (
                <TableRow><TableCell colSpan={4} align="center">Caricamento...</TableCell></TableRow>
              )}
              {!scadenziarioLoading && scadenziario.length === 0 && (
                <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.disabled' }}>Nessuna scadenza</TableCell></TableRow>
              )}
              {scadenziario.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{item.subject}</TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.amount != null ? `€ ${Number(item.amount).toLocaleString('it-IT')}` : '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={item.status} color={STATUS_COLORS[item.status] || 'default'} variant="soft" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      <VehicleScadenzaDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        vehicleId={vehicleId}
        onSuccess={() => { setOpenDialog(false); scadenziarioMutate(); }}
      />
    </Card>
  );
}
