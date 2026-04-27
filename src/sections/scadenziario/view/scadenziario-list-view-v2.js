'use client';

import { useState, useCallback, useMemo } from 'react';

import Box from '@mui/material/Box';
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

// ----------------------------------------------------------------------

export function ScadenziarioListViewV2() {
  const settings = useSettingsContext();
  const ownerId = settings.owner?.id ?? settings.owner ?? null;

  const [openCreate, setOpenCreate]   = useState(false);
  const [openEdit, setOpenEdit]       = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [selectedId, setSelectedId]   = useState(null);

  const { scadenziario, scadenziarioLoading, scadenziarioMutate } =
    useEnhancedGetScadenziario(ownerId ? { ownerId } : {});

  const [filters, setFilters] = useState({ text: '', status: [], type: [], dateFrom: null, dateTo: null });

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
    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((s) => s.date && new Date(s.date) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((s) => s.date && new Date(s.date) <= to);
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

        {/* Tabella */}
        <ScadenziarioFiltersToolbar filters={filters} onFiltersChange={setFilters} />
        <ScadenziarioTableV2
          scadenze={filteredScadenziario}
          loading={scadenziarioLoading}
          onMutate={scadenziarioMutate}
          onViewRow={handleViewRow}
          onEditRow={handleEditRow}
        />
      </Container>

      {/* Modali */}
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
  );
}
