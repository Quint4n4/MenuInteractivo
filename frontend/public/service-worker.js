// Service Worker para notificaciones push persistentes
const CACHE_NAME = 'clinic-camsa-v1';
const NOTIFICATION_TITLE = 'Nueva Orden Recibida';

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
  self.skipWaiting(); // Activar inmediatamente
});

// Activar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activado');
  event.waitUntil(self.clients.claim()); // Tomar control inmediatamente
});

// Escuchar mensajes del cliente
self.addEventListener('message', (event) => {
  console.log('Service Worker recibió mensaje:', event.data);
  
  if (event.data && event.data.type === 'NOTIFY') {
    const { orderId, title, body } = event.data;
    event.waitUntil(
      showNotification(title || NOTIFICATION_TITLE, body || `Orden #${orderId} ha sido recibida`, orderId)
    );
  }
});

// Mostrar notificación
function showNotification(title, body, orderId) {
  const options = {
    body: body,
    icon: '/vite.svg', // Puedes cambiar esto por un ícono personalizado
    badge: '/vite.svg',
    tag: `order-${orderId}`, // Evitar duplicados
    requireInteraction: true, // Requerir interacción para iOS
    vibrate: [200, 100, 200], // Vibrar en dispositivos móviles
    sound: '', // Algunos navegadores soportan sonido nativo
    data: {
      orderId: orderId,
      url: '/staff/orders'
    },
    // Acciones solo disponibles en algunos navegadores
    actions: [
      {
        action: 'view',
        title: 'Ver Orden'
      },
      {
        action: 'close',
        title: 'Cerrar'
      }
    ]
  };

  // Usar self.registration.showNotification correctamente
  return self.registration.showNotification(title, options);
}

// Manejar clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('Notificación clickeada:', event);
  
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Abrir o enfocar la ventana de órdenes
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Si hay una ventana abierta, enfocarla
          for (const client of clientList) {
            if (client.url.includes('/staff') && 'focus' in client) {
              return client.focus();
            }
          }
          // Si no hay ventana abierta, abrir una nueva
          if (clients.openWindow) {
            const orderId = event.notification.data?.orderId;
            const url = orderId ? `/staff/orders/${orderId}` : '/staff/orders';
            return clients.openWindow(url);
          }
        })
    );
  }
});

// Manejar cierre de notificación
self.addEventListener('notificationclose', (event) => {
  console.log('Notificación cerrada:', event);
});

// Escuchar eventos push (para futuras notificaciones push desde el servidor)
self.addEventListener('push', (event) => {
  console.log('Push event recibido:', event);
  
  if (event.data) {
    try {
      const data = event.data.json();
      const { orderId, title, body } = data;
      showNotification(title || NOTIFICATION_TITLE, body || `Orden #${orderId} ha sido recibida`, orderId);
    } catch (e) {
      console.error('Error parseando push data:', e);
      showNotification(NOTIFICATION_TITLE, 'Nueva orden recibida');
    }
  }
});
