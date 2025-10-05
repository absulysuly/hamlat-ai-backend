// PWA Service for Campaign Platform
// Handles offline functionality, installation, and caching

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.registration = null;
    this.db = null;
  }

  async initialize() {
    try {
      await this.initializeIndexedDB();
      await this.registerServiceWorker();
      this.setupInstallPrompt();
      this.setupOfflineHandlers();
      
      console.log('PWA service initialized');
    } catch (error) {
      console.error('Failed to initialize PWA service:', error);
    }
  }

  async initializeIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('HamlatAI_DB', 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Content store (for offline access)
        if (!db.objectStoreNames.contains('content')) {
          const contentStore = db.createObjectStore('content', { keyPath: 'id' });
          contentStore.createIndex('status', 'status', { unique: false });
          contentStore.createIndex('type', 'type', { unique: false });
        }
        
        // Sync requests store (for offline actions)
        if (!db.objectStoreNames.contains('syncRequests')) {
          db.createObjectStore('syncRequests', { keyPath: 'id' });
        }
        
        // Analytics cache
        if (!db.objectStoreNames.contains('analytics')) {
          db.createObjectStore('analytics', { keyPath: 'date' });
        }
      };
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        
        console.log('Service Worker registered');
        
        // Handle updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification();
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallBanner();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.deferredPrompt = null;
      this.hideInstallBanner();
    });
  }

  setupOfflineHandlers() {
    window.addEventListener('online', () => {
      console.log('Back online');
      this.syncPendingRequests();
      this.showConnectivityStatus('online');
    });

    window.addEventListener('offline', () => {
      console.log('Gone offline');
      this.showConnectivityStatus('offline');
    });
  }

  async promptInstall() {
    if (!this.deferredPrompt) return false;

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted installation');
        this.deferredPrompt = null;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Installation prompt failed:', error);
      return false;
    }
  }

  showInstallBanner() {
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed bottom-4 left-4 right-4 bg-primary text-white p-4 rounded-lg shadow-glow-primary z-50';
    banner.innerHTML = `
      <div class="flex items-center justify-between">
        <div>
          <h4 class="font-semibold">Install HamlatAI</h4>
          <p class="text-sm opacity-90">Get the full campaign management experience</p>
        </div>
        <div class="flex gap-2">
          <button id="pwa-install-btn" class="bg-white text-primary px-3 py-1 rounded text-sm font-medium">
            Install
          </button>
          <button id="pwa-dismiss-btn" class="text-white opacity-75 hover:opacity-100">
            ✕
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('pwa-install-btn')?.addEventListener('click', () => {
      this.promptInstall();
      this.hideInstallBanner();
    });

    document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallBanner();
    });
  }

  hideInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) banner.remove();
  }

  // Offline content caching
  async cacheContent(content) {
    if (!this.db) return;

    const transaction = this.db.transaction(['content'], 'readwrite');
    const store = transaction.objectStore('content');
    
    await store.put({
      ...content,
      cachedAt: Date.now()
    });
  }

  async getCachedContent() {
    if (!this.db) return [];

    const transaction = this.db.transaction(['content'], 'readonly');
    const store = transaction.objectStore('content');
    
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  // Background sync for offline actions
  async addSyncRequest(type, data) {
    if (!this.db) return;

    const syncRequest = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };

    const transaction = this.db.transaction(['syncRequests'], 'readwrite');
    const store = transaction.objectStore('syncRequests');
    await store.add(syncRequest);

    if (navigator.onLine && this.registration) {
      this.syncPendingRequests();
    }
  }

  async syncPendingRequests() {
    if (!this.db) return;

    const transaction = this.db.transaction(['syncRequests'], 'readwrite');
    const store = transaction.objectStore('syncRequests');
    
    const requests = await new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    for (const request of requests) {
      try {
        await this.processSyncRequest(request);
        await store.delete(request.id);
        console.log('Synced request:', request.id);
      } catch (error) {
        console.error('Failed to sync request:', request.id, error);
        
        request.retryCount++;
        if (request.retryCount < 3) {
          await store.put(request);
        } else {
          await store.delete(request.id);
        }
      }
    }
  }

  async processSyncRequest(request) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    switch (request.type) {
      case 'content_approval':
        await fetch(`${apiUrl}/content/${request.data.contentId}/approve`, {
          method: 'POST',
          headers,
          body: JSON.stringify(request.data)
        });
        break;
        
      case 'content_generation':
        await fetch(`${apiUrl}/content/generate`, {
          method: 'POST',
          headers,
          body: JSON.stringify(request.data)
        });
        break;
    }
  }

  showConnectivityStatus(status) {
    const statusBar = document.getElementById('connectivity-status') || this.createConnectivityStatusBar();
    
    statusBar.className = `fixed top-0 left-0 right-0 text-center py-2 text-sm font-medium z-50 transition-colors ${
      status === 'online' 
        ? 'bg-success text-white' 
        : 'bg-danger text-white'
    }`;
    
    statusBar.textContent = status === 'online' 
      ? '✓ Back online - syncing data...' 
      : '⚠ You\'re offline - changes will sync when connected';
    
    statusBar.style.display = 'block';
    
    if (status === 'online') {
      setTimeout(() => {
        statusBar.style.display = 'none';
      }, 3000);
    }
  }

  createConnectivityStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.id = 'connectivity-status';
    statusBar.style.display = 'none';
    document.body.appendChild(statusBar);
    return statusBar;
  }

  showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-secondary text-white p-4 rounded-lg shadow-glow-secondary z-50';
    notification.innerHTML = `
      <div class="flex items-center gap-3">
        <div>
          <h4 class="font-semibold">Update Available</h4>
          <p class="text-sm opacity-90">A new version is ready</p>
        </div>
        <button id="update-app-btn" class="bg-white text-secondary px-3 py-1 rounded text-sm font-medium">
          Update
        </button>
      </div>
    `;

    document.body.appendChild(notification);

    document.getElementById('update-app-btn')?.addEventListener('click', () => {
      window.location.reload();
    });

    setTimeout(() => notification.remove(), 10000);
  }

  getCapabilities() {
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled: window.matchMedia('(display-mode: standalone)').matches,
      isOfflineReady: 'serviceWorker' in navigator && !!this.registration,
      supportsNotifications: 'Notification' in window,
      supportsWebShare: 'share' in navigator
    };
  }

  async shareContent(data) {
    if ('share' in navigator) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Web Share failed:', error);
        return false;
      }
    } else {
      return this.copyToClipboard(data.url);
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Clipboard write failed:', error);
      return false;
    }
  }

  cleanup() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const pwaService = new PWAService();
