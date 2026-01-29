// Service Worker Registration and PWA utilities

export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered:', registration);

          // Check for updates periodically
          setInterval(() => {
            registration.update();
          }, 60000); // Check every minute

          // Listen for new service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready
                console.log('New service worker available');
                notifyUserOfUpdate();
              }
            });
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
};

// Check if app is running in standalone mode (installed as PWA)
export const isStandaloneMode = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Notify user of PWA update
const notifyUserOfUpdate = () => {
  if (window.confirm('A new version of Finetune Studios is available! Would you like to update?')) {
    window.location.reload();
  }
};

// Request user to install PWA
export const requestInstall = () => {
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing
    e.preventDefault();
    // Stash the event for later use
    deferredPrompt = e;
    // Show the install button
    showInstallButton(deferredPrompt);
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    hideInstallButton();
  });
};

const showInstallButton = (deferredPrompt) => {
  const installBtn = document.getElementById('install-pwa-btn');
  if (installBtn) {
    installBtn.style.display = 'block';
    installBtn.addEventListener('click', async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response: ${outcome}`);
      installBtn.style.display = 'none';
    });
  }
};

const hideInstallButton = () => {
  const installBtn = document.getElementById('install-pwa-btn');
  if (installBtn) {
    installBtn.style.display = 'none';
  }
};

// Check if device is online
export const isOnline = () => navigator.onLine;

// Listen for online/offline events
export const setupOnlineOfflineListeners = (onStatusChange) => {
  window.addEventListener('online', () => {
    console.log('App is online');
    onStatusChange(true);
  });

  window.addEventListener('offline', () => {
    console.log('App is offline');
    onStatusChange(false);
  });
};
