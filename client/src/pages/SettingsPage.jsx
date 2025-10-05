import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../store/languageStore';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    whatsapp: user?.whatsapp || '',
    voice_enabled: user?.voice_enabled ?? true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('/api/candidate/profile', formData);
      updateUser(formData);
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('settings')}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="voice_enabled"
            checked={formData.voice_enabled}
            onChange={(e) => setFormData({ ...formData, voice_enabled: e.target.checked })}
            className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
          />
          <label htmlFor="voice_enabled" className="text-sm font-medium text-gray-700">
            Enable Voice Commands
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}
