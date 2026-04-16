'use client';

import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

import { useGetVehicleTimeline } from 'src/api/vehicles';

// ----------------------------------------------------------------------

const TYPE_COLORS = {
  vehicle_created: 'primary',
  document: 'info',
  maintenance: 'warning',
  tires: 'secondary',
  incident: 'error',
  assignment: 'success',
};

const TYPE_LABELS = {
  vehicle_created: 'Creato',
  document: 'Documento',
  maintenance: 'Manutenzione',
  tires: 'Pneumatici',
  incident: 'Sinistro',
  assignment: 'Assegnazione',
};

// ----------------------------------------------------------------------

export default function VehicleTimelineTab({ vehicleId }) {
  const { timeline, timelineLoading } = useGetVehicleTimeline(vehicleId);

  if (timelineLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!timeline.length) {
    return (
      <Card>
        <CardContent>
          <Typography color="text.disabled" align="center">Nessun evento nella timeline</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Timeline position="alternate">
          {timeline.map((event, idx) => (
            <TimelineItem key={idx}>
              <TimelineOppositeContent color="text.secondary" variant="caption">
                {event.date ? new Date(event.date).toLocaleDateString('it-IT') : '—'}
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot color={TYPE_COLORS[event.type] || 'grey'} variant="outlined" />
                {idx < timeline.length - 1 && <TimelineConnector />}
              </TimelineSeparator>

              <TimelineContent>
                <Typography variant="caption" color="text.secondary">
                  {TYPE_LABELS[event.type] || event.type}
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {event.title}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}
