import ArchiveFinderView from 'src/sections/archive/view/archive-finder-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Dashboard: Archivio Digitale',
};

export default async function ArchivePage({ searchParams }) {
  // Next.js 15 requires awaiting searchParams
  const params = await searchParams;
  
  // TODO: Get db from user context or session
  const db = params?.db || 'studio_cantini';

  return <ArchiveFinderView db={db} />;
}
