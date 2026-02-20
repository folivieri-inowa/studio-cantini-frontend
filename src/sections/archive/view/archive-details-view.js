'use client';

import PropTypes from 'prop-types';
import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { fDateTime } from 'src/utils/format-time';
import { fData } from 'src/utils/format-number';

import axios from 'src/utils/axios';
import { endpoints } from 'src/utils/axios';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import Scrollbar from 'src/components/scrollbar';
import { useSnackbar } from 'src/components/snackbar';

import { useGetArchiveDocument } from 'src/api/archive';
import DocumentStatusChip from '../document-status-chip';
import DocumentPriorityBadge from '../document-priority-badge';
import DocumentTypeChip from '../document-type-chip';

// ----------------------------------------------------------------------

export default function ArchiveDetailsView({ id }) {
  const settings = useSettingsContext();
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const { document: archiveDocument, loading, error } = useGetArchiveDocument(id);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !archiveDocument) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <CustomBreadcrumbs
          heading="Dettagli Documento"
          links={[
            { name: 'Dashboard', href: paths.dashboard.root },
            { name: 'Archivio', href: paths.dashboard.archive.root },
            { name: 'Dettagli' },
          ]}
          sx={{ mb: { xs: 3, md: 5 } }}
        />
        <EmptyContent
          filled
          title="Documento non trovato"
          description="Il documento richiesto non esiste o non hai i permessi per visualizzarlo."
          action={
            <Button
              component="a"
              href={paths.dashboard.archive.root}
              variant="contained"
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={16} />}
            >
              Torna all'Archivio
            </Button>
          }
        />
      </Container>
    );
  }

  const handleDownload = async () => {
    try {
      const link = window.document.createElement('a');
      link.href = archiveDocument.file_path;
      link.download = archiveDocument.original_filename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (err) {
      console.error('Errore durante il download:', err);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await axios.delete(endpoints.archive.delete(id));
      enqueueSnackbar('Documento eliminato con successo', { variant: 'success' });
      router.push(paths.dashboard.archive.root);
    } catch (err) {
      console.error('Errore durante l\'eliminazione:', err);
      enqueueSnackbar('Errore durante l\'eliminazione', { variant: 'error' });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const renderHeader = (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4">{archiveDocument.original_filename}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <DocumentStatusChip status={archiveDocument.processing_status} />
            <DocumentPriorityBadge priority={archiveDocument.priority} />
            <DocumentTypeChip type={archiveDocument.document_type} subtype={archiveDocument.document_subtype} />
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<Iconify icon="eva:download-outline" />}
            onClick={handleDownload}
          >
            Scarica
          </Button>
          <LoadingButton
            variant="soft"
            color="error"
            startIcon={<Iconify icon="eva:trash-2-outline" />}
            onClick={() => setDeleteDialogOpen(true)}
            loading={deleting}
          >
            Elimina
          </LoadingButton>
        </Stack>
      </Stack>

      {archiveDocument.processing_error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          <Typography variant="subtitle2">Errore di elaborazione</Typography>
          <Typography variant="body2">{archiveDocument.processing_error}</Typography>
        </Alert>
      )}
    </Stack>
  );

  const renderMetadata = (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Informazioni Documento
      </Typography>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Nome File:
          </Typography>
          <Typography variant="body2">{archiveDocument.original_filename}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Tipo MIME:
          </Typography>
          <Typography variant="body2">{archiveDocument.mime_type}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Dimensione:
          </Typography>
          <Typography variant="body2">{fData(archiveDocument.file_size)}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Hash SHA-256:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
            {archiveDocument.file_hash}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Caricato il:
          </Typography>
          <Typography variant="body2">{fDateTime(archiveDocument.created_at)}</Typography>
        </Stack>

        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Ultimo aggiornamento:
          </Typography>
          <Typography variant="body2">{fDateTime(archiveDocument.updated_at)}</Typography>
        </Stack>

        {archiveDocument.owner_id && (
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Proprietario:
            </Typography>
            <Typography variant="body2">{archiveDocument.owner_id}</Typography>
          </Stack>
        )}

        {archiveDocument.year && (
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Anno:
            </Typography>
            <Typography variant="body2">{archiveDocument.year}</Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  const renderOCRText = archiveDocument.raw_ocr_text && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Testo Estratto (OCR)
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral', maxHeight: 400, overflow: 'auto' }}>
        <Typography
          variant="body2"
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            fontSize: 12,
            m: 0,
          }}
        >
          {archiveDocument.raw_ocr_text}
        </Typography>
      </Paper>
    </Card>
  );

  const renderCleanedText = archiveDocument.cleaned_text && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Testo Pulito
      </Typography>
      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral', maxHeight: 400, overflow: 'auto' }}>
        <Typography
          variant="body2"
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'monospace',
            fontSize: 12,
            m: 0,
          }}
        >
          {archiveDocument.cleaned_text}
        </Typography>
      </Paper>
    </Card>
  );

  const renderMetadataExtracted = archiveDocument.extracted_metadata &&
    Object.keys(archiveDocument.extracted_metadata).length > 0 && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Metadati Estratti
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableBody>
            {Object.entries(archiveDocument.extracted_metadata).map(([key, value]) => (
              <TableRow key={key}>
                <TableCell sx={{ fontWeight: 600, width: 200 }}>
                  {key}
                </TableCell>
                <TableCell>
                  {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );

  const renderChunks = archiveDocument.chunks && archiveDocument.chunks.length > 0 && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Chunks Semantici ({archiveDocument.chunks.length})
      </Typography>
      <Scrollbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60}>ID</TableCell>
                <TableCell width={80}>Sequenza</TableCell>
                <TableCell>Contenuto</TableCell>
                <TableCell width={120}>Dimensione</TableCell>
                <TableCell width={140}>Stato Qdrant</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archiveDocument.chunks.map((chunk) => (
                <TableRow key={chunk.id} hover>
                  <TableCell>{chunk.id}</TableCell>
                  <TableCell>{chunk.sequence_number}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {chunk.content}
                    </Typography>
                  </TableCell>
                  <TableCell>{chunk.content?.length || 0} caratteri</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={chunk.qdrant_synced ? 'Sincronizzato' : 'Non sincronizzato'}
                      color={chunk.qdrant_synced ? 'success' : 'warning'}
                      variant="soft"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>
    </Card>
  );

  const renderJobs = archiveDocument.jobs && archiveDocument.jobs.length > 0 && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Cronologia Elaborazioni ({archiveDocument.jobs.length})
      </Typography>
      <Scrollbar>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={60}>ID</TableCell>
                <TableCell>Tipo Job</TableCell>
                <TableCell width={120}>Stato</TableCell>
                <TableCell>Iniziato</TableCell>
                <TableCell>Completato</TableCell>
                <TableCell>Durata</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {archiveDocument.jobs.map((job) => {
                const duration = job.started_at && job.completed_at
                  ? Math.round((new Date(job.completed_at) - new Date(job.started_at)) / 1000)
                  : null;

                return (
                  <TableRow key={job.id} hover>
                    <TableCell>{job.id}</TableCell>
                    <TableCell>{job.job_type}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={job.status}
                        color={
                          job.status === 'completed' ? 'success' :
                          job.status === 'failed' ? 'error' :
                          job.status === 'in_progress' ? 'info' :
                          'default'
                        }
                        variant="soft"
                      />
                    </TableCell>
                    <TableCell>
                      {job.started_at ? fDateTime(job.started_at) : '-'}
                    </TableCell>
                    <TableCell>
                      {job.completed_at ? fDateTime(job.completed_at) : '-'}
                    </TableCell>
                    <TableCell>
                      {duration ? `${duration}s` : '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Scrollbar>

      {archiveDocument.jobs.some((job) => job.error_message) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
            Errori
          </Typography>
          {archiveDocument.jobs
            .filter((job) => job.error_message)
            .map((job) => (
              <Alert key={job.id} severity="error" sx={{ mb: 1 }}>
                <Typography variant="caption" fontWeight="bold">
                  {job.job_type}:
                </Typography>{' '}
                {job.error_message}
              </Alert>
            ))}
        </Box>
      )}
    </Card>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Dettagli Documento"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Archivio', href: paths.dashboard.archive.root },
          { name: archiveDocument.original_filename },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {renderHeader}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            {renderMetadata}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            {renderMetadataExtracted}
          </Grid>
        </Grid>

        {renderOCRText}
        {renderCleanedText}
        {renderChunks}
        {renderJobs}
      </Stack>

      {/* Dialog conferma eliminazione */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Conferma eliminazione</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler eliminare il documento <strong>{archiveDocument.original_filename}</strong>?
            Questa operazione è irreversibile.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit" disabled={deleting}>
            Annulla
          </Button>
          <LoadingButton onClick={handleDeleteConfirm} color="error" variant="contained" loading={deleting}>
            Elimina
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

ArchiveDetailsView.propTypes = {
  id: PropTypes.string.isRequired,
};
