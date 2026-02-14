import { ArchiveDetailsView } from 'src/sections/archive/view';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Dashboard: Dettaglio Documento',
};

export default function ArchiveDetailsPage({ params }) {
  return <ArchiveDetailsView id={params.id} />;
}
