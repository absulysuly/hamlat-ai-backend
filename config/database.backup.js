```javascript
import { bubble } from '../src/services/bubble.js';
import logger from '../src/utils/logger.js';

export async function initializeDatabase() {
  try {
    const version = await bubble.query('version');
    logger.info('Connected to Bubble API:', version);
    return true;
  } catch (error) {
    logger.error('Failed to connect to Bubble API:', error);
    throw error;
  }
}

export async function query(endpoint, params = {}) {
  return await bubble.query(endpoint, params);
}

export async function create(endpoint, data) {
  return await bubble.create(endpoint, data);
}

export async function update(endpoint, data) {
  return await bubble.update(endpoint, data);
}

export async function remove(endpoint) {
  return await bubble.delete(endpoint);
}

export default {
  initializeDatabase,
  query,
  create,
  update,
  remove
};
