import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../../utils/logger.js';

/**
 * Web Scraping Service for Iraqi Political Data
 * Scrapes news websites, government sites, and social platforms
 */

class WebScrapingService {
  constructor() {
    this.scrapingTargets = {
      iraqiNews: [
        'https://www.aljazeera.net',
        'https://www.bbc.com/arabic',
        'https://arabic.rt.com',
        'https://www.alhurra.com',
        'https://www.dw.com/ar',
        'https://www.rudaw.net',
        'https://www.kurdistan24.net',
        'https://www.basnews.com',
        'https://www.shafaaq.com',
        'https://www.iraqinews.com'
      ],
      governmentSites: [
        'https://www.iec.gov.iq', // Iraqi Electoral Commission
        'https://www.parliament.iq',
        'https://www.pmo.iq', // Prime Minister Office
        'https://www.mofa.gov.iq' // Ministry of Foreign Affairs
      ],
      politicalPartySites: [
        'https://www.alhikmahp.com', // Al-Hikmah Party
        'https://www.taqaddum.iq', // Taqaddum Party
        'https://www.al-fateh.iq', // Al-Fateh Alliance
        'https://www.kdp.info', // Kurdistan Democratic Party
        'https://www.pukmedia.com' // Patriotic Union of Kurdistan
      ]
    };
  }

  /**
   * Start comprehensive web scraping
   */
  async startScraping() {
    logger.info('🔍 Starting comprehensive web scraping for Iraqi political data');

    await Promise.all([
      this.scrapeNewsWebsites(),
      this.scrapeGovernmentSites(),
      this.scrapePoliticalPartySites(),
      this.scrapeSocialMediaProfiles(),
      this.scrapeElectionCommissionData()
    ]);

    logger.info('✅ Web scraping completed');
  }

  /**
   * Scrape Major Iraqi News Websites
   */
  async scrapeNewsWebsites() {
    logger.info('📰 Scraping Iraqi news websites');

    for (const url of this.scrapingTargets.iraqiNews) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ar,en;q=0.9'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const articles = this.extractArticles($, url);

        for (const article of articles) {
          await this.processArticle(article, 'news');
        }

      } catch (error) {
        logger.error(`Failed to scrape ${url}:`, error.message);
      }
    }
  }

  /**
   * Extract articles from news websites
   */
  extractArticles($, baseUrl) {
    const articles = [];

    // Common selectors for Arabic/Kurdish news sites
    $('article, .article, .news-item, .post, .entry').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h1, h2, h3, .title, .headline').first().text().trim();
      const content = $elem.find('p, .content, .excerpt').first().text().trim();
      const link = $elem.find('a').first().attr('href');
      const date = $elem.find('time, .date, .published').first().text().trim();

      if (title && this.isElectionRelated(title + ' ' + content)) {
        articles.push({
          title,
          content,
          url: link ? (link.startsWith('http') ? link : baseUrl + link) : baseUrl,
          date,
          source: baseUrl
        });
      }
    });

    return articles.slice(0, 10); // Limit to prevent overload
  }

  /**
   * Check if content is election-related
   */
  isElectionRelated(text) {
    const electionKeywords = [
      'انتخابات', 'مرشح', 'حملة', 'سياسي', 'برلمان', 'تصويت',
      'هه‌ڵبژاردن', 'کاندید', 'کامپەین', 'سیاسی', 'پەرلەمان', 'دەنگ',
      'election', 'candidate', 'campaign', 'political', 'parliament', 'vote'
    ];

    return electionKeywords.some(keyword =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  /**
   * Scrape Government and Election Commission Sites
   */
  async scrapeGovernmentSites() {
    logger.info('🏛️ Scraping government and election commission sites');

    for (const url of this.scrapingTargets.governmentSites) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ar,en;q=0.9'
          },
          timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const officialData = this.extractOfficialData($, url);

        for (const data of officialData) {
          await this.processArticle(data, 'official');
        }

      } catch (error) {
        logger.error(`Failed to scrape government site ${url}:`, error.message);
      }
    }
  }

  /**
   * Extract official government data
   */
  extractOfficialData($, baseUrl) {
    const officialData = [];

    // Look for announcements, press releases, official statements
    $('.announcement, .press-release, .official-statement, .news-release').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h1, h2, h3, .title').first().text().trim();
      const content = $elem.find('p, .content').first().text().trim();
      const link = $elem.find('a').first().attr('href');

      if (title) {
        officialData.push({
          title,
          content,
          url: link ? (link.startsWith('http') ? link : baseUrl + link) : baseUrl,
          source: baseUrl,
          type: 'official'
        });
      }
    });

    return officialData;
  }

  /**
   * Scrape Political Party Websites
   */
  async scrapePoliticalPartySites() {
    logger.info('🏛️ Scraping political party websites');

    for (const url of this.scrapingTargets.politicalPartySites) {
      try {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept-Language': 'ar,en,ku;q=0.8'
          },
          timeout: 10000
        });

        const $ = cheerio.load(response.data);
        const partyContent = this.extractPartyContent($, url);

        for (const content of partyContent) {
          await this.processArticle(content, 'party');
        }

      } catch (error) {
        logger.error(`Failed to scrape party site ${url}:`, error.message);
      }
    }
  }

  /**
   * Extract party content and announcements
   */
  extractPartyContent($, baseUrl) {
    const partyContent = [];

    // Look for party statements, candidate announcements, policy positions
    $('article, .statement, .announcement, .policy, .candidate').each((i, elem) => {
      const $elem = $(elem);
      const title = $elem.find('h1, h2, h3, .title').first().text().trim();
      const content = $elem.find('p, .content').first().text().trim();
      const link = $elem.find('a').first().attr('href');

      if (title && (title.includes('مرشح') || title.includes('كانديد') || title.includes('candidate'))) {
        partyContent.push({
          title,
          content,
          url: link ? (link.startsWith('http') ? link : baseUrl + link) : baseUrl,
          source: baseUrl,
          type: 'party'
        });
      }
    });

    return partyContent;
  }

  /**
   * Scrape Candidate Social Media Profiles
   */
  async scrapeSocialMediaProfiles() {
    logger.info('👥 Scraping candidate social media profiles');

    // This would scrape public profiles to find:
    // - Candidate Facebook pages
    // - Instagram accounts
    // - YouTube channels
    // - Personal websites

    // Implementation would search for Iraqi political figures
    // and extract their social media links
  }

  /**
   * Scrape Election Commission Data
   */
  async scrapeElectionCommissionData() {
    logger.info('🗳️ Scraping election commission data');

    // Scrape official election data:
    // - Candidate lists by governorate
    // - Election schedules and deadlines
    // - Voter registration statistics
    // - Past election results
  }

  /**
   * Process and Store Scraped Article
   */
  async processArticle(article, sourceType) {
    try {
      // Check if article already exists
      const existing = await query(
        'SELECT id FROM scraped_content WHERE url = $1',
        [article.url]
      );

      if (existing.rows.length > 0) {
        return; // Already processed
      }

      // Analyze content for political relevance
      const relevance = await this.analyzePoliticalRelevance(article.content + ' ' + article.title);

      if (relevance.score > 0.7) { // Only store highly relevant content
        await query(`
          INSERT INTO scraped_content (
            title, content, url, source, source_type, relevance_score,
            detected_at, language, region
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          article.title,
          article.content,
          article.url,
          article.source,
          sourceType,
          relevance.score,
          new Date(),
          relevance.language,
          relevance.region
        ]);

        logger.info(`Stored article: ${article.title.substring(0, 50)}...`);
      }

    } catch (error) {
      logger.error('Failed to process article:', error);
    }
  }

  /**
   * Analyze political relevance of content
   */
  async analyzePoliticalRelevance(text) {
    // Use AI to determine if content is politically relevant
    // Return relevance score, language, and region

    return {
      score: 0.85, // Placeholder - would use AI analysis
      language: 'arabic', // Would detect actual language
      region: 'baghdad' // Would extract region mentions
    };
  }

  /**
   * Extract candidate information from scraped content
   */
  async extractCandidateInformation(content) {
    // Use NLP to extract:
    // - Candidate names
    // - Political parties
    // - Governorates/regions
    // - Campaign promises
    // - Social media links

    // This would use advanced text analysis to build candidate profiles
  }
}

export const webScrapingService = new WebScrapingService();

/**
 * Start scraping (called from jobs service)
 */
export async function startWebScraping() {
  await webScrapingService.startScraping();
}

export default webScrapingService;
