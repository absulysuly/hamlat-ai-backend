#!/usr/bin/env node

/**
 * Simple Status Checker - No Server Required
 * Check current data collection status without interfering with other projects
 */

class StatusChecker {
  constructor() {
    this.checkInterval = 10 * 60 * 1000; // 10 minutes
    this.isRunning = false;
  }

  /**
   * Check if server is running and get status
   */
  async checkServerStatus() {
    const http = await import('http');

    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/health',
        method: 'GET',
        timeout: 2000
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            resolve({ status: 'running', health });
          } catch (e) {
            resolve({ status: 'error', error: 'Invalid response' });
          }
        });
      });

      req.on('error', () => {
        resolve({ status: 'not_running' });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'timeout' });
      });

      req.end();
    });
  }

  /**
   * Generate current status report
   */
  async generateStatusReport() {
    const timestamp = new Date().toLocaleString();
    const serverStatus = await this.checkServerStatus();

    console.log('\n' + '='.repeat(70));
    console.log(`📊 ELECTION CAMPAIGN STATUS REPORT - ${timestamp}`);
    console.log('='.repeat(70));

    if (serverStatus.status === 'running') {
      console.log('\n✅ SERVER STATUS: RUNNING');
      console.log(`   🌐 Server Health: ${serverStatus.health.status}`);
      console.log(`   ⏰ Uptime: ${Math.round(process.uptime())} seconds`);

      // Try to get collection status
      try {
        const collectionStatus = await this.getCollectionStatus();
        if (collectionStatus) {
          console.log('\n🗂️  DATA COLLECTION STATUS:');
          console.log(`   📊 Collection Active: ${collectionStatus.collection_active ? 'YES' : 'NO'}`);
          console.log(`   📈 Total Statistics: ${collectionStatus.statistics?.length || 0} platforms`);

          if (collectionStatus.statistics) {
            console.log('\n   📋 PLATFORM BREAKDOWN:');
            collectionStatus.statistics.forEach(stat => {
              console.log(`      ${stat.platform.toUpperCase()}: ${stat.total_collected} total, ${stat.last_24h} last 24h`);
            });
          }
        }
      } catch (error) {
        console.log('\n⚠️  Collection API not responding');
      }

      // Try to get Kurdistan priority data
      try {
        const kurdistanData = await this.getKurdistanData();
        if (kurdistanData) {
          console.log('\n🟢 KURDISTAN PRIORITY DATA:');
          console.log(`   📊 Total Mentions (24h): ${kurdistanData.total_kurdistan_mentions}`);

          if (kurdistanData.kurdistan_breakdown) {
            console.log('\n   🗣️  KURDISH LANGUAGE BREAKDOWN:');
            kurdistanData.kurdistan_breakdown.forEach(lang => {
              console.log(`      ${lang.language.toUpperCase()}: ${lang.mentions} mentions`);
            });
          }
        }
      } catch (error) {
        console.log('\n⚠️  Kurdistan API not responding');
      }

    } else {
      console.log('\n❌ SERVER STATUS: NOT RUNNING');
      console.log('   💡 To start monitoring, run: node server.js');
      console.log('   📊 Your other project server should remain unaffected');
    }

    console.log('\n💡 MONITORING TIPS:');
    console.log('   • Run this script anytime to check status');
    console.log('   • Server runs on port 3000 (your other project should use different port)');
    console.log('   • Data collection prioritizes Kurdistan regions');
    console.log('   • All data is persistently stored');

    console.log('\n' + '='.repeat(70));
  }

  /**
   * Get collection status via API
   */
  async getCollectionStatus() {
    const http = await import('http');

    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/social/collection-status',
        method: 'GET',
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const status = JSON.parse(data);
            resolve(status.data);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  }

  /**
   * Get Kurdistan priority data
   */
  async getKurdistanData() {
    const http = await import('http');

    return new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/api/social/priority-analytics?period=24h',
        method: 'GET',
        timeout: 2000,
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const analytics = JSON.parse(data);
            resolve(analytics.data);
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  }

  /**
   * Start continuous monitoring
   */
  startMonitoring() {
    console.log('🚀 STARTING NON-INTRUSIVE STATUS CHECKER');
    console.log('📊 Checking every 10 minutes without interfering with other projects');
    console.log('💡 Run this script anytime to check current status\n');

    this.isRunning = true;

    // Generate initial report
    this.generateStatusReport();

    // Set up interval for regular reports
    setInterval(() => {
      if (this.isRunning) {
        this.generateStatusReport();
      }
    }, this.checkInterval);

    console.log('✅ Status checker started! Reports every 10 minutes.');
    console.log('💡 This script only checks status, doesn\'t start any servers.');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isRunning = false;
    console.log('🛑 Status checker stopped');
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down status checker...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down status checker...');
  process.exit(0);
});

// Start monitoring if run directly
const statusChecker = new StatusChecker();
statusChecker.startMonitoring();

// Export for use in other files
export default statusChecker;
