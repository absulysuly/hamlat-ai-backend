import { useState, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { useLanguageStore } from '../store/languageStore';

export default function VoiceCommand() {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const { user } = useAuthStore();
  const { language } = useLanguageStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.voice_enabled) return;

    // Initialize Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      
      const langMap = {
        ar: 'ar-IQ',
        ku: 'ku-IQ',
        en: 'en-US',
      };
      
      recognitionInstance.lang = langMap[language] || 'ar-IQ';
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;

      recognitionInstance.onresult = async (event) => {
        const transcript = event.results[0][0].transcript;
        console.log('Voice command:', transcript);
        
        try {
          const response = await axios.post('/api/voice/command', {
            spoken_text: transcript,
            language,
          });

          const { intent, result, natural_response } = response.data.data;
          
          // Show confirmation
          toast.success(natural_response || 'Command executed');

          // Execute action
          executeAction(result);
        } catch (error) {
          console.error('Voice command error:', error);
          toast.error('Could not process command');
        }
        
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [language, user]);

  const executeAction = (result) => {
    switch (result.type) {
      case 'navigation':
        navigate(`/${result.page}`);
        break;
      case 'modal':
        // Open modal (implement based on your modal system)
        break;
      case 'display_metric':
        // Show metric (implement based on your UI)
        break;
      default:
        console.log('Unknown action:', result);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      toast.error('Voice commands not supported in this browser');
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  if (!user?.voice_enabled) return null;

  return (
    <button
      onClick={toggleListening}
      className={`fixed bottom-6 end-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${
        isListening
          ? 'bg-red-500 voice-active'
          : 'bg-primary-600 hover:bg-primary-700'
      }`}
      title={isListening ? 'Stop listening' : 'Start voice command'}
    >
      {isListening ? (
        <MicOff className="text-white" size={24} />
      ) : (
        <Mic className="text-white" size={24} />
      )}
    </button>
  );
}
