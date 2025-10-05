// Campaign Notification Service
// Handles push notifications for content approval, sentiment alerts, etc.

class NotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.vapidPublicKey = 'YOUR_VAPID_PUBLIC_KEY'; // Replace with actual key
  }

  async initialize() {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return false;
      }

      if (!('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return false;
      }

      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      await navigator.serviceWorker.ready;
      this.registration = registration;

      console.log('Notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      return false;
    }
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  async subscribe(userId, preferences = {}) {
    try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return null;
      }

      if (!this.registration) {
        throw new Error('Service worker not registered');
      }

      // In production, implement proper push subscription
      console.log('Push notifications would be subscribed here');
      
      // Store preferences locally
      localStorage.setItem('notification_preferences', JSON.stringify({
        userId,
        contentApproval: true,
        sentimentAlerts: true,
        competitorAlerts: true,
        campaignMilestones: true,
        budgetAlerts: true,
        ...preferences
      }));

      return true;
    } catch (error) {
      console.error('Failed to subscribe to notifications:', error);
      return null;
    }
  }

  async sendNotification(data) {
    try {
      const permission = Notification.permission;
      
      if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return false;
      }

      const notification = new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/logo192.png',
        badge: data.badge || '/logo192.png',
        tag: data.tag,
        requireInteraction: data.requireInteraction || false,
        data: data.data
      });

      notification.onclick = (event) => {
        event.preventDefault();
        this.handleNotificationClick(data);
      };

      setTimeout(() => {
        notification.close();
      }, 10000);

      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  // Campaign-specific notification methods
  async notifyContentReady(contentId, contentType) {
    return this.sendNotification({
      title: 'AI Content Ready',
      body: `New ${contentType} is ready for your approval`,
      icon: '/logo192.png',
      tag: `content-${contentId}`,
      requireInteraction: true,
      data: {
        type: 'content_approval',
        contentId,
        url: `/content?id=${contentId}`
      }
    });
  }

  async notifySentimentAlert(sentiment, trend) {
    return this.sendNotification({
      title: 'Sentiment Alert',
      body: `Public sentiment is ${sentiment} (${trend})`,
      icon: '/logo192.png',
      tag: 'sentiment-alert',
      requireInteraction: true,
      data: {
        type: 'sentiment_alert',
        sentiment,
        trend,
        url: '/analytics'
      }
    });
  }

  async notifyBudgetAlert(spent, budget) {
    const percentage = (spent / budget) * 100;
    return this.sendNotification({
      title: 'Budget Alert',
      body: `Campaign budget is ${percentage.toFixed(0)}% spent`,
      icon: '/logo192.png',
      tag: 'budget-alert',
      requireInteraction: true,
      data: {
        type: 'budget_alert',
        spent,
        budget,
        url: '/dashboard'
      }
    });
  }

  async notifyCompetitorActivity(competitorName, activity) {
    return this.sendNotification({
      title: 'Competitor Activity',
      body: `${competitorName} ${activity}`,
      icon: '/logo192.png',
      tag: 'competitor-alert',
      data: {
        type: 'competitor_alert',
        competitorName,
        activity,
        url: '/analytics'
      }
    });
  }

  async notifyCampaignMilestone(milestone) {
    return this.sendNotification({
      title: 'Campaign Milestone!',
      body: milestone,
      icon: '/logo192.png',
      tag: 'milestone',
      requireInteraction: true,
      data: {
        type: 'milestone',
        milestone,
        url: '/dashboard'
      }
    });
  }

  handleNotificationClick(data) {
    if (data.data?.url) {
      window.open(data.data.url, '_blank');
    } else {
      window.focus();
    }
  }

  getPreferences() {
    try {
      const prefs = localStorage.getItem('notification_preferences');
      return prefs ? JSON.parse(prefs) : null;
    } catch (error) {
      console.error('Failed to get notification preferences:', error);
      return null;
    }
  }

  updatePreferences(preferences) {
    try {
      const current = this.getPreferences() || {};
      const updated = { ...current, ...preferences };
      localStorage.setItem('notification_preferences', JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      return false;
    }
  }

  getStatus() {
    return {
      isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
      permission: Notification?.permission || 'default',
      isSubscribed: !!this.subscription
    };
  }
}

export const notificationService = new NotificationService();
