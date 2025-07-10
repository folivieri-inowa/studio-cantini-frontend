'use client';

import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid2';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from '../../../../routes/paths';
import Iconify from '../../../../components/iconify';
import { useSettingsContext } from '../../../../components/settings';
import CustomBreadcrumbs from '../../../../components/custom-breadcrumbs';
import { useGetAnomalieStats, useGetAnomalieFiltri, useGetAnomalieAnalysis } from '../../../../api/anomalie';

// ----------------------------------------------------------------------

export default function AnomalieAnalyticsView() {
  const settings = useSettingsContext();
  
  // Stati per la configurazione di base
  const [threshold, setThreshold] = useState(50); // Soglia percentuale default 50%
  const [autoCalculate, setAutoCalculate] = useState(false); // Toggle calcolo automatico
  const [manualTrigger, setManualTrigger] = useState(false); // Per trigger manuale
  
  // Stati per i filtri avanzati
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtriAvanzati, setFiltriAvanzati] = useState({
    tipo_anomalia: 'tutte',
    categoria_id: '',
    soggetto_id: '',
    data_da: '',
    data_a: '',
    soglia_minima: 0,
    soglia_massima: 1000,
    importo_minimo: '',
    importo_massimo: '',
    score_minimo: 0,
    ordine: 'score_desc'
  });

  // Hook per ottenere i filtri disponibili
  const {
    filtri,
    filtriLoading,
    filtriError
  } = useGetAnomalieFiltri(
    settings.db && (autoCalculate || manualTrigger) ? settings.db : null,
    12
  );

  // Configurazione opzioni per le anomalie
  const anomalieOptions = {
    soglia: threshold,
    mesi: 12,
    limit: 100,
    offset: 0,
    ...filtriAvanzati
  };

  // Hook per ottenere le anomalie
  const {
    anomalie,
    anomalieLoading,
    anomalieError,
    anomalieEmpty,
    statistiche,
    refetch: refetchAnomalies
  } = useGetAnomalieAnalysis(
    settings.db && (autoCalculate || manualTrigger) ? settings.db : null,
    anomalieOptions
  );

  // Hook per ottenere le statistiche
  const {
    success: statsSuccess,
    refetch: refetchStats
  } = useGetAnomalieStats(
    settings.db && (autoCalculate || manualTrigger) ? settings.db : null,
    12
  );

  // Funzione per calcolare le anomalie manualmente
  const calculateAnomalies = useCallback(() => {
    if (!settings.db) {
      console.log('Database non selezionato');
      return;
    }

    setManualTrigger(true);
    refetchAnomalies();
    refetchStats();
  }, [settings.db, refetchAnomalies, refetchStats]);

  // Effetto per calcolo automatico
  useEffect(() => {
    if (autoCalculate && settings.db) {
      setManualTrigger(true);
      refetchAnomalies();
      refetchStats();
    }
  }, [autoCalculate, threshold, settings.db, refetchAnomalies, refetchStats]);

  // Handler per cambio soglia
  const handleThresholdChange = (event, newValue) => {
    setThreshold(newValue);
  };

  // Handler per toggle auto-calcolo
  const handleAutoCalculateChange = (event) => {
    setAutoCalculate(event.target.checked);
  };

  // Handler per toggle filtri avanzati
  const handleAdvancedFiltersToggle = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  // Handler per cambio filtri avanzati
  const handleFiltriAvanzatiChange = (field, value) => {
    setFiltriAvanzati(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handler per reset filtri
  const handleResetFiltri = () => {
    setFiltriAvanzati({
      tipo_anomalia: 'tutte',
      categoria_id: '',
      soggetto_id: '',
      data_da: '',
      data_a: '',
      soglia_minima: 0,
      soglia_massima: 1000,
      importo_minimo: '',
      importo_massimo: '',
      score_minimo: 0,
      ordine: 'score_desc'
    });
  };

  // Funzione per ottenere il colore del chip di criticità
  const getCriticitaColor = (score) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    if (score >= 20) return 'success';
    return 'default';
  };

  // Funzione per ottenere l'etichetta del livello di criticità
  const getCriticitaLabel = (score) => {
    if (score >= 80) return 'Critico';
    if (score >= 60) return 'Alto';
    if (score >= 40) return 'Medio';
    if (score >= 20) return 'Basso';
    return 'Molto Basso';
  };

  // Funzione per formattare la percentuale
  const formatPercentage = (value) => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${absValue.toFixed(1)}%`;
  };

  // Separa e raggruppa le anomalie logicamente
  const anomalieConDettaglio = anomalie?.filter(a => a.tipo_transazione === 'con_dettaglio') || [];
  const anomalieSenzaDettaglio = anomalie?.filter(a => a.tipo_transazione === 'senza_dettaglio') || [];

  // Raggruppa le anomalie con dettaglio per categoria > soggetto > dettaglio
  const anomalieConDettaglioRaggruppate = anomalieConDettaglio.reduce((groups, anomaly) => {
    const key = `${anomaly.categoria_nome}|${anomaly.soggetto_nome}|${anomaly.dettaglio}`;
    if (!groups[key]) {
      groups[key] = {
        categoria_nome: anomaly.categoria_nome,
        soggetto_nome: anomaly.soggetto_nome,
        dettaglio: anomaly.dettaglio,
        transazioni: []
      };
    }
    groups[key].transazioni.push(anomaly);
    return groups;
  }, {});

  // Raggruppa le anomalie senza dettaglio per categoria > soggetto
  const anomalieSenzaDettaglioRaggruppate = anomalieSenzaDettaglio.reduce((groups, anomaly) => {
    const key = `${anomaly.categoria_nome}|${anomaly.soggetto_nome}`;
    if (!groups[key]) {
      groups[key] = {
        categoria_nome: anomaly.categoria_nome,
        soggetto_nome: anomaly.soggetto_nome,
        transazioni: []
      };
    }
    groups[key].transazioni.push(anomaly);
    return groups;
  }, {});

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <CustomBreadcrumbs
        heading="Analisi Anomalie Spese"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Anomalie' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        {/* Card di configurazione */}
        <Card>
          <CardHeader 
            title="Configurazione Anomalie" 
            subheader="Imposta i parametri per il rilevamento delle anomalie nelle spese"
          />
          
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid size={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Soglia di scostamento: {threshold}%
                </Typography>
                <Slider
                  value={threshold}
                  onChange={handleThresholdChange}
                  min={5}
                  max={100}
                  step={5}
                  marks={[
                    { value: 10, label: '10%' },
                    { value: 20, label: '20%' },
                    { value: 50, label: '50%' },
                    { value: 100, label: '100%' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}%`}
                />
                <Typography variant="caption" color="text.secondary">
                  Identifica transazioni che si discostano più del {threshold}% dalla media storica del soggetto
                </Typography>
              </Grid>
              
              <Grid size={12} md={3}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoCalculate}
                      onChange={handleAutoCalculateChange}
                      color="primary"
                    />
                  }
                  label="Calcolo automatico"
                />
                <Typography variant="caption" color="text.secondary" display="block">
                  Ricalcola automaticamente al cambio soglia
                </Typography>
              </Grid>
              
              <Grid size={12} md={3}>
                <Button
                  variant="contained"
                  onClick={calculateAnomalies}
                  disabled={anomalieLoading || !settings.db}
                  startIcon={anomalieLoading ? <CircularProgress size={20} /> : <Iconify icon="solar:calculator-minimalistic-bold" />}
                  fullWidth
                >
                  {anomalieLoading ? 'Calcolando...' : 'Calcola Anomalie'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Filtri Avanzati */}
        <Card>
          <CardHeader 
            title="Filtri Avanzati" 
            subheader="Personalizza i criteri di ricerca delle anomalie"
            action={
              <Button 
                variant="outlined" 
                size="small"
                onClick={handleAdvancedFiltersToggle}
                startIcon={<Iconify icon={showAdvancedFilters ? 'solar:eye-closed-bold' : 'solar:eye-bold'} />}
              >
                {showAdvancedFilters ? 'Nascondi' : 'Mostra'}
              </Button>
            }
          />
          
          <Collapse in={showAdvancedFilters}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                
                {/* Tipo Anomalia */}
                <Grid size={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo Anomalia</InputLabel>
                    <Select
                      value={filtriAvanzati.tipo_anomalia}
                      onChange={(e) => handleFiltriAvanzatiChange('tipo_anomalia', e.target.value)}
                      label="Tipo Anomalia"
                    >
                      <MenuItem value="tutte">Tutte</MenuItem>
                      <MenuItem value="con_dettaglio">Con dettaglio</MenuItem>
                      <MenuItem value="senza_dettaglio">Senza dettaglio</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Categoria */}
                <Grid size={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={filtriAvanzati.categoria_id}
                      onChange={(e) => handleFiltriAvanzatiChange('categoria_id', e.target.value)}
                      label="Categoria"
                      disabled={filtriLoading}
                    >
                      <MenuItem value="">Tutte le categorie</MenuItem>
                      {filtri.categorie?.map((cat) => (
                        <MenuItem key={cat.id} value={cat.id}>
                          {cat.name} ({cat.transazioni_totali})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Soggetto */}
                <Grid size={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Soggetto</InputLabel>
                    <Select
                      value={filtriAvanzati.soggetto_id}
                      onChange={(e) => handleFiltriAvanzatiChange('soggetto_id', e.target.value)}
                      label="Soggetto"
                      disabled={filtriLoading}
                    >
                      <MenuItem value="">Tutti i soggetti</MenuItem>
                      {filtri.soggetti?.map((sog) => (
                        <MenuItem key={sog.id} value={sog.id}>
                          {sog.name} ({sog.transazioni_totali})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Date */}
                <Grid size={12} md={3}>
                  <TextField
                    fullWidth
                    label="Data da"
                    type="date"
                    value={filtriAvanzati.data_da}
                    onChange={(e) => handleFiltriAvanzatiChange('data_da', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid size={12} md={3}>
                  <TextField
                    fullWidth
                    label="Data a"
                    type="date"
                    value={filtriAvanzati.data_a}
                    onChange={(e) => handleFiltriAvanzatiChange('data_a', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Importi */}
                <Grid size={12} md={3}>
                  <TextField
                    fullWidth
                    label="Importo minimo (€)"
                    type="number"
                    value={filtriAvanzati.importo_minimo}
                    onChange={(e) => handleFiltriAvanzatiChange('importo_minimo', e.target.value)}
                    InputProps={{
                      startAdornment: '€',
                    }}
                  />
                </Grid>

                <Grid size={12} md={3}>
                  <TextField
                    fullWidth
                    label="Importo massimo (€)"
                    type="number"
                    value={filtriAvanzati.importo_massimo}
                    onChange={(e) => handleFiltriAvanzatiChange('importo_massimo', e.target.value)}
                    InputProps={{
                      startAdornment: '€',
                    }}
                  />
                </Grid>

                {/* Range Soglia */}
                <Grid size={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Range Scostamento: {filtriAvanzati.soglia_minima}% - {filtriAvanzati.soglia_massima}%
                  </Typography>
                  <Slider
                    value={[filtriAvanzati.soglia_minima, filtriAvanzati.soglia_massima]}
                    onChange={(e, newValue) => {
                      handleFiltriAvanzatiChange('soglia_minima', newValue[0]);
                      handleFiltriAvanzatiChange('soglia_massima', newValue[1]);
                    }}
                    valueLabelDisplay="auto"
                    min={0}
                    max={1000}
                    step={10}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 100, label: '100%' },
                      { value: 500, label: '500%' },
                      { value: 1000, label: '1000%' }
                    ]}
                  />
                </Grid>

                {/* Score Criticità */}
                <Grid size={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Score Criticità Minimo: {filtriAvanzati.score_minimo}
                  </Typography>
                  <Slider
                    value={filtriAvanzati.score_minimo}
                    onChange={(e, newValue) => handleFiltriAvanzatiChange('score_minimo', newValue)}
                    valueLabelDisplay="auto"
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 20, label: '20' },
                      { value: 40, label: '40' },
                      { value: 60, label: '60' },
                      { value: 80, label: '80' },
                      { value: 100, label: '100' }
                    ]}
                  />
                </Grid>

                {/* Ordinamento */}
                <Grid size={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Ordinamento</InputLabel>
                    <Select
                      value={filtriAvanzati.ordine}
                      onChange={(e) => handleFiltriAvanzatiChange('ordine', e.target.value)}
                      label="Ordinamento"
                    >
                      <MenuItem value="score_desc">Score di criticità (alto-basso)</MenuItem>
                      <MenuItem value="score_asc">Score di criticità (basso-alto)</MenuItem>
                      <MenuItem value="data_desc">Data (recente-vecchia)</MenuItem>
                      <MenuItem value="data_asc">Data (vecchia-recente)</MenuItem>
                      <MenuItem value="importo_desc">Importo (alto-basso)</MenuItem>
                      <MenuItem value="importo_asc">Importo (basso-alto)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Pulsanti */}
                <Grid size={12} md={6}>
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      onClick={handleResetFiltri}
                      startIcon={<Iconify icon="solar:refresh-bold" />}
                    >
                      Reset Filtri
                    </Button>
                    <Button
                      variant="contained"
                      onClick={calculateAnomalies}
                      disabled={anomalieLoading || !settings.db}
                      startIcon={<Iconify icon="solar:filter-bold" />}
                    >
                      Applica Filtri
                    </Button>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Card>

        {/* Statistiche */}
        {statsSuccess && statistiche && (
          <Card>
            <CardHeader title="Statistiche Anomalie" />
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid size={6} md={2}>
                  <Typography variant="h4" color="primary">
                    {statistiche.totale_anomalie}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Transazioni anomale
                  </Typography>
                </Grid>
                <Grid size={6} md={2}>
                  <Typography variant="h4" color="secondary">
                    {statistiche.soggetti_con_anomalie}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Soggetti coinvolti
                  </Typography>
                </Grid>
                <Grid size={6} md={2}>
                  <Typography variant="h4" color="info">
                    {statistiche.score_medio}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Score medio
                  </Typography>
                </Grid>
                <Grid size={6} md={2}>
                  <Typography variant="h4" color="warning">
                    {statistiche.scostamento_medio}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Scostamento medio
                  </Typography>
                </Grid>
                <Grid size={6} md={2}>
                  <Typography variant="h4" color="success">
                    {anomalieSenzaDettaglio.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generiche
                  </Typography>
                </Grid>
                <Grid size={6} md={2}>
                  <Typography variant="h4" color="error">
                    {anomalieConDettaglio.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Dettagliate
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Card>
        )}

        {/* Errore filtri */}
        {filtriError && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            Errore nel caricamento dei filtri: {filtriError?.message || 'Errore sconosciuto'}
          </Alert>
        )}

        {/* Errore */}
        {anomalieError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {anomalieError?.message || anomalieError?.error || 'Errore durante il caricamento delle anomalie'}
          </Alert>
        )}

        {/* Loading state */}
        {anomalieLoading && (
          <Card>
            <CardHeader title="Caricamento Anomalie..." />
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress />
              </Box>
            </Box>
          </Card>
        )}

        {/* Risultati */}
        {/* Tabella anomalie senza dettaglio - Raggruppate */}
        {Object.keys(anomalieSenzaDettaglioRaggruppate).length > 0 && (
          <Card>
            <CardHeader 
              title="Transazioni Anomale - Generiche" 
              subheader={`${anomalieSenzaDettaglio.length} transazioni in ${Object.keys(anomalieSenzaDettaglioRaggruppate).length} gruppi categoria-soggetto`}
            />
            
            <Box sx={{ p: 3 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoria / Soggetto</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Descrizione</TableCell>
                      <TableCell align="right">Importo</TableCell>
                      <TableCell align="right">Media Storica</TableCell>
                      <TableCell align="right">Scostamento</TableCell>
                      <TableCell align="center">Direzione</TableCell>
                      <TableCell align="center">Criticità</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.values(anomalieSenzaDettaglioRaggruppate).map((gruppo, groupIndex) => (
                      gruppo.transazioni.map((anomaly, index) => (
                        <TableRow key={`no-detail-${anomaly.transazione_id}-${index}`}>
                          <TableCell>
                            {index === 0 && (
                              <Box>
                                <Typography variant="subtitle2" color="primary">
                                  {gruppo.categoria_nome}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {gruppo.soggetto_nome}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(anomaly.data).toLocaleDateString('it-IT')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.primary">
                              {anomaly.descrizione || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              €{anomaly.importo_assoluto?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              €{anomaly.media_storica?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={anomaly.direzione === 'superiore' ? 'error' : 'warning'}
                              fontWeight="bold"
                            >
                              {formatPercentage(anomaly.percentuale_scostamento)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={anomaly.direzione === 'superiore' ? 'Superiore' : 'Inferiore'} 
                              size="small" 
                              color={anomaly.direzione === 'superiore' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack spacing={1} alignItems="center">
                              <Chip 
                                label={getCriticitaLabel(anomaly.score_criticita)}
                                size="small"
                                color={getCriticitaColor(anomaly.score_criticita)}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {anomaly.score_criticita || 0}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        )}

        {/* Tabella anomalie con dettaglio - Raggruppate */}
        {Object.keys(anomalieConDettaglioRaggruppate).length > 0 && (
          <Card>
            <CardHeader 
              title="Transazioni Anomale - Dettagliate" 
              subheader={`${anomalieConDettaglio.length} transazioni in ${Object.keys(anomalieConDettaglioRaggruppate).length} gruppi categoria-soggetto-dettaglio`}
            />
            
            <Box sx={{ p: 3 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Categoria / Soggetto / Dettaglio</TableCell>
                      <TableCell>Data</TableCell>
                      <TableCell>Descrizione</TableCell>
                      <TableCell align="right">Importo</TableCell>
                      <TableCell align="right">Media Storica</TableCell>
                      <TableCell align="right">Scostamento</TableCell>
                      <TableCell align="center">Direzione</TableCell>
                      <TableCell align="center">Criticità</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.values(anomalieConDettaglioRaggruppate).map((gruppo, groupIndex) => (
                      gruppo.transazioni.map((anomaly, index) => (
                        <TableRow key={`with-detail-${anomaly.transazione_id}-${index}`}>
                          <TableCell>
                            {index === 0 && (
                              <Box>
                                <Typography variant="subtitle2" color="primary">
                                  {gruppo.categoria_nome}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {gruppo.soggetto_nome}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" fontWeight="medium">
                                  📋 {gruppo.dettaglio}
                                </Typography>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(anomaly.data).toLocaleDateString('it-IT')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.primary">
                              {anomaly.descrizione || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold">
                              €{anomaly.importo_assoluto?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2">
                              €{anomaly.media_storica?.toFixed(2) || '0.00'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              color={anomaly.direzione === 'superiore' ? 'error' : 'warning'}
                              fontWeight="bold"
                            >
                              {formatPercentage(anomaly.percentuale_scostamento)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={anomaly.direzione === 'superiore' ? 'Superiore' : 'Inferiore'} 
                              size="small" 
                              color={anomaly.direzione === 'superiore' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack spacing={1} alignItems="center">
                              <Chip 
                                label={getCriticitaLabel(anomaly.score_criticita)}
                                size="small"
                                color={getCriticitaColor(anomaly.score_criticita)}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {anomaly.score_criticita || 0}
                              </Typography>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Card>
        )}

        {/* Messaggio se non ci sono anomalie */}
        {!anomalieLoading && anomalieEmpty && (
          <Card>
            <CardHeader 
              title="Transazioni Anomale" 
              subheader={`Nessuna transazione anomala trovata con soglia ${threshold}%`}
            />
            <Box sx={{ p: 3 }}>
              <Alert severity="info">
                {!manualTrigger && !autoCalculate ? (
                  'Clicca su "Calcola Anomalie" per iniziare l\'analisi.'
                ) : (
                  `Nessuna transazione anomala rilevata con la soglia attuale del ${threshold}%.
                  ${threshold > 20 ? " Prova ad abbassare la soglia per rilevare più anomalie." : ""}`
                )}
              </Alert>
            </Box>
          </Card>
        )}

        {/* Card informazioni */}
        <Card>
          <CardHeader title="Come funziona" />
          <Box sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              L&apos;analisi delle anomalie identifica le singole transazioni che si discostano significativamente 
              dalla media storica calcolata separatamente per ogni tipo di spesa:
              <br />
              • <strong>Transazioni con dettaglio</strong>: confrontate solo con altre transazioni dello stesso soggetto+dettaglio
              <br />
              • <strong>Transazioni generiche</strong>: confrontate solo con altre transazioni generiche dello stesso soggetto (escludendo quelle con dettaglio)
              <br />
              <br />
              La media viene calcolata SOLO sui mesi in cui ci sono state effettivamente delle spese di quel tipo, 
              rendendo il calcolo più preciso per spese ricorrenti non mensili.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              <strong>Visualizzazione raggruppata:</strong>
              <br />
              • Le transazioni sono raggruppate per categoria → soggetto → dettaglio (se presente)
              <br />
              • Ogni gruppo mostra tutte le transazioni anomale correlate
              <br />
              • La media storica è specifica per ogni singolo gruppo
              <br />
              <br />
              <strong>Score di Criticità:</strong>
              <br />
              • <strong>Critico (80-100)</strong>: Anomalie di massima priorità che richiedono attenzione immediata
              <br />
              • <strong>Alto (60-79)</strong>: Anomalie importanti da verificare
              <br />
              • <strong>Medio (40-59)</strong>: Anomalie moderate da monitorare
              <br />
              • <strong>Basso (20-39)</strong>: Anomalie lievi di interesse secondario
              <br />
              • <strong>Molto Basso (0-19)</strong>: Anomalie minime
              <br />
              <br />
              Lo score combina: scostamento percentuale (40%), importo assoluto (30%), 
              recency della transazione (20%), e variabilità storica (10%).
              <br />
              <br />
              <strong>Filtri Avanzati:</strong>
              <br />
              • Filtra per tipo di anomalia, categoria, soggetto, date, importi
              <br />
              • Imposta soglie personalizzate per scostamento e score di criticità
              <br />
              • Ordina i risultati per diversi criteri (score, data, importo)
              <br />
              <br />
              <strong>Legenda:</strong>
              <br />
              • <strong>Categoria/Soggetto/Dettaglio</strong>: Informazioni di raggruppamento (mostrate solo nella prima riga di ogni gruppo)
              <br />
              • <strong>Data</strong>: Data della transazione anomala
              <br />
              • <strong>Descrizione</strong>: Descrizione della singola transazione
              <br />
              • <strong>Importo</strong>: Importo della transazione anomala
              <br />
              • <strong>Media Storica</strong>: Media specifica per questo gruppo (solo mesi con spese)
              <br />
              • <strong>Scostamento</strong>: Percentuale di scostamento dalla media del gruppo
              <br />
              • <strong>Direzione</strong>: Se la transazione è superiore o inferiore alla media del gruppo
              <br />
              • <strong>Criticità</strong>: Score di priorità da 0 a 100 con classificazione per livello
            </Typography>
          </Box>
        </Card>
      </Stack>
    </Container>
  );
}
