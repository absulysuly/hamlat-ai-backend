import { useEffect, useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from '../store/languageStore';

export default function MentionsPage() {
  const [mentions, setMentions] = useState([]);
  const { t } = useTranslation();

  useEffect(() => {
    fetchMentions();
  }, []);

  const fetchMentions = async () => {
    try {
      const response = await axios.get('/api/social/mentions?limit=50');
      setMentions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch mentions:', error);
    }
  };

  const getSentimentIcon = (sentiment) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="text-green-500" size={20} />;
      case 'negative': return <ThumbsDown className="text-red-500" size={20} />;
      default: return <Minus className="text-gray-500" size={20} />;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('mentions')}</h1>

      <div className="space-y-4">
        {mentions.map((mention) => (
          <div key={mention.id} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div>{getSentimentIcon(mention.sentiment)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">{mention.author_name}</span>
                  <span className="text-sm text-gray-500">• {mention.platform}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(mention.detected_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-800">{mention.content}</p>
                {mention.suggested_response && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Suggested Response:</p>
                    <p className="text-gray-800">{mention.suggested_response}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
