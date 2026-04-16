'use client';

import { useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import Scrollbar from 'src/components/scrollbar';

import { useGetVehicleDocuments, deleteVehicleDocument } from 'src/api/vehicles';

import VehicleDocumentDialog from './vehicle-document-dialog';

// ----------------------------------------------------------------------

export default function VehicleDocumentsTab({ vehicleId }) {
  const { enqueueSnackbar } = useSnackbar();
  const [openDialog, setOpenDialog] = useState(false);
  const { documents, documentsLoading, documentsMutate } = useGetVehicleDocuments(vehicleId);

  const handleDelete = useCallback(async (id) => {
    try {
      await deleteVehicleDocument(id);
      enqueueSnackbar('Documento eliminato');
      documentsMutate();
    } catch {
      enqueueSnackbar('Errore eliminazione', { variant: 'error' });
    }
  }, [documentsMutate, enqueueSnackbar]);

  return (
    <Card>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
        <Typography variant="h6">Documenti</Typography>
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
                <TableCell>Scadenza</TableCell>
                <TableCell align="right">Azioni</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documentsLoading && (
                <TableRow><TableCell colSpan={5} align="center">Caricamento...</TableCell></TableRow>
              )}
              {!documentsLoading && documents.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ color: 'text.disabled' }}>Nessun documento</TableCell></TableRow>
              )}
              {documents.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>{doc.document_type}</TableCell>
                  <TableCell>{doc.title}</TableCell>
                  <TableCell>{doc.document_date || '—'}</TableCell>
                  <TableCell>{doc.expiry_date || '—'}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                      <IconButton
                        size="small"
                        component="a"
                        href={`/api/vehicles/documents/file/${encodeURIComponent(doc.file_path)}`}
                        target="_blank"
                      >
                        <Iconify icon="solar:download-bold" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)}>
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

      <VehicleDocumentDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        vehicleId={vehicleId}
        onSuccess={() => { setOpenDialog(false); documentsMutate(); }}
      />
    </Card>
  );
}
