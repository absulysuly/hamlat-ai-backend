// Logging and Analytics Service for Campaign Platform
// In production, integrate with Sentry, LogRocket, or similar

const logError = (error, context = {}) => {
  console.error("Campaign Error:", error);
  if (context) {
    console.error("Error Context:", context);
  }
  
  // Store error in localStorage for debugging
  try {
    const errors = JSON.parse(localStorage.getItem('campaign_errors') || '[]');
    errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.shift();
    }
    
    localStorage.setItem('campaign_errors', JSON.stringify(errors));
  } catch (e) {
    console.error('Failed to store error:', e);
  }
};

const trackEvent = (eventName, properties = {}) => {
  console.log(`[Campaign Analytics] ${eventName}`, properties);
  
  // Store analytics events for later sync
  try {
    const events = JSON.parse(localStorage.getItem('campaign_analytics') || '[]');
    events.push({
      event: eventName,
      properties,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }
    
    localStorage.setItem('campaign_analytics', JSON.stringify(events));
  } catch (e) {
    console.error('Failed to store analytics event:', e);
  }
};

const trackPageView = (pageName, properties = {}) => {
  trackEvent('page_view', { page: pageName, ...properties });
};

const trackCampaignAction = (action, candidateId, metadata = {}) => {
  trackEvent('campaign_action', {
    action,
    candidateId,
    ...metadata
  });
};

export const loggingService = {
  logError,
  trackEvent,
  trackPageView,
  trackCampaignAction
};
