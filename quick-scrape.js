const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const OUTPUT_DIR = './scraped_data';
const SEARCH_TERMS = [
  'Iraq election',
  'Kurdistan vote',
  'Iraqi candidates 2025',
  'Kurdish election',
  'Sulaymaniyah election'
];

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Simple fetch with error handling
async function fetchUrl(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    return null;
  }
}

// Scrape Nitter (Twitter)
async function scrapeNitter(term) {
  const url = `https://nitter.net/search?f=tweets&q=${encodeURIComponent(term)}`;
  console.log(`🔍 Searching Nitter for: ${term}`);
  
  const html = await fetchUrl(url);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const results = [];
  
  $('.timeline-item').each((i, el) => {
    const content = $(el).find('.tweet-content').text().trim();
    if (content) {
      results.push({
        platform: 'Twitter',
        content: content.replace(/\s+/g, ' '),
        searchTerm: term,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  return results;
}

// Main function
async function main() {
  console.log('🚀 Starting HamlatAI Social Media Scraper');
  
  let allResults = [];
  
  for (const term of SEARCH_TERMS) {
    const results = await scrapeNitter(term);
    allResults = [...allResults, ...results];
    
    // Be nice to servers
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Save results
  if (allResults.length > 0) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(OUTPUT_DIR, `scraped_data_${timestamp}.json`);
    
    fs.writeFileSync(filePath, JSON.stringify(allResults, null, 2));
    console.log(`\n✅ Successfully saved ${allResults.length} results to ${filePath}`);
    
    // Display sample results
    console.log('\n📋 Sample Results:');
    allResults.slice(0, 3).forEach((result, i) => {
      console.log(`\n--- Result ${i + 1} ---`);
      console.log(`Platform: ${result.platform}`);
      console.log(`Search: ${result.searchTerm}`);
      console.log(`Content: ${result.content.substring(0, 100)}...`);
    });
  } else {
    console.log('\n❌ No results found. The website structure might have changed.');
  }
}

// Run the scraper
main().catch(console.error);
