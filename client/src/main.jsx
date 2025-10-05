import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import ErrorBoundary from './components/ui/ErrorBoundary';
import OfflineIndicator from './components/ui/OfflineIndicator';
import { pwaService } from './services/pwaService';
import { notificationService } from './services/notificationService';
import './index.css';

// Initialize services
pwaService.initialize();
notificationService.initialize();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
        <OfflineIndicator />
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
