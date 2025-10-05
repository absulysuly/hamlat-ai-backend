import { Link } from 'react-router-dom';
import { Sparkles, Globe, Mic, BarChart3, Zap, Shield } from 'lucide-react';
import { useTranslation } from '../store/languageStore';
import LanguageSelector from '../components/LanguageSelector';

const features = [
  { icon: Sparkles, titleKey: 'smart_content', descKey: 'smart_content_desc' },
  { icon: Globe, titleKey: 'multi_language', descKey: 'multi_language_desc' },
  { icon: Mic, titleKey: 'voice_commands', descKey: 'voice_commands_desc' },
  { icon: BarChart3, titleKey: 'advanced_analytics', descKey: 'advanced_analytics_desc' },
  { icon: Zap, titleKey: 'auto_publish', descKey: 'auto_publish_desc' },
  { icon: Shield, titleKey: 'fully_secure', descKey: 'fully_secure_desc' },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <header className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-600">HamlatAI</h1>
        <LanguageSelector />
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('election_campaign_ai')}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            {t('comprehensive_platform')}
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors text-lg"
            >
              {t('start_free_trial')}
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-lg"
            >
              {t('login')}
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <feature.icon className="text-primary-600 mb-4" size={32} />
              <h3 className="text-xl font-semibold mb-2">{t(feature.titleKey)}</h3>
              <p className="text-gray-600">{t(feature.descKey)}</p>
            </div>
          ))}
        </div>

        {/* Pricing Preview */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('pricing_plans')}
          </h2>
          <p className="text-gray-600 mb-8">
            {t('start_free_14_days')}
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: t('basic'), price: '$2,500', features: ['3 posts/day', 'Analytics', 'Auto-responses'] },
              { name: t('professional'), price: '$4,000', features: ['All Basic', 'AI Videos', 'Crisis Mgmt'], popular: true },
              { name: t('premium'), price: '$7,000', features: ['All Pro', 'Dedicated Support', 'Ad Management'] },
            ].map((plan, index) => (
              <div
                key={index}
                className={`bg-white p-6 rounded-xl ${
                  plan.popular ? 'ring-2 ring-primary-600 shadow-lg' : 'shadow-sm'
                }`}
              >
                {plan.popular && (
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm">
                    {t('most_popular')}
                  </span>
                )}
                <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
                <p className="text-4xl font-bold text-primary-600 my-4">{plan.price}</p>
                <ul className="space-y-2 text-start">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
