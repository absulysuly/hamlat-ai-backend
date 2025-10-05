#!/usr/bin/env node

/**
 * Standalone Data Collection Monitor
 * Run this script to get regular reports every 10 minutes
 */

import { dataCollectionMonitor } from '../src/services/monitoring/dataCollectionMonitor.js';

console.log('🎯 ELECTION CAMPAIGN - DATA COLLECTION MONITOR');
console.log('📊 Monitoring Iraqi candidate social media activity');
console.log('⏰ Reports every 10 minutes...\n');

// Start the monitoring
dataCollectionMonitor.startMonitoring();
