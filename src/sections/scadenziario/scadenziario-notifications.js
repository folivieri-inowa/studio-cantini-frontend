// filepath: /Users/francescoolivieri/Desktop/Sviluppo inowa/studio_cantini/studio-cantini/src/sections/scadenziario/scadenziario-notifications.js
import PropTypes from 'prop-types';
import { it } from 'date-fns/locale';
import { formatDistance } from 'date-fns';
import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ListItemButton from '@mui/material/ListItemButton';

import Iconify from '../../components/iconify';
import CustomPopover, { usePopover } from '../../components/custom-popover';

// ----------------------------------------------------------------------

export default function ScadenziarioNotifications({ scadenze, onClick }) {
  const popover = usePopover();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    // Filtra le scadenze che richiedono notifica (scadute o in scadenza)
    const today = new Date();
    
    const filteredScadenze = scadenze
      .filter(item => {
        // Solo scaduti o in scadenza entro 15 giorni e non pagati
        const dueDate = new Date(item.date);
        const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        return item.status !== 'completed' && diffDays <= 15;
      })
      .map(item => ({
        ...item,
        read: false
      }));
    
    setNotifications(filteredScadenze);
    setUnread(filteredScadenze.length);
  }, [scadenze]);

  const handleMarkAsRead = (notificationId) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === notificationId ? { ...notification, read: true } : notification
    );
    
    setNotifications(updatedNotifications);
    setUnread(updatedNotifications.filter(item => !item.read).length);
    
    if (onClick) {
      const selectedNotification = notifications.find(item => item.id === notificationId);
      onClick(selectedNotification);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    setUnread(0);
  };

  return (
    <>
      <IconButton
        color={popover.open ? 'primary' : 'default'}
        onClick={popover.onOpen}
      >
        <Badge badgeContent={unread} color="error">
          <Iconify icon="solar:bell-bing-bold-duotone" width={24} />
        </Badge>
      </IconButton>

      <CustomPopover
        open={popover.open}
        onClose={popover.onClose}
        arrow="right-top"
        sx={{ width: 360 }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2.5 }}>
          <Typography variant="h6">Notifiche</Typography>

          {unread > 0 && (
            <Typography variant="subtitle2" sx={{ color: 'primary.main' }}>
              {unread} non lette
            </Typography>
          )}
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Stack sx={{ height: { xs: 340, sm: 420 }, overflowY: 'auto' }}>
          {notifications.length === 0 ? (
            <Typography variant="caption" sx={{ p: 2, display: 'block', textAlign: 'center' }}>
              Nessuna scadenza da notificare
            </Typography>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onRead={() => handleMarkAsRead(notification.id)}
              />
            ))
          )}
        </Stack>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <ListItemButton
            disabled={unread === 0}
            onClick={handleMarkAllAsRead}
            sx={{ borderRadius: 1 }}
          >
            Segna tutte come lette
          </ListItemButton>
        </Box>
      </CustomPopover>
    </>
  );
}

ScadenziarioNotifications.propTypes = {
  scadenze: PropTypes.array,
  onClick: PropTypes.func,
};

// ----------------------------------------------------------------------

function NotificationItem({ notification, onRead }) {
  const { subject, description, amount, read, date } = notification;
  
  // Funzione di utilità per generare il messaggio di notifica
  const getItemNotificationMessage = (item) => {
    if (!item.date) {
      return 'Data non disponibile';
    }
    
    try {
      const dueDate = new Date(item.date);
      const today = new Date();
      
      if (Number.isNaN(dueDate.getTime())) {
        return 'Data non valida';
      }
      
      if (dueDate < today) {
        return `Scaduto da ${formatDistance(dueDate, today, { addSuffix: false, locale: it })}`;
      }
      
      return `In scadenza tra ${formatDistance(today, dueDate, { addSuffix: false, locale: it })}`;
    } catch (error) {
      console.error('Errore nella formattazione della data:', error);
      return 'Errore data';
    }
  };

  // Determina il colore e l'icona in base alla urgenza
  const getNotificationStyle = (notification) => {
    if (!notification.date) return { color: 'info.main', icon: 'eva:info-fill' };
    
    try {
      const dueDate = new Date(notification.date);
      const today = new Date();
      const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { color: 'error.main', icon: 'eva:alert-triangle-fill' };  // Scaduto
      } if (diffDays <= 3) {
        return { color: 'error.main', icon: 'eva:alert-circle-fill' };    // Molto urgente (3 giorni)
      } if (diffDays <= 7) {
        return { color: 'warning.main', icon: 'eva:clock-fill' };        // Urgente (7 giorni)
      } 
        return { color: 'info.main', icon: 'eva:calendar-fill' };        // Prossima scadenza
      
    } catch (error) {
      return { color: 'info.main', icon: 'eva:info-fill' };
    }
  };
  
  const notificationStyle = getNotificationStyle(notification);
  
  return (
    <ListItemButton
      onClick={onRead}
      sx={{
        p: 2,
        borderRadius: 1,
        flexDirection: 'column',
        alignItems: 'flex-start',
        bgcolor: read ? 'transparent' : (theme) => alpha(theme.palette[notificationStyle.color.split('.')[0]].light, 0.12),
        transition: 'all 0.2s',
        border: '1px solid transparent',
        '&:hover': {
          bgcolor: (theme) => alpha(theme.palette[notificationStyle.color.split('.')[0]].light, 0.16),
          border: (theme) => `1px solid ${alpha(theme.palette[notificationStyle.color.split('.')[0]].main, 0.24)}`,
        },
        mb: 1,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ width: '100%', mb: 1 }} alignItems="center">
        <Iconify 
          icon={notificationStyle.icon} 
          sx={{ 
            color: notificationStyle.color,
            width: 24, 
            height: 24,
          }} 
        />
      
        <Box sx={{ flexGrow: 1 }}>
          <Typography 
            variant="subtitle2" 
            noWrap 
            sx={{ 
              color: read ? 'text.secondary' : notificationStyle.color,
              fontWeight: 600,
            }}
          >
            {subject}
          </Typography>
        </Box>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: 'text.disabled',
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.12),
            px: 1,
            py: 0.25,
            borderRadius: 0.5,
          }}
        >
          {date ? formatDistance(new Date(date), new Date(), { addSuffix: true, locale: it }) : ''}
        </Typography>
      </Stack>
      
      <Box sx={{ pl: '32px', width: '100%' }}>
        <Typography 
          variant="body2" 
          sx={{ 
            color: read ? 'text.secondary' : 'text.primary',
            mb: 0.5,
          }}
        >
          {description}
        </Typography>
        
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography 
            variant="caption" 
            sx={{ 
              color: read ? 'text.disabled' : notificationStyle.color,
              fontWeight: 600,
            }}
          >
            {date ? getItemNotificationMessage(notification) : ''}
          </Typography>
          
          <Typography 
            variant="subtitle2" 
            sx={{ 
              color: notificationStyle.color, 
              fontWeight: 'bold' 
            }}
          >
            {typeof amount === 'number' ? amount.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : '€ 0,00'}
          </Typography>
        </Stack>
      </Box>
    </ListItemButton>
  );
}

NotificationItem.propTypes = {
  notification: PropTypes.object,
  onRead: PropTypes.func,
};
