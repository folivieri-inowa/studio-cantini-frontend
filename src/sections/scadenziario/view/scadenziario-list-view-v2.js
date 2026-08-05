'use client';

import { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';
import { useSettingsContext } from 'src/components/settings';
import { useEnhancedGetScadenziario } from 'src/api/enhanced-services';

import ScadenziarioFiltersToolbar from '../scadenziario-filters-toolbar';
import ScadenziarioKpiCards from '../scadenziario-kpi-cards';
import ScadenziarioTableV2 from '../scadenziario-table-v2';
import ScadenziarioCreateModal from '../scadenziario-create-modal-v2';
import ScadenziarioEditModal from '../scadenziario-edit-modal';
import ScadenziarioDetailsModal from '../scadenziario-details-modal';
import ScadenziarioSuppliersView from '../scadenziario-suppliers-view';

// ----------------------------------------------------------------------

export function ScadenziarioListViewV2() {
  const settings = useSettingsContext();
  const ownerId = settings.owner?.id ?? settings.owner ?? null;

  const [openCreate, setOpenCreate]   = useState(false);
  const [openEdit, setOpenEdit]       = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedId, setSelectedId]   = useState(null);
  const [activeTab, setActiveTab]     = useState('scadenze');

  const { scadenziario, scadenziarioLoading, scadenziarioMutate } =
    useEnhancedGetScadenziario(ownerId ? { ownerId } : {});

  const FILTERS_KEY = 'scadenziario_v2_filters';

  const [filters, setFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(FILTERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { text: '', status: [], type: [], dateFrom: null, dateTo: null };
  });

  const handleFiltersChange = useCallback((next) => {
    setFilters(next);
    try { localStorage.setItem(FILTERS_KEY, JSON.stringify(next)); } catch {}
  }, []);

  const filteredScadenziario = useMemo(() => {
    let result = scadenziario;
    if (filters.text) {
      const q = filters.text.toLowerCase();
      result = result.filter(
        (s) =>
          s.subject?.toLowerCase().includes(q) ||
          s.companyName?.toLowerCase().includes(q) ||
          s.company_name?.toLowerCase().includes(q) ||
          s.invoiceNumber?.toLowerCase().includes(q)
      );
    }
    if (filters.status?.length) {
      result = result.filter((s) => filters.status.includes(s.status));
    }
    if (filters.type?.length) {
      result = result.filter((s) => filters.type.includes(s.type));
    }
    if (filters.dateFrom || filters.dateTo) {
      const from = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const to = filters.dateTo ? new Date(filters.dateTo) : null;
      if (from) from.setHours(0, 0, 0, 0);
      if (to) to.setHours(23, 59, 59, 999);
      const inRange = (d) => {
        if (!d) return false;
        const dt = new Date(d);
        return (!from || dt >= from) && (!to || dt <= to);
      };
      result = result.filter((s) => inRange(s.date) || inRange(s.payment_date) || inRange(s.paymentDate));
    }
    return result;
  }, [scadenziario, filters]);

  const handleCreated = useCallback(() => scadenziarioMutate(), [scadenziarioMutate]);

  const handleViewRow = useCallback((id) => {
    setSelectedId(id);
    setOpenDetails(true);
  }, []);

  const handleEditRow = useCallback((id) => {
    setSelectedId(id);
    setOpenEdit(true);
  }, []);

  return (
    <>
      <Container maxWidth={settings.themeStretch ? false : 'xl'}>
        {/* Header */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          mb={3}
          spacing={2}
        >
          <Box>
            <CustomBreadcrumbs
              links={[
                { name: 'Dashboard', href: paths.dashboard.root },
                { name: 'Scadenziario' },
              ]}
              sx={{ mb: 1 }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Iconify icon="eva:calendar-fill" sx={{ width: 28, height: 28, color: 'primary.main' }} />
              Scadenziario
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<Iconify icon="eva:plus-circle-fill" />}
            onClick={() => setOpenCreate(true)}
            sx={{ boxShadow: (theme) => theme.customShadows?.primary, fontWeight: 'bold', px: 2.5 }}
          >
            Nuova scadenza
          </Button>
        </Stack>

        {/* KPI */}
        <ScadenziarioKpiCards scadenze={scadenziario} />

        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab value="scadenze" label="Scadenze" icon={<Iconify icon="eva:calendar-fill" />} iconPosition="start" />
          <Tab value="fornitori" label="Fornitori" icon={<Iconify icon="solar:buildings-bold" />} iconPosition="start" />
        </Tabs>

        {/* Tabella */}
        {activeTab === 'fornitori' ? (
          <ScadenziarioSuppliersView scadenze={scadenziario} />
        ) : (
          <>
            <ScadenziarioFiltersToolbar filters={filters} onFiltersChange={handleFiltersChange} />
            <ScadenziarioTableV2
              scadenze={filteredScadenziario}
              loading={scadenziarioLoading}
              onMutate={scadenziarioMutate}
              onViewRow={handleViewRow}
              onEditRow={handleEditRow}
            />

            <ScadenziarioCreateModal
              open={openCreate}
              onClose={() => setOpenCreate(false)}
              onCreated={handleCreated}
            />

            {selectedId && (
              <ScadenziarioEditModal
                id={selectedId}
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                onEdited={scadenziarioMutate}
              />
            )}

            {selectedId && (
              <ScadenziarioDetailsModal
                id={selectedId}
                open={openDetails}
                onClose={() => setOpenDetails(false)}
              />
            )}
          </>
        )}
      </Container>
    </>
  );
}
