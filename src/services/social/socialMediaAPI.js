import axios from 'axios';
import { query } from '../../../config/database.js';
import logger from '../../utils/logger.js';

/**
 * Social Media API Integration Service
 * Handles official APIs for Facebook, Instagram, YouTube, Twitter
 */

class SocialMediaAPIService {
  constructor() {
    this.apiKeys = {
      facebook: process.env.FACEBOOK_ACCESS_TOKEN,
      instagram: process.env.INSTAGRAM_ACCESS_TOKEN,
      youtube: process.env.YOUTUBE_API_KEY,
      twitter: process.env.TWITTER_BEARER_TOKEN
    };

    this.apiEndpoints = {
      facebook: 'https://graph.facebook.com/v18.0',
      instagram: 'https://graph.facebook.com/v18.0',
      youtube: 'https://www.googleapis.com/youtube/v3',
      twitter: 'https://api.twitter.com/2'
    };
  }

  /**
   * Initialize API connections and collect data
   */
  async collectFromAllAPIs() {
    logger.info('🔗 Starting API data collection from all platforms');

    await Promise.all([
      this.collectFacebookAPI(),
      this.collectInstagramAPI(),
      this.collectYouTubeAPI(),
      this.collectTwitterAPI()
    ]);

    logger.info('✅ API data collection completed');
  }

  /**
   * Facebook Graph API Collection
   */
  async collectFacebookAPI() {
    if (!this.apiKeys.facebook) {
      logger.warn('Facebook access token not configured');
      return;
    }

    logger.info('📘 Collecting data from Facebook Graph API');

    try {
      // Get candidate pages and posts
      const candidatePages = await this.getCandidatePages();
      const iraqiPoliticians = await this.searchIraqiPoliticians();

      for (const page of [...candidatePages, ...iraqiPoliticians]) {
        await this.collectPageData(page.id, page.name);
      }

    } catch (error) {
      logger.error('Facebook API collection failed:', error);
    }
  }

  /**
   * Get registered candidate pages
   */
  async getCandidatePages() {
    // Query database for candidates who connected their Facebook pages
    const result = await query(`
      SELECT facebook_page_id, facebook_page_name
      FROM users
      WHERE facebook_page_id IS NOT NULL AND is_active = true
    `);

    return result.rows;
  }

  /**
   * Search for Iraqi political figures
   */
  async searchIraqiPoliticians() {
    // Search Facebook for Iraqi politicians and candidates
    const searchTerms = [
      'سياسي عراقي', 'مرشح برلماني', 'نائب عراقي',
      'kurdish politician iraq', 'iraqi mp', 'iraqi candidate'
    ];

    // This would use Facebook's search API to find political pages
    // and return page information
    return [];
  }

  /**
   * Collect data from specific Facebook page
   */
  async collectPageData(pageId, pageName) {
    try {
      // Get recent posts
      const postsResponse = await axios.get(`${this.apiEndpoints.facebook}/${pageId}/posts`, {
        params: {
          access_token: this.apiKeys.facebook,
          fields: 'id,message,created_time,attachments,insights.metric(post_impressions,post_engaged_users,post_reactions_by_type_total)',
          limit: 50
        }
      });

      for (const post of postsResponse.data.data || []) {
        await this.processFacebookPost(post, pageId, pageName);
      }

      // Get page insights
      await this.collectPageInsights(pageId);

    } catch (error) {
      logger.error(`Failed to collect data for page ${pageId}:`, error);
    }
  }

  /**
   * Process Facebook post data
   */
  async processFacebookPost(post, pageId, pageName) {
    // Extract engagement metrics
    const engagement = {
      reactions: post.insights?.data?.[0]?.values?.[0]?.value?.reactions || 0,
      comments: post.insights?.data?.[1]?.values?.[0]?.value?.comments || 0,
      shares: post.insights?.data?.[2]?.values?.[0]?.value?.shares || 0,
      impressions: post.insights?.data?.[3]?.values?.[0]?.value?.impressions || 0
    };

    // Store post data
    await query(`
      INSERT INTO social_mentions (
        platform, content, author_name, author_handle, post_id,
        engagement_metrics, detected_at, url, region, language, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (platform, post_id) DO UPDATE SET
        content = EXCLUDED.content,
        engagement_metrics = EXCLUDED.engagement_metrics,
        detected_at = EXCLUDED.detected_at
    `, [
      'facebook',
      post.message || 'Media post',
      pageName,
      pageId,
      post.id,
      JSON.stringify(engagement),
      new Date(post.created_time),
      `https://facebook.com/${post.id}`,
      this.extractRegion(post.message),
      this.detectLanguage(post.message),
      null // Will be linked to user if it's a registered candidate
    ]);
  }

  /**
   * Instagram Basic Display API Collection
   */
  async collectInstagramAPI() {
    if (!this.apiKeys.instagram) {
      logger.warn('Instagram access token not configured');
      return;
    }

    logger.info('📷 Collecting data from Instagram Basic Display API');

    try {
      // Get user media (posts)
      const mediaResponse = await axios.get(`${this.apiEndpoints.instagram}/me/media`, {
        params: {
          access_token: this.apiKeys.instagram,
          fields: 'id,media_type,media_url,permalink,caption,timestamp,like_count,comments_count',
          limit: 50
        }
      });

      for (const media of mediaResponse.data.data || []) {
        await this.processInstagramMedia(media);
      }

    } catch (error) {
      logger.error('Instagram API collection failed:', error);
    }
  }

  /**
   * Process Instagram media data
   */
  async processInstagramMedia(media) {
    await query(`
      INSERT INTO social_mentions (
        platform, content, post_id, media_url, engagement_metrics,
        detected_at, url, region, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (platform, post_id) DO UPDATE SET
        content = EXCLUDED.content,
        engagement_metrics = EXCLUDED.engagement_metrics
    `, [
      'instagram',
      media.caption || 'Instagram post',
      media.id,
      media.media_url,
      JSON.stringify({
        likes: media.like_count || 0,
        comments: media.comments_count || 0
      }),
      new Date(media.timestamp),
      media.permalink,
      this.extractRegion(media.caption),
      this.detectLanguage(media.caption)
    ]);
  }

  /**
   * YouTube Data API Collection
   */
  async collectYouTubeAPI() {
    if (!this.apiKeys.youtube) {
      logger.warn('YouTube API key not configured');
      return;
    }

    logger.info('🎥 Collecting data from YouTube Data API');

    try {
      // Search for Iraqi political channels
      const searchResponse = await axios.get(`${this.apiEndpoints.youtube}/search`, {
        params: {
          key: this.apiKeys.youtube,
          q: 'سياسي عراقي OR kurdish politician iraq OR iraqi candidate',
          type: 'channel',
          part: 'snippet',
          maxResults: 50,
          regionCode: 'IQ'
        }
      });

      for (const channel of searchResponse.data.items || []) {
        await this.collectChannelData(channel.id.channelId, channel.snippet.title);
      }

    } catch (error) {
      logger.error('YouTube API collection failed:', error);
    }
  }

  /**
   * Collect data from YouTube channel
   */
  async collectChannelData(channelId, channelName) {
    try {
      // Get channel videos
      const videosResponse = await axios.get(`${this.apiEndpoints.youtube}/search`, {
        params: {
          key: this.apiKeys.youtube,
          channelId: channelId,
          order: 'date',
          type: 'video',
          part: 'snippet',
          maxResults: 20
        }
      });

      for (const video of videosResponse.data.items || []) {
        await this.processYouTubeVideo(video, channelId, channelName);
      }

    } catch (error) {
      logger.error(`Failed to collect data for channel ${channelId}:`, error);
    }
  }

  /**
   * Process YouTube video data
   */
  async processYouTubeVideo(video, channelId, channelName) {
    await query(`
      INSERT INTO social_mentions (
        platform, content, author_name, author_handle, post_id,
        media_url, detected_at, url, region, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (platform, post_id) DO UPDATE SET
        content = EXCLUDED.content,
        detected_at = EXCLUDED.detected_at
    `, [
      'youtube',
      video.snippet.title,
      channelName,
      channelId,
      video.id.videoId,
      `https://www.youtube.com/watch?v=${video.id.videoId}`,
      new Date(video.snippet.publishedAt),
      `https://www.youtube.com/watch?v=${video.id.videoId}`,
      this.extractRegion(video.snippet.title + ' ' + video.snippet.description),
      this.detectLanguage(video.snippet.title)
    ]);
  }

  /**
   * Twitter API Collection (X API v2)
   */
  async collectTwitterAPI() {
    if (!this.apiKeys.twitter) {
      logger.warn('Twitter bearer token not configured');
      return;
    }

    logger.info('🐦 Collecting data from Twitter API');

    try {
      // Search for recent tweets from Iraqi politicians
      const searchResponse = await axios.get(`${this.apiEndpoints.twitter}/tweets/search/recent`, {
        params: {
          query: '(سياسي OR مرشح OR برلماني) iraq -is:retweet',
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics,author_id,context_annotations',
          'user.fields': 'username,name,location,verified'
        },
        headers: {
          'Authorization': `Bearer ${this.apiKeys.twitter}`
        }
      });

      for (const tweet of searchResponse.data.data || []) {
        await this.processTweet(tweet);
      }

    } catch (error) {
      logger.error('Twitter API collection failed:', error);
    }
  }

  /**
   * Process Twitter data
   */
  async processTweet(tweet) {
    // Get user information
    const userResponse = await axios.get(`${this.apiEndpoints.twitter}/users/${tweet.author_id}`, {
      params: {
        'user.fields': 'username,name,location,verified'
      },
      headers: {
        'Authorization': `Bearer ${this.apiKeys.twitter}`
      }
    });

    const user = userResponse.data.data;

    await query(`
      INSERT INTO social_mentions (
        platform, content, author_name, author_handle, post_id,
        engagement_metrics, detected_at, url, region, language
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (platform, post_id) DO UPDATE SET
        content = EXCLUDED.content,
        engagement_metrics = EXCLUDED.engagement_metrics
    `, [
      'twitter',
      tweet.text,
      user.name,
      user.username,
      tweet.id,
      JSON.stringify(tweet.public_metrics),
      new Date(tweet.created_at),
      `https://twitter.com/${user.username}/status/${tweet.id}`,
      this.extractRegion(tweet.text),
      this.detectLanguage(tweet.text)
    ]);
  }

  /**
   * Extract region from text content
   */
  extractRegion(text) {
    const regions = [
      'baghdad', 'basra', 'mosul', 'erbil', 'sulaymaniyah', 'kirkuk',
      'najaf', 'karbala', 'nasiriyah', 'hillah', 'diwaniyah', 'samawah'
    ];

    for (const region of regions) {
      if (text.toLowerCase().includes(region)) {
        return region;
      }
    }

    return 'iraq'; // Default to country level
  }

  /**
   * Detect language of content
   */
  detectLanguage(text) {
    // Simple language detection based on character sets
    const arabicChars = /[\u0600-\u06FF]/;
    const kurdishChars = /[\u0600-\u06FF]/; // Kurdish uses similar script

    if (arabicChars.test(text)) {
      // More sophisticated detection would differentiate Arabic vs Kurdish
      return text.includes('ک') || text.includes('ۆ') || text.includes('ە') ? 'kurdish' : 'arabic';
    }

    return 'english'; // Default
  }

  /**
   * Get API rate limits and quotas
   */
  getAPILimits() {
    return {
      facebook: {
        posts: 200, // per hour per page
        insights: 200, // per hour per page
        searches: 200 // per hour
      },
      instagram: {
        media: 200, // per hour
        insights: 200 // per hour
      },
      youtube: {
        searches: 10000, // per day
        videos: 10000 // per day
      },
      twitter: {
        tweets: 300, // per 15 minutes
        users: 300 // per 15 minutes
      }
    };
  }
}

export const socialMediaAPI = new SocialMediaAPIService();

/**
 * Start API collection (called from jobs service)
 */
export async function startAPICollection() {
  await socialMediaAPI.collectFromAllAPIs();
}

export default socialMediaAPI;
