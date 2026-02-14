'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { fDateTime } from 'src/utils/format-time';
import { fData } from 'src/utils/format-number';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import Iconify from 'src/components/iconify';
import EmptyContent from 'src/components/empty-content';

import DocumentStatusChip from '../document-status-chip';
import DocumentPriorityBadge from '../document-priority-badge';
import DocumentTypeChip from '../document-type-chip';
import axios, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const DOCUMENT_TYPES = [
  { value: 'fattura', label: 'Fattura' },
  { value: 'contratto', label: 'Contratto' },
  { value: 'ricevuta', label: 'Ricevuta' },
  { value: 'bilancio', label: 'Bilancio' },
  { value: 'dichiarazione_fiscale', label: 'Dichiarazione Fiscale' },
  { value: 'comunicazione', label: 'Comunicazione' },
  { value: 'altro', label: 'Altro' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'In Attesa' },
  { value: 'ocr_in_progress', label: 'OCR in Corso' },
  { value: 'ocr_completed', label: 'OCR Completato' },
  { value: 'cleaning_in_progress', label: 'Pulizia in Corso' },
  { value: 'cleaning_completed', label: 'Pulizia Completata' },
  { value: 'embedding_in_progress', label: 'Embedding in Corso' },
  { value: 'embedding_completed', label: 'Embedding Completato' },
  { value: 'completed', label: 'Completato' },
  { value: 'failed', label: 'Fallito' },
];

// ----------------------------------------------------------------------

export default function ArchiveSearchView() {
  const settings = useSettingsContext();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 500);
  
  const [filters, setFilters] = useState({
    documentType: '',
    status: '',
    dateFrom: null,
    dateTo: null,
  });

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMetrics, setSearchMetrics] = useState(null);

  const handleSearch = useCallback(async () => {
    if (!debouncedQuery.trim()) {
      setResults(null);
      setSearchMetrics(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        query: debouncedQuery,
        limit: 20,
        db: settings.db,
      };

      // Aggiungi filtri se presenti
      if (filters.documentType) {
        params.document_type = filters.documentType;
      }
      if (filters.status) {
        params.status = filters.status;
      }
      if (filters.dateFrom) {
        params.date_from = filters.dateFrom.toISOString();
      }
      if (filters.dateTo) {
        params.date_to = filters.dateTo.toISOString();
      }

      const response = await axios.post(endpoints.archive.search, params);
      
      setResults(response.data.results || []);
      setSearchMetrics(response.data.metrics);
    } catch (err) {
      console.error('Errore durante la ricerca:', err);
      setError(err.message || 'Errore durante la ricerca');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, filters, settings.db]);

  // Esegui la ricerca quando cambia la query debounced o i filtri
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const handleFilterChange = (field) => (event) => {
    setFilters((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleDateChange = (field) => (date) => {
    setFilters((prev) => ({
      ...prev,
      [field]: date,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      documentType: '',
      status: '',
      dateFrom: null,
      dateTo: null,
    });
  };

  const handleResultClick = (documentId) => {
    router.push(paths.dashboard.archive.details(documentId));
  };

  const renderSearch = (
    <Card sx={{ p: 3 }}>
      <Stack spacing={3}>
        <TextField
          fullWidth
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cerca nei documenti..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
              </InputAdornment>
            ),
            endAdornment: loading && (
              <InputAdornment position="end">
                <CircularProgress size={20} />
              </InputAdornment>
            ),
          }}
        />

        <Divider />

        <Typography variant="subtitle2">Filtri</Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo Documento</InputLabel>
              <Select
                value={filters.documentType}
                onChange={handleFilterChange('documentType')}
                label="Tipo Documento"
              >
                <MenuItem value="">Tutti</MenuItem>
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Stato</InputLabel>
              <Select
                value={filters.status}
                onChange={handleFilterChange('status')}
                label="Stato"
              >
                <MenuItem value="">Tutti</MenuItem>
                {STATUS_OPTIONS.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DatePicker
              label="Data Da"
              value={filters.dateFrom}
              onChange={handleDateChange('dateFrom')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <DatePicker
              label="Data A"
              value={filters.dateTo}
              onChange={handleDateChange('dateTo')}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                },
              }}
            />
          </Grid>
        </Grid>

        {(filters.documentType || filters.status || filters.dateFrom || filters.dateTo) && (
          <Stack direction="row" justifyContent="flex-end">
            <Button
              size="small"
              color="inherit"
              startIcon={<Iconify icon="eva:close-fill" />}
              onClick={handleClearFilters}
            >
              Cancella Filtri
            </Button>
          </Stack>
        )}
      </Stack>
    </Card>
  );

  const renderMetrics = searchMetrics && (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Risultati Totali
            </Typography>
            <Typography variant="h6">{searchMetrics.total_results}</Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Fulltext Match
            </Typography>
            <Typography variant="h6">{searchMetrics.fulltext_count}</Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Semantic Match
            </Typography>
            <Typography variant="h6">{searchMetrics.semantic_count}</Typography>
          </Stack>
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Tempo
            </Typography>
            <Typography variant="h6">{searchMetrics.search_time_ms}ms</Typography>
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  );

  const renderResults = (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && results && results.length === 0 && (
        <EmptyContent
          filled
          title="Nessun risultato"
          description="Non sono stati trovati documenti che corrispondono alla tua ricerca."
          sx={{ py: 10 }}
        />
      )}

      {!loading && !error && results && results.length > 0 && (
        <Stack spacing={2}>
          {renderMetrics}

          <Typography variant="body2" color="text.secondary">
            {results.length} {results.length === 1 ? 'risultato trovato' : 'risultati trovati'}
          </Typography>

          {results.map((result) => (
            <Card
              key={result.document_id}
              sx={{
                p: 2,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  boxShadow: (theme) => theme.customShadows.z8,
                },
              }}
              onClick={() => handleResultClick(result.document_id)}
            >
              <Stack spacing={2}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Stack spacing={1} flex={1}>
                    <Typography variant="subtitle1">
                      {result.original_filename}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <DocumentStatusChip status={result.processing_status} />
                      <DocumentPriorityBadge priority={result.priority} />
                      <DocumentTypeChip 
                        type={result.document_type} 
                        subtype={result.document_subtype} 
                      />
                      <Chip
                        size="small"
                        label={`Score: ${result.relevance_score.toFixed(3)}`}
                        color="primary"
                        variant="outlined"
                      />
                      {result.match_type && (
                        <Chip
                          size="small"
                          label={result.match_type === 'fulltext' ? 'Full-text' : 'Semantic'}
                          color={result.match_type === 'fulltext' ? 'info' : 'secondary'}
                          variant="soft"
                        />
                      )}
                    </Stack>
                  </Stack>

                  <Stack alignItems="flex-end" spacing={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {fData(result.file_size)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {fDateTime(result.created_at)}
                    </Typography>
                  </Stack>
                </Stack>

                {result.highlight && (
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.neutral' }}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      ...{result.highlight}...
                    </Typography>
                  </Paper>
                )}

                {result.extracted_metadata && Object.keys(result.extracted_metadata).length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {Object.entries(result.extracted_metadata).slice(0, 3).map(([key, value]) => (
                      <Chip
                        key={key}
                        size="small"
                        label={`${key}: ${String(value).substring(0, 30)}`}
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    ))}
                  </Stack>
                )}
              </Stack>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Ricerca Archivio"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Archivio', href: paths.dashboard.archive.root },
          { name: 'Ricerca' },
        ]}
        action={
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            onClick={() => router.push(paths.dashboard.archive.root)}
          >
            Torna all'Archivio
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {renderSearch}
        {results !== null && renderResults}
      </Stack>
    </Container>
  );
}
