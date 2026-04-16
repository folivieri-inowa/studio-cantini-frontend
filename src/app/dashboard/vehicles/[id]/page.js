import { VehicleDetailsView } from 'src/sections/vehicles/view';

export const metadata = {
  title: 'Dashboard: Dettaglio Veicolo',
};

export default function VehicleDetailsPage({ params }) {
  const { id } = params;
  return <VehicleDetailsView id={id} />;
}
