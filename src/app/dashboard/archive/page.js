import { ArchiveFileManagerView } from 'src/sections/archive/view';
import ArchiveChat from 'src/sections/archive/archive-chat';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Dashboard: Archivio Digitale',
};

export default function ArchivePage() {
  return (
    <>
      <ArchiveFileManagerView />
      <ArchiveChat />
    </>
  );
}
