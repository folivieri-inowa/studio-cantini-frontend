'use client';

import { useState, useRef, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import Fab from '@mui/material/Fab';
import Fade from '@mui/material/Fade';

import { useSnackbar } from 'src/components/snackbar';
import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import axios from 'src/utils/axios';

// ----------------------------------------------------------------------

export default function ArchiveChat() {
  const { enqueueSnackbar } = useSnackbar();
  const settings = useSettingsContext();
  const { db } = settings;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Ciao! Sono il tuo assistente per l\'archivio documentale. Puoi chiedermi informazioni sui documenti caricati, come ad esempio "Quanto è costato il gestionale?" o "Trova il preventivo del software".',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Cerca documenti rilevanti
      const searchResponse = await axios.post('/api/archive/search', {
        db,
        query: userMessage.content,
        limit: 5,
      });

      const relevantDocs = searchResponse.data.results || [];

      if (relevantDocs.length === 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Non ho trovato documenti pertinenti alla tua domanda. Prova a riformulare o carica documenti correlati.',
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // 2. Prepara il contesto per l'LLM
      const context = relevantDocs
        .map((doc, idx) => {
          const text = doc.extracted_text || doc.highlight || '';
          return `[Documento ${idx + 1}: ${doc.original_filename}]\n${text.substring(0, 2000)}`;
        })
        .join('\n\n---\n\n');

      // 3. Chiama Ollama per la risposta
      const prompt = `Sei un assistente esperto di analisi documentale. Rispondi alla domanda dell'utente basandoti SOLO sui documenti forniti.

DOCUMENTI RILEVANTI:
${context}

DOMANDA DELL'UTENTE:
${userMessage.content}

ISTRUZIONI:
- Rispondi in italiano
- Cita i nomi dei documenti da cui prendi le informazioni
- Se non trovi la risposta nei documenti, dillo chiaramente
- Sii conciso ma completo

RISPOSTA:`;

      const llmResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_HOST_BACKEND || 'http://localhost:9002'}/v1/archive/ask`,
        {
          prompt,
          model: 'mistral-nemo',
        }
      );

      const answer = llmResponse.data.response || 'Non sono riuscito a generare una risposta.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: answer,
          sources: relevantDocs.map((d) => ({
            id: d.id,
            filename: d.original_filename,
          })),
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
      enqueueSnackbar('Errore durante la ricerca', { variant: 'error' });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Mi dispiace, si è verificato un errore durante la ricerca. Riprova più tardi.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Ciao! Sono il tuo assistente per l\'archivio documentale. Puoi chiedermi informazioni sui documenti caricati.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <>
      {/* Floating Button */}
      <Fade in={!isOpen}>
        <Fab
          color="primary"
          aria-label="chat"
          onClick={() => setIsOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
          }}
        >
          <Iconify icon="eva:message-circle-fill" width={28} />
        </Fab>
      </Fade>

      {/* Chat Window */}
      <Collapse in={isOpen} orientation="horizontal">
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: 'calc(100vw - 48px)', sm: 450 },
            height: { xs: 'calc(100vh - 48px)', sm: 600 },
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="eva:message-circle-fill" />
              <Typography variant="subtitle1" fontWeight={600}>
                Assistente Documentale
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5}>
              <IconButton size="small" color="inherit" onClick={handleClear} title="Cancella conversazione">
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
              <IconButton size="small" color="inherit" onClick={() => setIsOpen(false)}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </Stack>
          </Stack>

          {/* Messages */}
          <Box
            sx={{
              flex: 1,
              overflow: 'auto',
              p: 2,
              bgcolor: 'background.default',
            }}
          >
            <Stack spacing={2}>
              {messages.map((msg, idx) => (
                <Box
                  key={idx}
                  sx={{
                    alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: msg.role === 'user' ? 'primary.lighter' : 'background.paper',
                      borderRadius: 2,
                      borderBottomRightRadius: msg.role === 'user' ? 0 : 2,
                      borderBottomLeftRadius: msg.role === 'assistant' ? 0 : 2,
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>

                    {msg.sources && msg.sources.length > 0 && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                          <Typography variant="caption" color="text.secondary">
                            Fonti:
                          </Typography>
                          {msg.sources.map((src, sidx) => (
                            <Chip
                              key={sidx}
                              label={src.filename}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 10, height: 20 }}
                            />
                          ))}
                        </Stack>
                      </>
                    )}
                  </Paper>
                  <Typography
                    variant="caption"
                    color="text.disabled"
                    sx={{ mt: 0.5, display: 'block', textAlign: msg.role === 'user' ? 'right' : 'left' }}
                  >
                    {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              ))}
              {isLoading && (
                <Box sx={{ alignSelf: 'flex-start' }}>
                  <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      component="span"
                      sx={{
                        width: 8,
                        height: 8,
                        bgcolor: 'primary.main',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite',
                        '@keyframes pulse': {
                          '0%, 100%': { opacity: 1 },
                          '50%': { opacity: 0.3 },
                        },
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      Sto cercando nei documenti...
                    </Typography>
                  </Paper>
                </Box>
              )}
              <div ref={messagesEndRef} />
            </Stack>
          </Box>

          {/* Input */}
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
            <Stack direction="row" spacing={1}>
              <TextField
                fullWidth
                size="small"
                placeholder="Chiedi qualcosa sui documenti..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                multiline
                maxRows={3}
              />
              <IconButton
                color="primary"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                sx={{ alignSelf: 'flex-end' }}
              >
                <Iconify icon="eva:paper-plane-fill" />
              </IconButton>
            </Stack>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
}
