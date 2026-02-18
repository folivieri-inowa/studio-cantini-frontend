import ArchiveChatView from 'src/sections/archive/chat/archive-chat-view';

// ----------------------------------------------------------------------

export const metadata = {
  title: 'Dashboard: Assistente Documentale',
};

// ----------------------------------------------------------------------

export default function ArchiveChatPage() {
  // Il db viene gestito internamente dal componente tramite localStorage
  // o puoi passarlo come prop se hai un contesto globale
  const db = 'db1'; // Default, può essere reso dinamico

  return <ArchiveChatView db={db} />;
}
