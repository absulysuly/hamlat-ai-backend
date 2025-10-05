import { useEffect, useState } from 'react';
import { TrendingUp, Users, Eye, Heart, Sparkles } from 'lucide-react';
import axios from 'axios';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useTranslation } from '../store/languageStore';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/candidate/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-white/70">
        <p>Failed to load dashboard data</p>
        <Button onClick={fetchDashboard} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  const stats = [
    {
      label: 'Campaign Reach',
      value: dashboardData.today_stats?.total_reach || 0,
      change: `+${dashboardData.today_stats?.followers_gained || 0}`,
      icon: Eye,
      color: 'secondary',
      glow: 'glow-secondary',
    },
    {
      label: 'Active Supporters',
      value: dashboardData.today_stats?.followers_end || 0,
      icon: Users,
      color: 'primary',
      glow: 'glow-primary',
    },
    {
      label: 'Public Engagement',
      value: dashboardData.today_stats?.total_likes + dashboardData.today_stats?.total_comments || 0,
      icon: Heart,
      color: 'accent',
      glow: 'glow-accent',
    },
    {
      label: 'Sentiment Score',
      value: `${Math.round((dashboardData.today_stats?.sentiment_score || 0) * 100)}%`,
      icon: TrendingUp,
      color: 'success',
      glow: 'glow-success',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark/95 to-dark/90 p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="text-center">
          <motion.h1
            className="text-4xl font-bold text-white mb-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Campaign Command Center
          </motion.h1>
          <motion.p
            className="text-white/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Real-time campaign metrics and AI-powered insights
          </motion.p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard
                className={`p-6 h-full ${stat.glow}`}
                hover={true}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-glass bg-${stat.color}/20`}>
                    <stat.icon className={`text-${stat.color}`} size={24} />
                  </div>
                  <Badge variant={stat.color} size="sm">
                    {stat.change && stat.change.startsWith('+') ? '↗' : '→'}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-white/70">{stat.label}</p>
                  <p className="text-3xl font-bold text-white">{stat.value}</p>
                  {stat.change && (
                    <p className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-success' : 'text-white/70'}`}>
                      {stat.change} today
                    </p>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* Subscription Alert */}
        {dashboardData.subscription.status === 'trial' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-6 border-warning/30 shadow-glow-warning">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="text-warning" size={24} />
                  <div>
                    <p className="text-warning font-medium">
                      Free Trial - {dashboardData.subscription.days_left} days remaining
                    </p>
                    <p className="text-white/70 text-sm">
                      Upgrade to unlock all features
                    </p>
                  </div>
                </div>
                <Button variant="warning">
                  Upgrade Now
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Recent Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">
                Recent AI-Generated Content
              </h2>
              <Button variant="glass" size="sm">
                View All
              </Button>
            </div>

            <div className="space-y-4">
              {dashboardData.recent_content.slice(0, 3).map((content, index) => (
                <motion.div
                  key={content.id}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <p className="text-white/90 mb-3">
                    {content.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      📊 {content.predicted_reach} reach
                    </span>
                    <span className="flex items-center gap-1">
                      ❤️ {content.predicted_engagement} engagement
                    </span>
                    <Badge variant={content.status === 'locked' ? 'warning' : 'success'} size="sm">
                      {content.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Unread Mentions */}
        {dashboardData.unread_mentions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <GlassCard className="p-6 border-accent/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-accent rounded-full animate-pulse"></div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {dashboardData.unread_mentions} New Mentions
                    </h3>
                    <p className="text-white/70 text-sm">
                      People are talking about your campaign
                    </p>
                  </div>
                </div>
                <Button variant="accent">
                  View Mentions
                </Button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
