'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import Iconify from 'src/components/iconify';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import { useGetVehicleDetails, useGetVehiclePolicies, useGetVehicleTaxes, useGetVehicleZtl, useGetVehicleMaintenance } from 'src/api/vehicles';

import VehicleOverviewTab from '../vehicle-overview-tab';
import VehicleDocumentsTab from '../vehicle-documents-tab';
import VehicleScadenzeTab from '../vehicle-scadenze-tab';
import VehicleMaintenanceTab from '../vehicle-maintenance-tab';
import VehicleTiresTab from '../vehicle-tires-tab';
import VehicleIncidentsTab from '../vehicle-incidents-tab';
import VehicleInsuranceTab from '../vehicle-insurance-tab';
import VehicleAdminTab from '../vehicle-admin-tab';
import { exportVehiclePdf } from '../vehicle-pdf-export';
import VehicleSalePurchaseTab from '../vehicle-sale-purchase-tab';
import VehicleTimelineTab from '../vehicle-timeline-tab';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'overview', label: 'Panoramica', icon: 'solar:info-circle-bold' },
  { value: 'documents', label: 'Documenti', icon: 'solar:document-bold' },
  { value: 'scadenze', label: 'Scadenze', icon: 'solar:calendar-bold' },
  { value: 'maintenance', label: 'Manutenzioni', icon: 'solar:wrench-bold' },
  { value: 'tires', label: 'Pneumatici', icon: 'solar:wheel-bold' },
  { value: 'incidents', label: 'Sinistri', icon: 'solar:danger-bold' },
  { value: 'insurance', label: 'Assicurazione & Sinistri', icon: 'solar:shield-check-bold' },
  { value: 'admin', label: 'Amministrativo', icon: 'solar:document-text-bold' },
  { value: 'sale_purchase', label: 'Acquisto/Vendita', icon: 'solar:tag-price-bold' },
  { value: 'timeline', label: 'Timeline', icon: 'solar:clock-circle-bold' },
];

// ----------------------------------------------------------------------

export default function VehicleDetailsView() {
  const { id } = useParams();
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState('overview');

  const { vehicle, vehicleLoading, vehicleMutate } = useGetVehicleDetails(id);
  const { policies } = useGetVehiclePolicies(id);
  const { taxes } = useGetVehicleTaxes(id);
  const { ztlList } = useGetVehicleZtl(id);
  const { maintenance } = useGetVehicleMaintenance(id);

  if (vehicleLoading) {
    return (
      <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!vehicle) {
    return (
      <Container maxWidth="xl" sx={{ pt: 5 }}>
        <Typography>Veicolo non trovato.</Typography>
        <Button onClick={() => router.push(paths.dashboard.vehicles.root)} sx={{ mt: 2 }}>
          Torna alla lista
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <CustomBreadcrumbs
        heading={`${vehicle.plate}${vehicle.make ? ' — ' + vehicle.make : ''}${vehicle.model ? ' ' + vehicle.model : ''}`}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Gestione Auto', href: paths.dashboard.vehicles.root },
          { name: vehicle.plate },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:file-download-bold" />}
              onClick={() => exportVehiclePdf({ vehicle, policies, taxes, ztlList, maintenance })}
            >
              Esporta PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => {}}
            >
              Modifica
            </Button>
          </Stack>
        }
        sx={{ mb: 3 }}
      />

      <Tabs
        value={currentTab}
        onChange={(_, val) => setCurrentTab(val)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        variant="scrollable"
        scrollButtons="auto"
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={<Iconify icon={tab.icon} />}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {currentTab === 'overview' && <VehicleOverviewTab vehicle={vehicle} onMutate={vehicleMutate} />}
      {currentTab === 'documents' && <VehicleDocumentsTab vehicleId={id} />}
      {currentTab === 'scadenze' && <VehicleScadenzeTab vehicleId={id} />}
      {currentTab === 'maintenance' && <VehicleMaintenanceTab vehicleId={id} />}
      {currentTab === 'tires' && <VehicleTiresTab vehicleId={id} />}
      {currentTab === 'incidents' && <VehicleIncidentsTab vehicleId={id} />}
      {currentTab === 'insurance' && <VehicleInsuranceTab vehicleId={id} />}
      {currentTab === 'admin' && <VehicleAdminTab vehicle={vehicle} onVehicleUpdate={vehicleMutate} />}
      {currentTab === 'sale_purchase' && <VehicleSalePurchaseTab vehicle={vehicle} onMutate={vehicleMutate} />}
      {currentTab === 'timeline' && <VehicleTimelineTab vehicleId={id} />}
    </Container>
  );
}
