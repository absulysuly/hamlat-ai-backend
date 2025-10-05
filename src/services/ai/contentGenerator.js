import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import logger from '../../utils/logger.js';

// Initialize AI clients
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// ============================================
// MASTER AI PROMPT TEMPLATE
// ============================================

function buildMasterPrompt(candidateData, topic, contentType = 'post') {
  const { name, governorate, party, issues, language, dialect, audience } = candidateData;
  
  const languageInstructions = {
    ar: `
    - Use natural Iraqi dialect, not formal Modern Standard Arabic (MSA)
    - Common phrases: "شلونكم" "زينين" "ان شاء الله" "احنا"
    - Avoid overly formal political jargon
    - Use "احنا" instead of "نحن"
    - Regional variations: ${dialect === 'baghdad' ? 'Baghdad style' : dialect === 'basra' ? 'Basra style' : 'General Iraqi'}
    `,
    ku: `
    - Use ${dialect === 'sorani' ? 'Sorani Kurdish (Arabic script)' : 'Kurmanji Kurdish'}
    - Common greetings: "سڵاو" "چۆنی؟"
    - Political terms: "کەمپین" (campaign), "دەنگدان" (voting)
    - Respect cultural values: family, community, dignity
    `,
    en: `
    - Professional international tone
    - Explain Iraqi context when needed
    - Clear and accessible language
    `,
  };

  return `You are "HamlatAI", an expert Iraqi political campaign manager and content creator. You create engaging, culturally appropriate social media content for political candidates.

CONTEXT:
- Candidate Name: ${name}
- Governorate: ${governorate}
- Political Party: ${party || 'Independent'}
- Key Issues: ${issues.join(', ')}
- Target Audience: ${JSON.stringify(audience)}
- Language: ${language} (${dialect})
- Current Topic: ${topic}

TONE & STYLE GUIDELINES:
- Be respectful and professional
- Use inclusive language
- Avoid sectarian or divisive rhetoric
- Focus on solutions, not just problems
- Be optimistic but realistic
- Use cultural references appropriate for Iraq
- Include relevant emojis (moderate use - 2-3 per post)

LANGUAGE-SPECIFIC RULES:
${languageInstructions[language] || languageInstructions.en}

CONTENT REQUIREMENTS:
1. Length: ${contentType === 'post' ? '50-150 words' : contentType === 'video' ? '30-45 seconds script' : '20-30 words'}
2. Call-to-action: Always end with engagement prompt
3. Hashtags: Include 3-5 relevant hashtags in target language
4. Accessibility: Describe any images for visually impaired
5. Fact-check: All claims must be verifiable

CURRENT TASK:
Generate a ${contentType} about "${topic}" for ${candidateData.platform || 'Facebook'}.

OUTPUT FORMAT (JSON):
{
  "content": "Main text in ${language}",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "image_description": "Description for AI image generation",
  "predicted_engagement": {
    "likes": estimated_number,
    "comments": estimated_number,
    "shares": estimated_number,
    "reach": estimated_number
  },
  "alternative_versions": [
    "Alternative version 1",
    "Alternative version 2"
  ],
  "best_time_to_post": "HH:MM format",
  "target_audience_match": "percentage"
}`;
}

// ============================================
// CONTENT GENERATION FUNCTIONS
// ============================================

export async function generateCampaignContent(candidateData, topic, options = {}) {
  const {
    contentType = 'post',
    platform = 'facebook',
    model = 'groq', // 'groq', 'gemini', 'openai'
  } = options;

  try {
    const prompt = buildMasterPrompt(candidateData, topic, contentType);
    
    let response;
    
    switch (model) {
      case 'groq':
        response = await generateWithGroq(prompt);
        break;
      case 'gemini':
        response = await generateWithGemini(prompt);
        break;
      case 'openai':
        response = await generateWithOpenAI(prompt);
        break;
      default:
        response = await generateWithGroq(prompt); // Default to Groq (free)
    }

    // Parse and validate response
    const parsedContent = parseAIResponse(response);
    
    logger.info('Content generated successfully', {
      candidate: candidateData.name,
      topic,
      model,
      language: candidateData.language,
    });

    return {
      ...parsedContent,
      ai_model: model,
      generation_prompt: prompt,
    };
  } catch (error) {
    logger.error('Content generation failed:', error);
    throw error;
  }
}

// ============================================
// AI MODEL IMPLEMENTATIONS
// ============================================

async function generateWithGroq(prompt) {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'user',
        content: 'Generate the content now in the specified JSON format.',
      },
    ],
    model: 'llama-3.1-70b-versatile', // Free and powerful
    temperature: 0.7,
    max_tokens: 1500,
    response_format: { type: 'json_object' },
  });

  return completion.choices[0].message.content;
}

async function generateWithGemini(prompt) {
  if (!genAI) throw new Error('Gemini API key not configured');
  
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt + '\n\nRespond with valid JSON only.');
  const response = await result.response;
  return response.text();
}

async function generateWithOpenAI(prompt) {
  if (!openai) throw new Error('OpenAI API key not configured');
  
  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: 'Generate the content in JSON format.' },
    ],
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });

  return completion.choices[0].message.content;
}

// ============================================
// RESPONSE PARSING
// ============================================

function parseAIResponse(response) {
  try {
    const parsed = JSON.parse(response);
    
    return {
      content: parsed.content || '',
      hashtags: parsed.hashtags || [],
      image_description: parsed.image_description || '',
      predicted_engagement: parsed.predicted_engagement || {
        likes: 0,
        comments: 0,
        shares: 0,
        reach: 0,
      },
      alternative_versions: parsed.alternative_versions || [],
      best_time_to_post: parsed.best_time_to_post || '19:30',
      target_audience_match: parsed.target_audience_match || '75%',
    };
  } catch (error) {
    logger.error('Failed to parse AI response:', error);
    
    // Fallback: extract content from non-JSON response
    return {
      content: response,
      hashtags: [],
      image_description: '',
      predicted_engagement: { likes: 0, comments: 0, shares: 0, reach: 0 },
      alternative_versions: [],
      best_time_to_post: '19:30',
      target_audience_match: '50%',
    };
  }
}

// ============================================
// DAILY CONTENT GENERATION
// ============================================

export async function generateDailyContent(candidateData) {
  const topics = [
    {
      type: 'morning_greeting',
      topic: 'صباح الخير - رسالة صباحية للناخبين',
      time: '08:00',
    },
    {
      type: 'main_issue',
      topic: candidateData.issues[0] || 'الخدمات العامة',
      time: '14:00',
    },
    {
      type: 'community_engagement',
      topic: 'التواصل مع المجتمع والاستماع للمواطنين',
      time: '19:30',
    },
  ];

  const generatedContent = [];

  for (const { type, topic, time } of topics) {
    const content = await generateCampaignContent(candidateData, topic, {
      contentType: 'post',
      platform: 'facebook',
    });

    generatedContent.push({
      ...content,
      type,
      scheduled_time: time,
      status: candidateData.tier === 'free' ? 'locked' : 'ready',
    });
  }

  return generatedContent;
}

// ============================================
// SENTIMENT ANALYSIS
// ============================================

export async function analyzeSentiment(comment, language = 'ar') {
  const iraqiKeywords = {
    positive: {
      ar: ['زين', 'ممتاز', 'شكراً', 'الله يوفقك', 'ان شاء الله', 'خوش', 'يسلموو', 'صح', 'أحسنت', 'برافو'],
      ku: ['زۆر باشە', 'سوپاس', 'خۆش', 'درووست', 'بەرێز'],
    },
    negative: {
      ar: ['كذاب', 'فاشل', 'مو زين', 'ما نريدك', 'خاين', 'ضل بعيد', 'فاسد', 'لص'],
      ku: ['خراپ', 'نا', 'دروست نییە', 'ناشرین'],
    },
  };

  // Keyword-based initial check
  const positiveWords = iraqiKeywords.positive[language] || [];
  const negativeWords = iraqiKeywords.negative[language] || [];
  
  let keywordScore = 0;
  positiveWords.forEach(word => {
    if (comment.includes(word)) keywordScore += 1;
  });
  negativeWords.forEach(word => {
    if (comment.includes(word)) keywordScore -= 1;
  });

  // AI-powered deep analysis
  const analysisPrompt = `
  Analyze the sentiment of this ${language} political comment:
  
  Comment: "${comment}"
  
  Consider:
  - Iraqi cultural context
  - Political sensitivity
  - Sarcasm detection
  - Dialect-specific expressions
  
  Return JSON:
  {
    "sentiment": "positive|neutral|negative",
    "confidence": 0.0-1.0,
    "emotion": "supportive|questioning|angry|hopeful|disappointed|sarcastic",
    "requires_response": boolean,
    "suggested_response": "brief response in ${language}",
    "urgency": "low|medium|high|critical"
  }
  `;

  try {
    const aiAnalysis = await groq.chat.completions.create({
      messages: [{ role: 'user', content: analysisPrompt }],
      model: 'llama-3.1-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(aiAnalysis.choices[0].message.content);
    
    return {
      ...result,
      keyword_score: keywordScore,
    };
  } catch (error) {
    logger.error('Sentiment analysis failed:', error);
    
    // Fallback to keyword-based
    return {
      sentiment: keywordScore > 0 ? 'positive' : keywordScore < 0 ? 'negative' : 'neutral',
      confidence: 0.5,
      emotion: 'neutral',
      requires_response: Math.abs(keywordScore) > 2,
      suggested_response: '',
      urgency: 'low',
      keyword_score: keywordScore,
    };
  }
}

export default {
  generateCampaignContent,
  generateDailyContent,
  analyzeSentiment,
};
