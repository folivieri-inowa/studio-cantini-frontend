'use client';

import Grid from '@mui/material/Unstable_Grid2';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  attivo: 'success',
  fermo: 'warning',
  in_manutenzione: 'info',
  venduto: 'default',
  radiato: 'error',
};

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <Stack direction="row" spacing={1} justifyContent="space-between" sx={{ py: 0.75 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 140 }}>{label}</Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>{value}</Typography>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function VehicleOverviewTab({ vehicle }) {
  return (
    <Grid container spacing={3}>
      {/* Dati principali */}
      <Grid xs={12} md={6}>
        <Card>
          <CardHeader title="Dati veicolo" />
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Typography variant="h5">{vehicle.plate}</Typography>
              <Chip
                size="small"
                label={vehicle.status}
                color={STATUS_COLORS[vehicle.status] || 'default'}
                variant="soft"
              />
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <InfoRow label="Marca" value={vehicle.make} />
            <InfoRow label="Modello" value={vehicle.model} />
            <InfoRow label="Telaio (VIN)" value={vehicle.vin} />
            <InfoRow label="Immatricolazione" value={vehicle.registration_date} />
            <InfoRow label="Alimentazione" value={vehicle.fuel_type} />
            <InfoRow label="Potenza" value={vehicle.kw ? `${vehicle.kw} kW` : null} />
            <InfoRow label="Cilindrata" value={vehicle.engine_cc ? `${vehicle.engine_cc} cc` : null} />
            <InfoRow label="Posti" value={vehicle.seats} />
            <InfoRow label="Uso" value={vehicle.vehicle_usage} />
          </CardContent>
        </Card>
      </Grid>

      {/* Titolarità e assegnazione */}
      <Grid xs={12} md={6}>
        <Card>
          <CardHeader title="Titolarità e assegnazione" />
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Intestatario</Typography>
            <InfoRow label="Tipo" value={vehicle.owner_type} />
            <InfoRow label="Nome" value={vehicle.owner_name} />
            <InfoRow label="Disponibilità" value={vehicle.availability_type} />
            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Assegnatario</Typography>
            <InfoRow label="Tipo" value={vehicle.assignee_type} />
            <InfoRow label="Nome" value={vehicle.assignee_name} />
            {vehicle.assignment_notes && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {vehicle.assignment_notes}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Note */}
      {vehicle.notes && (
        <Grid xs={12}>
          <Card>
            <CardHeader title="Note" />
            <CardContent>
              <Typography variant="body2">{vehicle.notes}</Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );
}
