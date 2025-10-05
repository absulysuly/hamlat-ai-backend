import { prisma, logger } from '../server.js';
import { CandidateService } from './CandidateService.js';
import { RegionalService, Priority } from './RegionalService.js';
import nodemailer from 'nodemailer';
import Twilio from 'twilio';

export interface NotificationTemplate {
  email: {
    subject: string;
    html: string;
    text: string;
  };
  sms?: string;
  whatsapp?: string;
}

export class NotificationService {
  private candidateService: CandidateService;
  private regionalService: RegionalService;
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: Twilio.Twilio;
  private whatsappClient: any; // WhatsApp Business API client

  constructor() {
    this.candidateService = new CandidateService();
    this.regionalService = new RegionalService();
    this.initializeTransporters();
  }

  private initializeTransporters() {
    // Email transporter
    this.emailTransporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // SMS transporter (Twilio)
    this.twilioClient = new Twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // WhatsApp Business API would be initialized here
    // this.whatsappClient = new WhatsAppBusinessAPI({...});
  }

  async start() {
    logger.info('🔔 Starting notification service...');

    // Daily digest at 8 AM Kurdistan time
    this.scheduleDailyDigest();

    // Trending candidate alerts
    this.scheduleTrendingAlerts();

    // Collection status monitoring
    this.scheduleHealthMonitoring();

    logger.info('✅ Notification service started');
  }

  async stop() {
    logger.info('⏹️ Stopping notification service...');
    // Cleanup would go here
  }

  private scheduleDailyDigest() {
    // Daily at 8 AM (Kurdistan time = UTC+3)
    const cron = require('node-cron');
    cron.schedule('0 5 * * *', async () => { // 5 AM UTC = 8 AM Kurdistan time
      try {
        await this.sendDailyDigest();
      } catch (error) {
        logger.error('Failed to send daily digest:', error);
      }
    });
  }

  private scheduleTrendingAlerts() {
    // Check for trending candidates every 15 minutes
    const cron = require('node-cron');
    cron.schedule('*/15 * * * *', async () => {
      try {
        await this.checkForTrendingCandidates();
      } catch (error) {
        logger.error('Failed to check trending candidates:', error);
      }
    });
  }

  private scheduleHealthMonitoring() {
    // Health check every 30 minutes
    const cron = require('node-cron');
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.checkSystemHealth();
      } catch (error) {
        logger.error('Failed to check system health:', error);
      }
    });
  }

  async sendTrendingAlert(candidate: any) {
    try {
      logger.info(`🚨 Sending trending alert for candidate: ${candidate.name}`);

      const template = this.getTrendingTemplate(candidate);

      // Send email notification
      await this.sendEmail({
        to: process.env.ALERT_EMAIL || 'admin@hamlatai.com',
        subject: template.email.subject,
        html: template.email.html,
        text: template.email.text
      });

      // Send SMS for Kurdistan candidates
      if (candidate.region?.includes('Kurdistan') && process.env.ALERT_PHONE) {
        await this.sendSMS({
          to: process.env.ALERT_PHONE,
          body: `🔥 Kurdistan candidate ${candidate.name} is trending! Check dashboard for details.`
        });
      }

      // Send WhatsApp notification
      if (candidate.whatsapp && process.env.WHATSAPP_ADMIN_NUMBER) {
        await this.sendWhatsAppMessage({
          to: process.env.WHATSAPP_ADMIN_NUMBER,
          message: `🚨 *TRENDING CANDIDATE*\n\n${candidate.name} from ${candidate.region}\nInfluence Score: ${candidate.influenceScore}\n\nCheck the dashboard for more details!`
        });
      }

      logger.info(`✅ Sent trending alert for candidate: ${candidate.name}`);

    } catch (error) {
      logger.error('Failed to send trending alert:', error);
      throw error;
    }
  }

  async sendDailyDigest() {
    try {
      logger.info('📊 Sending daily digest...');

      // Get daily metrics (mock data for now)
      const metrics = {
        totalMentions: 15420,
        kurdistanMentions: 4620,
        topCandidates: [
          { name: 'محەمەد عەلی', region: 'Erbil', influenceScore: 85 },
          { name: 'فاتمە حەسەن', region: 'Sulaymaniyah', influenceScore: 72 }
        ],
        sentimentTrend: 0.15
      };

      const template = this.getDailyDigestTemplate(metrics);

      await this.sendEmail({
        to: process.env.DIGEST_EMAIL || 'team@hamlatai.com',
        subject: template.email.subject,
        html: template.email.html,
        text: template.email.text
      });

      logger.info('✅ Sent daily digest');

    } catch (error) {
      logger.error('Failed to send daily digest:', error);
      throw error;
    }
  }

  async sendWhatsAppCampaign(
    candidates: any[],
    message: string,
    dialect: string = 'sorani'
  ) {
    try {
      logger.info(`📱 Sending WhatsApp campaign to ${candidates.length} candidates`);

      let successCount = 0;
      let failureCount = 0;

      for (const candidate of candidates) {
        if (candidate.socialMedia?.whatsapp) {
          try {
            // Translate message if needed
            const translatedMessage = await this.translateForWhatsApp(message, dialect);

            await this.sendWhatsAppMessage({
              to: candidate.socialMedia.whatsapp,
              message: translatedMessage
            });

            successCount++;

            // Rate limiting: 1 message per second
            await new Promise(resolve => setTimeout(resolve, 1000));

          } catch (error) {
            logger.error(`Failed to send WhatsApp to ${candidate.name}:`, error);
            failureCount++;
          }
        }
      }

      logger.info(`✅ WhatsApp campaign completed: ${successCount} sent, ${failureCount} failed`);

      return { successCount, failureCount };

    } catch (error) {
      logger.error('Failed to send WhatsApp campaign:', error);
      throw error;
    }
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    try {
      await this.emailTransporter.sendMail({
        from: process.env.FROM_EMAIL || 'noreply@hamlatai.com',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }

  private async sendSMS(options: { to: string; body: string }) {
    try {
      await this.twilioClient.messages.create({
        body: options.body,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: options.to
      });
    } catch (error) {
      logger.error('Failed to send SMS:', error);
      throw error;
    }
  }

  private async sendWhatsAppMessage(options: { to: string; message: string }) {
    try {
      // WhatsApp Business API integration would go here
      // For now, log the message
      logger.info(`WhatsApp message to ${options.to}: ${options.message}`);

      // In production:
      // await this.whatsappClient.sendMessage(options.to, options.message);
    } catch (error) {
      logger.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  private async translateForWhatsApp(message: string, dialect: string): Promise<string> {
    // For now, return the original message
    // TODO: Integrate with translation service
    return message;
  }

  private async checkForTrendingCandidates() {
    try {
      // Get candidates with high recent activity
      const candidates = await prisma.candidate.findMany({
        where: {
          influenceScore: { gte: 80 },
          lastUpdated: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        },
        take: 5
      });

      for (const candidate of candidates) {
        if (candidate.influenceScore > 85) {
          await this.sendTrendingAlert(candidate);
        }
      }
    } catch (error) {
      logger.error('Failed to check for trending candidates:', error);
    }
  }

  private async checkSystemHealth() {
    try {
      // Check if collection is working properly
      const recentMentions = await prisma.socialMention.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
          }
        }
      });

      if (recentMentions === 0) {
        // Send alert about collection issues
        await this.sendEmail({
          to: process.env.ADMIN_EMAIL || 'admin@hamlatai.com',
          subject: '⚠️ HamlatAI Collection Alert',
          html: `
            <h2>Collection System Alert</h2>
            <p>No mentions collected in the last hour.</p>
            <p>Please check the collection system and API connections.</p>
          `,
          text: 'Collection System Alert: No mentions collected in the last hour. Please check the system.'
        });
      }
    } catch (error) {
      logger.error('Failed to check system health:', error);
    }
  }

  private getTrendingTemplate(candidate: any): NotificationTemplate {
    return {
      email: {
        subject: `🔥 Trending Candidate Alert: ${candidate.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">🚨 Trending Candidate Alert</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>${candidate.name}</h3>
              <p><strong>Region:</strong> ${candidate.region}</p>
              <p><strong>Party:</strong> ${candidate.party?.name || 'Unknown'}</p>
              <p><strong>Influence Score:</strong> ${candidate.influenceScore}</p>
              <p><strong>Last Updated:</strong> ${candidate.lastUpdated?.toLocaleString()}</p>
            </div>
            <p>This candidate is showing significant recent activity and may be gaining traction.</p>
            <a href="${process.env.DASHBOARD_URL || 'http://localhost:3000'}"
               style="background: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
              View Dashboard
            </a>
          </div>
        `,
        text: `Trending Candidate Alert: ${candidate.name} from ${candidate.region} with influence score ${candidate.influenceScore}. Check the dashboard for details.`
      },
      sms: `🔥 ${candidate.name} (${candidate.region}) is trending! Score: ${candidate.influenceScore}`
    };
  }

  private getDailyDigestTemplate(metrics: any): NotificationTemplate {
    return {
      email: {
        subject: `📊 HamlatAI Daily Digest - ${new Date().toLocaleDateString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c3e50;">📊 Daily Digest Report</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>📈 Key Metrics</h3>
              <p><strong>Total Mentions:</strong> ${metrics.totalMentions.toLocaleString()}</p>
              <p><strong>Kurdistan Mentions:</strong> ${metrics.kurdistanMentions.toLocaleString()}</p>
              <p><strong>Kurdistan Ratio:</strong> ${((metrics.kurdistanMentions/metrics.totalMentions)*100).toFixed(1)}%</p>
              <p><strong>Sentiment Trend:</strong> ${metrics.sentimentTrend > 0 ? '📈 Improving' : metrics.sentimentTrend < 0 ? '📉 Declining' : '➡️ Stable'}</p>
            </div>

            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3>🥇 Top Kurdistan Candidates</h3>
              ${metrics.topCandidates.map((c: any, i: number) =>
                `<p><strong>#${i+1}:</strong> ${c.name} (${c.region}) - Score: ${c.influenceScore}</p>`
              ).join('')}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.DASHBOARD_URL || 'http://localhost:3000'}"
                 style="background: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px;">
                View Full Dashboard →
              </a>
            </div>
          </div>
        `,
        text: `Daily Digest: ${metrics.totalMentions} total mentions, ${metrics.kurdistanMentions} Kurdistan mentions. Top candidates: ${metrics.topCandidates.map((c: any) => c.name).join(', ')}.`
      }
    };
  }
}
