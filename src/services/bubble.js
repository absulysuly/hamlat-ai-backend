import axios from 'axios';
import logger from '../utils/logger.js';

export class BubbleClient {
  constructor(apiKey, appName) {
    this.apiKey = apiKey;
    this.appName = appName;
    this.baseUrl = `https://${appName}.bubbleapps.io/api/1.1`;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async query(endpoint, params = {}) {
    try {
      const response = await this.client.get(endpoint, { params });
      return response.data;
    } catch (error) {
      logger.error('Bubble API query error:', error);
      throw error;
    }
  }

  async create(endpoint, data) {
    try {
      const response = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      logger.error('Bubble API create error:', error);
      throw error;
    }
  }

  async update(endpoint, data) {
    try {
      const response = await this.client.patch(endpoint, data);
      return response.data;
    } catch (error) {
      logger.error('Bubble API update error:', error);
      throw error;
    }
  }

  async delete(endpoint) {
    try {
      const response = await this.client.delete(endpoint);
      return response.data;
    } catch (error) {
      logger.error('Bubble API delete error:', error);
      throw error;
    }
  }
}

export const bubble = new BubbleClient(
  process.env.BUBBLE_API_KEY,
  process.env.BUBBLE_APP_NAME
);
