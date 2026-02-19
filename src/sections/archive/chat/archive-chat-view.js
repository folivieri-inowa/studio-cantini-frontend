'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';

import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { useResponsive } from 'src/hooks/use-responsive';
import { useSettingsContext } from 'src/components/settings';

import {
  createChatSession,
  listChatSessions,
  getChatMessages,
  sendChatMessage,
  deleteChatSession,
} from 'src/api/archive';

// ----------------------------------------------------------------------

const DRAWER_WIDTH = 280;

const SUGGESTIONS = [
  { label: 'Cerca rapportino GREENX', icon: 'eva:search-fill' },
  { label: 'Fatture del 2026?', icon: 'eva:file-text-fill' },
  { label: 'Riassumi ultimo documento', icon: 'eva:edit-2-fill' },
];

// ----------------------------------------------------------------------

export default function ArchiveChatView() {
  const { db } = useSettingsContext();
  const { enqueueSnackbar } = useSnackbar();
  const isDesktop = useResponsive('up', 'md');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState(null);
  const [selectedSessionForMenu, setSelectedSessionForMenu] = useState(null);
  const [pendingMessage, setPendingMessage] = useState(null);

  // Carica sessioni all'avvio
  useEffect(() => {
    if (db) loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  // Scroll to bottom quando arrivano nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Imposta messaggio pendente (dai suggestion buttons) quando la sessione è pronta
  useEffect(() => {
    if (currentSessionId && pendingMessage) {
      setInputMessage(pendingMessage);
      setPendingMessage(null);
      // Foca l'input dopo un tick per garantire che sia abilitato
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentSessionId, pendingMessage]);

  // Carica sessioni
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const result = await listChatSessions(db);
      // BUG FIX: guard su result che potrebbe essere undefined
      setSessions(result?.sessions || []);
    } catch (error) {
      console.error('Errore caricamento sessioni:', error);
      enqueueSnackbar('Errore caricamento sessioni', { variant: 'error' });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [db, enqueueSnackbar]);

  // Carica messaggi di una sessione
  const loadMessages = useCallback(async (sessionId) => {
    try {
      const result = await getChatMessages(sessionId, db);
      // BUG FIX: guard su result che potrebbe essere undefined
      setMessages(result?.messages || []);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Errore caricamento messaggi:', error);
      enqueueSnackbar('Errore caricamento messaggi', { variant: 'error' });
    }
  }, [db, enqueueSnackbar]);

  // Crea nuova sessione
  const handleNewChat = useCallback(async () => {
    try {
      const result = await createChatSession(db);
      // BUG FIX: guard su result.session che potrebbe essere undefined
      const newSession = result?.session;
      if (!newSession) throw new Error('Sessione non creata');

      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setDrawerOpen(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (error) {
      console.error('Errore creazione sessione:', error);
      enqueueSnackbar('Errore creazione chat', { variant: 'error' });
    }
  }, [db, enqueueSnackbar]);

  // Seleziona sessione esistente
  const handleSelectSession = async (sessionId) => {
    await loadMessages(sessionId);
    setDrawerOpen(false);
  };

  // Invia messaggio
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !currentSessionId) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    const userMessage = {
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await sendChatMessage(currentSessionId, db, messageText);

      const assistantMessage = {
        role: 'assistant',
        content: result?.response ?? 'Nessuna risposta ricevuta.',
        // BUG FIX: normalizza sources — garantisce sempre array o null
        sources: Array.isArray(result?.sources) ? result.sources : null,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      setSessions(prev =>
        prev.map(s =>
          s.id === currentSessionId ? { ...s, last_message_preview: messageText } : s
        )
      );
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      enqueueSnackbar("Errore durante l'elaborazione", { variant: 'error' });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
          isError: true,
          sources: null,
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestione menu sessione
  const handleSessionMenuOpen = (event, session) => {
    event.stopPropagation();
    setSessionMenuAnchor(event.currentTarget);
    setSelectedSessionForMenu(session);
  };

  const handleSessionMenuClose = () => {
    setSessionMenuAnchor(null);
    setSelectedSessionForMenu(null);
  };

  // Elimina sessione
  const handleDeleteSession = async () => {
    if (!selectedSessionForMenu) return;
    try {
      await deleteChatSession(selectedSessionForMenu.id, db);
      setSessions(prev => prev.filter(s => s.id !== selectedSessionForMenu.id));
      if (currentSessionId === selectedSessionForMenu.id) {
        setCurrentSessionId(null);
        setMessages([]);
      }
      enqueueSnackbar('Sessione eliminata', { variant: 'success' });
    } catch (error) {
      console.error('Errore eliminazione sessione:', error);
      enqueueSnackbar('Errore eliminazione sessione', { variant: 'error' });
    } finally {
      handleSessionMenuClose();
    }
  };

  // Formatta data relativa
  const formatRelativeDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '';
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return date.toLocaleDateString('it-IT', { weekday: 'short' });
    return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  // Tronca filename in modo sicuro
  const truncateFilename = (filename, maxLen = 22) => {
    // BUG FIX: guard su filename undefined/null
    if (!filename) return 'Documento';
    if (filename.length <= maxLen) return filename;
    return `${filename.substring(0, maxLen)}…`;
  };

  // ----------------------------------------------------------------------
  // Sidebar

  const renderSidebar = () => (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, pb: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={handleNewChat}
          size="medium"
        >
          Nuova Chat
        </Button>
      </Box>

      {/* Lista sessioni */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoadingSessions ? (
          <Stack spacing={0}>
            {[...Array(4)].map((_, i) => (
              <Box key={i} sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Stack spacing={0.5} flex={1}>
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="50%" height={12} />
                </Stack>
              </Box>
            ))}
          </Stack>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', mt: 2 }}>
            <Iconify
              icon="eva:message-circle-outline"
              width={40}
              sx={{ color: 'text.disabled', mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Nessuna conversazione
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
              Clicca &ldquo;Nuova Chat&rdquo; per iniziare
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {sessions.map((session) => {
              const isActive = currentSessionId === session.id;
              return (
                <ListItem
                  key={session.id}
                  disablePadding
                  secondaryAction={
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleSessionMenuOpen(e, session)}
                      sx={{ opacity: 0, '.MuiListItem-root:hover &': { opacity: 1 }, transition: 'opacity 0.15s' }}
                    >
                      <Iconify icon="eva:more-vertical-fill" width={16} />
                    </IconButton>
                  }
                  sx={{ '&:hover .MuiIconButton-root': { opacity: 1 } }}
                >
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleSelectSession(session.id)}
                    sx={{
                      py: 1.5,
                      borderRadius: 1,
                      mx: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        '&:hover': { bgcolor: 'primary.lighter' },
                      },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: isActive ? 'primary.main' : 'action.hover',
                          color: isActive ? 'primary.contrastText' : 'text.secondary',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Iconify icon="eva:message-circle-fill" width={18} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle2"
                          noWrap
                          sx={{ fontWeight: isActive ? 600 : 400, fontSize: '0.8125rem' }}
                        >
                          {session.title || 'Nuova conversazione'}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.disabled" noWrap>
                          {session.last_message_preview || 'Nessun messaggio'}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );

  // ----------------------------------------------------------------------
  // Empty state

  const renderEmptyState = () => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2.5,
        p: 3,
      }}
    >
      {/* Icona */}
      <Box
        sx={{
          width: 88,
          height: 88,
          borderRadius: '50%',
          bgcolor: 'primary.lighter',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Iconify icon="eva:message-circle-fill" width={44} sx={{ color: 'primary.main' }} />
      </Box>

      {/* Testo */}
      <Box sx={{ textAlign: 'center', maxWidth: 380 }}>
        <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
          Come posso aiutarti?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
          Fai domande sui documenti nel tuo archivio. Posso cercare informazioni,
          riassumere contenuti e aiutarti a trovare ciò che ti serve.
        </Typography>
      </Box>

      {/* CTA principale */}
      <Button
        variant="contained"
        size="large"
        startIcon={<Iconify icon="eva:plus-fill" />}
        onClick={handleNewChat}
        sx={{ borderRadius: 3, px: 4 }}
      >
        Inizia una conversazione
      </Button>

      {/* Suggestions */}
      <Box sx={{ textAlign: 'center' }}>
        <Typography
          variant="caption"
          color="text.disabled"
          display="block"
          sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.7rem' }}
        >
          Oppure prova con:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={1}>
          {SUGGESTIONS.map((s) => (
            <Chip
              key={s.label}
              label={s.label}
              icon={<Iconify icon={s.icon} width={14} />}
              variant="outlined"
              size="small"
              clickable
              onClick={() => {
                setPendingMessage(s.label);
                handleNewChat();
              }}
              sx={{
                borderRadius: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
                fontSize: '0.8rem',
              }}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );

  // ----------------------------------------------------------------------
  // Typing indicator

  const renderTypingIndicator = () => (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: 1 }}>
      <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.lighter' }}>
        <Iconify icon="eva:message-circle-fill" width={14} sx={{ color: 'primary.main' }} />
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          px: 2,
          py: 1.5,
          borderRadius: '18px 18px 18px 4px',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {[0, 1, 2].map((i) => (
          <Box
            key={i}
            sx={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              opacity: 0.6,
              animation: 'bounce 1.2s infinite',
              animationDelay: `${i * 0.2}s`,
              '@keyframes bounce': {
                '0%, 80%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                '40%': { transform: 'translateY(-6px)', opacity: 1 },
              },
            }}
          />
        ))}
      </Paper>
    </Box>
  );

  // ----------------------------------------------------------------------
  // Render messaggio singolo

  const renderMessage = (msg, index) => {
    const isUser = msg.role === 'user';
    // BUG FIX: fonti normalizzate come array garantito (fatto in handleSendMessage)
    const sources = Array.isArray(msg.sources) ? msg.sources : [];

    return (
      <Box
        key={index}
        sx={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          alignItems: 'flex-end',
          gap: 1,
        }}
      >
        {/* Avatar assistente */}
        {!isUser && (
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'primary.lighter',
              flexShrink: 0,
            }}
          >
            <Iconify icon="eva:message-circle-fill" width={14} sx={{ color: 'primary.main' }} />
          </Avatar>
        )}

        {/* Bubble */}
        <Paper
          elevation={0}
          sx={{
            maxWidth: '75%',
            px: 2,
            py: 1.5,
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            bgcolor: isUser ? 'primary.main' : 'background.paper',
            color: isUser ? 'primary.contrastText' : 'text.primary',
            border: isUser ? 'none' : '1px solid',
            borderColor: 'divider',
            ...(msg.isError && {
              bgcolor: 'error.lighter',
              color: 'error.dark',
              border: '1px solid',
              borderColor: 'error.light',
            }),
          }}
        >
          <Stack spacing={0.75}>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.65,
                fontSize: '0.875rem',
              }}
            >
              {msg.content}
            </Typography>

            {/* Fonti — BUG FIX: usa Array.isArray e optional chaining su filename */}
            {!isUser && sources.length > 0 && (
              <Box sx={{ mt: 0.5 }}>
                <Divider sx={{ my: 0.75, opacity: 0.4 }} />
                <Typography
                  variant="caption"
                  color={isUser ? 'primary.lighter' : 'text.disabled'}
                  sx={{ display: 'block', mb: 0.75, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.4 }}
                >
                  Fonti
                </Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                  {sources.slice(0, 3).map((source, idx) => (
                    <Tooltip key={idx} title={source?.filename || 'Documento'}>
                      <Chip
                        label={truncateFilename(source?.filename)}
                        size="small"
                        variant="soft"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          cursor: 'default',
                          bgcolor: 'action.hover',
                          color: 'text.secondary',
                        }}
                      />
                    </Tooltip>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Timestamp */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'right',
                fontSize: '0.68rem',
                color: isUser ? 'rgba(255,255,255,0.6)' : 'text.disabled',
                mt: 0.25,
              }}
            >
              {formatRelativeDate(msg.created_at)}
            </Typography>
          </Stack>
        </Paper>

        {/* Avatar utente */}
        {isUser && (
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'primary.dark',
              flexShrink: 0,
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            Tu
          </Avatar>
        )}
      </Box>
    );
  };

  // ----------------------------------------------------------------------

  return (
    <Box sx={{ height: '100%', display: 'flex' }}>
      {/* Sidebar desktop */}
      {isDesktop && (
        <Paper
          elevation={0}
          sx={{
            width: DRAWER_WIDTH,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {renderSidebar()}
        </Paper>
      )}

      {/* Sidebar mobile (drawer) */}
      {!isDesktop && (
        <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{ sx: { width: DRAWER_WIDTH } }}
        >
          {renderSidebar()}
        </Drawer>
      )}

      {/* Area chat principale */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexShrink: 0,
          }}
        >
          {!isDesktop && (
            <IconButton size="small" onClick={() => setDrawerOpen(true)}>
              <Iconify icon="eva:menu-fill" />
            </IconButton>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.lighter' }}>
              <Iconify icon="eva:message-circle-fill" width={16} sx={{ color: 'primary.main' }} />
            </Avatar>
            <Box>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.2, fontWeight: 600 }}>
                Assistente Documentale
              </Typography>
              {currentSessionId && (
                <Typography variant="caption" color="text.disabled">
                  {isLoading ? 'Sta scrivendo...' : 'Online'}
                </Typography>
              )}
            </Box>
          </Box>

          {currentSessionId && (
            <Tooltip title="Nuova chat">
              <IconButton size="small" onClick={handleNewChat} color="primary">
                <Iconify icon="eva:plus-fill" />
              </IconButton>
            </Tooltip>
          )}
        </Paper>

        {/* Area messaggi */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: { xs: 1.5, sm: 2.5 },
            bgcolor: 'background.neutral',
          }}
        >
          {!currentSessionId ? (
            renderEmptyState()
          ) : (
            <Stack spacing={1.5}>
              {messages.map((msg, index) => renderMessage(msg, index))}

              {isLoading && renderTypingIndicator()}

              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Input area */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.5, sm: 2 },
            borderTop: 1,
            borderColor: 'divider',
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={
                !currentSessionId
                  ? "Seleziona o crea una chat per iniziare…"
                  : isLoading
                  ? "Attendi la risposta…"
                  : "Scrivi un messaggio… (Invio per inviare)"
              }
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              disabled={!currentSessionId || isLoading}
              inputRef={inputRef}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  fontSize: '0.875rem',
                },
              }}
            />

            <IconButton
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !currentSessionId || isLoading}
              sx={{
                width: 44,
                height: 44,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 2.5,
                flexShrink: 0,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'primary.dark',
                  transform: 'scale(1.05)',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
              }}
            >
              {isLoading ? (
                <CircularProgress size={18} sx={{ color: 'inherit' }} />
              ) : (
                <Iconify icon="eva:paper-plane-fill" width={18} />
              )}
            </IconButton>
          </Stack>

          {/* Hint shift+enter */}
          {currentSessionId && !isLoading && (
            <Typography
              variant="caption"
              color="text.disabled"
              sx={{ display: 'block', mt: 0.75, textAlign: 'right', fontSize: '0.7rem' }}
            >
              Shift + Invio per andare a capo
            </Typography>
          )}
        </Paper>
      </Box>

      {/* Menu contestuale sessione */}
      <Menu
        anchorEl={sessionMenuAnchor}
        open={Boolean(sessionMenuAnchor)}
        onClose={handleSessionMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { minWidth: 160 } }}
      >
        <MenuItem onClick={handleDeleteSession} sx={{ color: 'error.main', gap: 1 }}>
          <Iconify icon="eva:trash-2-fill" width={18} />
          Elimina conversazione
        </MenuItem>
      </Menu>
    </Box>
  );
}
