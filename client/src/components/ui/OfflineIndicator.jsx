import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Offline Indicator Component
 * From Iraq Compass - PWA feature
 */
export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowNotification(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          className={`
            fixed top-4 right-4 z-50
            px-4 py-3 rounded-lg
            backdrop-blur-md border
            flex items-center gap-3
            ${isOnline 
              ? 'bg-success/20 border-success/30 text-success' 
              : 'bg-danger/20 border-danger/30 text-danger'
            }
          `}
          initial={{ opacity: 0, y: -20, x: 100 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -20, x: 100 }}
        >
          {isOnline ? <Wifi size={20} /> : <WifiOff size={20} />}
          <span className="font-medium">
            {isOnline ? 'Back Online' : 'You\'re Offline'}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
