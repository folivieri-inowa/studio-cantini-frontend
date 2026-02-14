'use client';

import PropTypes from 'prop-types';

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

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { fDateTime } from 'src/utils/format-time';
import { fData } from 'src/utils/format-number';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';
import Scrollbar from 'src/components/scrollbar';

import { useGetArchiveDocument } from 'src/api/archive';
import DocumentStatusChip from '../document-status-chip';
import DocumentPriorityBadge from '../document-priority-badge';
import DocumentTypeChip from '../document-type-chip';

// ----------------------------------------------------------------------

export default function ArchiveDetailsView({ id }) {
  const settings = useSettingsContext();
  const router = useRouter();
  
  const { document, loading, error } = useGetArchiveDocument(id);

  if (loading) {
    return (
      <Container maxWidth={settings.themeStretch ? false : 'lg'}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !document) {
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
      // Download del file originale
      const link = document.createElement('a');
      link.href = document.file_path;
      link.download = document.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Errore durante il download:', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Sei sicuro di voler eliminare questo documento?')) {
      try {
        // TODO: Implementare la chiamata API di eliminazione
        router.push(paths.dashboard.archive.root);
      } catch (err) {
        console.error('Errore durante l\'eliminazione:', err);
      }
    }
  };

  const renderHeader = (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Stack spacing={1}>
          <Typography variant="h4">{document.original_filename}</Typography>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <DocumentStatusChip status={document.processing_status} />
            <DocumentPriorityBadge priority={document.priority} />
            <DocumentTypeChip type={document.document_type} subtype={document.document_subtype} />
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
            onClick={handleDelete}
          >
            Elimina
          </LoadingButton>
        </Stack>
      </Stack>

      {document.processing_error && (
        <Alert severity="error" sx={{ width: '100%' }}>
          <Typography variant="subtitle2">Errore di elaborazione</Typography>
          <Typography variant="body2">{document.processing_error}</Typography>
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
          <Typography variant="body2">{document.original_filename}</Typography>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Tipo MIME:
          </Typography>
          <Typography variant="body2">{document.mime_type}</Typography>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Dimensione:
          </Typography>
          <Typography variant="body2">{fData(document.file_size)}</Typography>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Hash SHA-256:
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 11 }}>
            {document.file_hash}
          </Typography>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Caricato il:
          </Typography>
          <Typography variant="body2">{fDateTime(document.created_at)}</Typography>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
            Ultimo aggiornamento:
          </Typography>
          <Typography variant="body2">{fDateTime(document.updated_at)}</Typography>
        </Stack>
        
        {document.owner_id && (
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Proprietario:
            </Typography>
            <Typography variant="body2">{document.owner_id}</Typography>
          </Stack>
        )}
        
        {document.year && (
          <Stack direction="row" spacing={2}>
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>
              Anno:
            </Typography>
            <Typography variant="body2">{document.year}</Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  const renderOCRText = document.raw_ocr_text && (
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
          {document.raw_ocr_text}
        </Typography>
      </Paper>
    </Card>
  );

  const renderCleanedText = document.cleaned_text && (
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
          {document.cleaned_text}
        </Typography>
      </Paper>
    </Card>
  );

  const renderMetadataExtracted = document.extracted_metadata && 
    Object.keys(document.extracted_metadata).length > 0 && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Metadati Estratti
      </Typography>
      <TableContainer>
        <Table size="small">
          <TableBody>
            {Object.entries(document.extracted_metadata).map(([key, value]) => (
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

  const renderChunks = document.chunks && document.chunks.length > 0 && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Chunks Semantici ({document.chunks.length})
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
              {document.chunks.map((chunk) => (
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

  const renderJobs = document.jobs && document.jobs.length > 0 && (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Cronologia Elaborazioni ({document.jobs.length})
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
              {document.jobs.map((job) => {
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
      
      {document.jobs.some((job) => job.error_message) && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="error.main" sx={{ mb: 1 }}>
            Errori
          </Typography>
          {document.jobs
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
          { name: document.original_filename },
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
    </Container>
  );
}

ArchiveDetailsView.propTypes = {
  id: PropTypes.string.isRequired,
};
