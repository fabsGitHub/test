import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import env from '@/config/env';

// Replace with your actual DeepL API key

const DEEPL_API_KEY = env.deepl.apiKey;
const DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate';

// Cache structure to store translations
interface TranslationCache {
  [key: string]: {
    [targetLang: string]: string;
  };
}

interface TranslationResponse {
  translations: {
    detected_source_language: string;
    text: string;
  }[];
}

const translateText = async (text: string, targetLang: string, sourceLang: string = 'EN'): Promise<string> => {
  try {
    if (!DEEPL_API_KEY) {
      throw new Error('DeepL API key is not configured');
    }

    const response = await axios.post<TranslationResponse>(
      DEEPL_API_URL,
      {
        text: [text],
        target_lang: targetLang.toUpperCase(),
        source_lang: sourceLang.toUpperCase(),
      },
      {
        headers: {
          'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.translations[0].text;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

// Cache management functions
async function loadCache(): Promise<TranslationCache> {
  try {
    const cache = await AsyncStorage.getItem('translationCache');
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    console.error('Error loading translation cache:', error);
    return {};
  }
}

async function saveToCache(text: string, targetLang: string, translation: string): Promise<void> {
  try {
    const cache = await loadCache();
    if (!cache[text]) {
      cache[text] = {};
    }
    cache[text][targetLang] = translation;
    await AsyncStorage.setItem('translationCache', JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving to translation cache:', error);
  }
}

// Batch translation function for multiple texts
export async function translateTexts(texts: string[], targetLang: string, sourceLang: string = 'EN'): Promise<string[]> {
  return Promise.all(texts.map(text => translateText(text, targetLang, sourceLang)));
}

// Function to clear translation cache if needed
export async function clearTranslationCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem('translationCache');
  } catch (error) {
    console.error('Error clearing translation cache:', error);
  }
}

const translationService = {
  translateText,
  translateTexts,
  clearTranslationCache,
  loadCache,
  saveToCache,
};

export default translationService; 