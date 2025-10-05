import { useEffect, useState } from 'react';
import { Plus, Calendar, Send } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from '../store/languageStore';

export default function ContentPage() {
  const [content, setContent] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const response = await axios.get('/api/content');
      setContent(response.data.data);
    } catch (error) {
      console.error('Failed to fetch content:', error);
    }
  };

  const generateDailyContent = async () => {
    setIsGenerating(true);
    try {
      await axios.post('/api/content/generate-daily');
      toast.success('Content generated successfully!');
      fetchContent();
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const publishContent = async (id) => {
    try {
      await axios.post(`/api/content/${id}/publish`);
      toast.success('Content published!');
      fetchContent();
    } catch (error) {
      toast.error('Failed to publish content');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('content')}</h1>
        <button
          onClick={generateDailyContent}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          <Plus size={20} />
          {isGenerating ? 'Generating...' : t('generate_content')}
        </button>
      </div>

      <div className="grid gap-4">
        {content.map((item) => (
          <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-800 mb-3">{item.content}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.hashtags?.map((tag, i) => (
                    <span key={i} className="text-primary-600 text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>📊 {item.predicted_reach} reach</span>
                  <span>❤️ {item.predicted_engagement} likes</span>
                  <span>🤖 {item.ai_model}</span>
                </div>
              </div>

              <div className="flex gap-2 ms-4">
                {item.status === 'locked' ? (
                  <button className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg">
                    🔒 {t('locked_content')}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => publishContent(item.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Send size={16} />
                      {t('publish_now')}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                      <Calendar size={16} />
                      {t('schedule_post')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
