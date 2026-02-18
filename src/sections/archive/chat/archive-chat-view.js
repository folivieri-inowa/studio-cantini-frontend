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

import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { useResponsive } from 'src/hooks/use-responsive';

import {
  createChatSession,
  listChatSessions,
  getChatMessages,
  sendChatMessage,
  deleteChatSession,
} from 'src/api/archive';

// ----------------------------------------------------------------------

const DRAWER_WIDTH = 280;

export default function ArchiveChatView({ db }) {
  const { enqueueSnackbar } = useSnackbar();
  const isDesktop = useResponsive('up', 'md');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Stati
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sessionMenuAnchor, setSessionMenuAnchor] = useState(null);
  const [selectedSessionForMenu, setSelectedSessionForMenu] = useState(null);

  // Carica sessioni all'avvio
  useEffect(() => {
    if (db) {
      loadSessions();
    }
  }, [db]);

  // Scroll to bottom quando arrivano nuovi messaggi
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Carica sessioni
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const result = await listChatSessions(db);
      setSessions(result.sessions || []);
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
      setMessages(result.messages || []);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Errore caricamento messaggi:', error);
      enqueueSnackbar('Errore caricamento messaggi', { variant: 'error' });
    }
  }, [db, enqueueSnackbar]);

  // Crea nuova sessione
  const handleNewChat = async () => {
    try {
      const result = await createChatSession(db);
      const newSession = result.session;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      setMessages([]);
      setDrawerOpen(false);
      inputRef.current?.focus();
    } catch (error) {
      console.error('Errore creazione sessione:', error);
      enqueueSnackbar('Errore creazione chat', { variant: 'error' });
    }
  };

  // Seleziona sessione esistente
  const handleSelectSession = async (sessionId) => {
    await loadMessages(sessionId);
    setDrawerOpen(false);
  };

  // Invia messaggio
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsLoading(true);

    // Aggiungi messaggio utente immediatamente
    const userMessage = {
      role: 'user',
      content: messageText,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await sendChatMessage(currentSessionId, db, messageText);

      // Aggiungi risposta assistente
      const assistantMessage = {
        role: 'assistant',
        content: result.response,
        sources: result.sources,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Aggiorna preview sessione
      setSessions(prev => prev.map(s =>
        s.id === currentSessionId
          ? { ...s, last_message_preview: messageText }
          : s
      ));
    } catch (error) {
      console.error('Errore invio messaggio:', error);
      enqueueSnackbar('Errore durante l\'elaborazione', { variant: 'error' });

      // Aggiungi messaggio di errore
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Mi dispiace, si è verificato un errore. Riprova più tardi.',
        isError: true,
        created_at: new Date().toISOString(),
      }]);
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
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ieri';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('it-IT', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
    }
  };

  // Sidebar con lista sessioni
  const renderSidebar = () => (
    <Box sx={{ width: DRAWER_WIDTH, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header sidebar */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<Iconify icon="eva:plus-fill" />}
          onClick={handleNewChat}
        >
          Nuova Chat
        </Button>
      </Box>

      {/* Lista sessioni */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoadingSessions ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Caricamento...
            </Typography>
          </Box>
        ) : sessions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Nessuna conversazione
            </Typography>
            <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
              Clicca "Nuova Chat" per iniziare
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 0 }}>
            {sessions.map((session) => (
              <ListItem
                key={session.id}
                disablePadding
                secondaryAction={
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={(e) => handleSessionMenuOpen(e, session)}
                  >
                    <Iconify icon="eva:more-vertical-fill" />
                  </IconButton>
                }
              >
                <ListItemButton
                  selected={currentSessionId === session.id}
                  onClick={() => handleSelectSession(session.id)}
                  sx={{
                    py: 1.5,
                    '&.Mui-selected': {
                      bgcolor: 'action.selected',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main' }}>
                      <Iconify icon="eva:message-circle-fill" />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" noWrap sx={{ fontWeight: currentSessionId === session.id ? 600 : 400 }}>
                        {session.title}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {session.last_message_preview || 'Nessun messaggio'}
                      </Typography>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );

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
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Header chat */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {!isDesktop && (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <Iconify icon="eva:menu-fill" />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ flex: 1 }}>
            Assistente Documentale
          </Typography>

          {currentSessionId && (
            <Tooltip title="Nuova chat">
              <IconButton onClick={handleNewChat} color="primary">
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
            p: 2,
            bgcolor: 'background.neutral',
          }}
        >
          {!currentSessionId ? (
            // Stato vuoto - nessuna sessione selezionata
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              }}
            >
              <Box
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: '50%',
                  bgcolor: 'primary.lighter',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="eva:message-circle-fill" width={60} height={60} color="primary.main" />
              </Box>

              <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
                <Typography variant="h5" gutterBottom>
                  Come posso aiutarti?
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fai domande sui documenti nel tuo archivio. Posso cercare informazioni,
                  riassumere contenuti e aiutarti a trovare ciò che ti serve.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                startIcon={<Iconify icon="eva:plus-fill" />}
                onClick={handleNewChat}
              >
                Inizia una nuova conversazione
              </Button>

              {/* Suggerimenti */}
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, textAlign: 'center' }}>
                  Esempi di domande:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={1}>
                  {[
                    'Cerca il rapportino GREENX',
                    'Quali fatture abbiamo del 2026?',
                    'Riassumi l\'ultimo documento',
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        handleNewChat().then(() => {
                          setInputMessage(suggestion);
                        });
                      }}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </Stack>
              </Box>
            </Box>
          ) : messages.length === 0 ? (
            // Sessione nuova - suggerimenti
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
              }}
            >
              <Typography variant="h6" color="text.secondary">
                Inizia la conversazione
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" gap={1}>
                {[
                  'Cerca documenti di GREENX',
                  'Trova fatture recenti',
                  'Cosa c\'è nell\'archivio?',
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outlined"
                    onClick={() => setInputMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </Stack>
            </Box>
          ) : (
            // Lista messaggi
            <Stack spacing={2}>
              {messages.map((msg, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      maxWidth: '80%',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                      color: msg.role === 'user' ? 'primary.contrastText' : 'text.primary',
                      ...(msg.isError && {
                        bgcolor: 'error.lighter',
                        color: 'error.main',
                        border: 1,
                        borderColor: 'error.main',
                      }),
                    }}
                  >
                    <Stack spacing={1}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {msg.content}
                      </Typography>

                      {/* Fonti per messaggi assistente */}
                      {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                            Fonti:
                          </Typography>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                            {msg.sources.slice(0, 3).map((source, idx) => (
                              <Tooltip key={idx} title={source.filename}>
                                <Box
                                  component="span"
                                  sx={{
                                    px: 1,
                                    py: 0.25,
                                    bgcolor: 'action.hover',
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    color: 'text.secondary',
                                  }}
                                >
                                  {source.filename.length > 20
                                    ? source.filename.substring(0, 20) + '...'
                                    : source.filename}
                                </Box>
                              </Tooltip>
                            ))}
                          </Stack>
                        </Box>
                      )}

                      <Typography
                        variant="caption"
                        color={msg.role === 'user' ? 'primary.lighter' : 'text.disabled'}
                        sx={{ textAlign: 'right' }}
                      >
                        {formatRelativeDate(msg.created_at)}
                      </Typography>
                    </Stack>
                  </Paper>
                </Box>
              ))}

              {/* Indicatore caricamento */}
              {isLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        animation: 'pulse 1s infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 0.4 },
                          '50%': { opacity: 1 },
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Sto pensando...
                    </Typography>
                  </Paper>
                </Box>
              )}

              <div ref={messagesEndRef} />
            </Stack>
          )}
        </Box>

        {/* Input area */}
        <Paper
          elevation={2}
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder={currentSessionId ? "Scrivi un messaggio..." : "Clicca 'Nuova Chat' per iniziare"}
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
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !currentSessionId || isLoading}
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
                '&.Mui-disabled': {
                  bgcolor: 'action.disabledBackground',
                  color: 'action.disabled',
                },
              }}
            >
              <Iconify icon="eva:paper-plane-fill" />
            </IconButton>
          </Stack>
        </Paper>
      </Box>

      {/* Menu contestuale sessione */}
      <Menu
        anchorEl={sessionMenuAnchor}
        open={Boolean(sessionMenuAnchor)}
        onClose={handleSessionMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleDeleteSession} sx={{ color: 'error.main' }}>
          <Iconify icon="eva:trash-2-fill" width={20} height={20} style={{ marginRight: 8 }} />
          Elimina conversazione
        </MenuItem>
      </Menu>
    </Box>
  );
}
