import { Language } from '../context/AppContext';

interface BlogPost {
  title: string;
  content: string;
}

type TranslationDictionary = {
  [key in Language]: {
    [key: string]: BlogPost;
  };
};

// Mock translations for blog posts
const blogTranslations: TranslationDictionary = {
  en: {
    '1': {
      title: 'Understanding ME/CFS: A Comprehensive Guide',
      content: 'Myalgic Encephalomyelitis/Chronic Fatigue Syndrome (ME/CFS) is a complex, chronic illness that affects multiple body systems. This comprehensive guide will help you understand the condition, its symptoms, and current research...',
    },
    '2': {
      title: 'My Journey with Long COVID',
      content: 'When I first contracted COVID-19 in early 2023, I never imagined the long-lasting impact it would have on my life. This is my personal account of dealing with Long COVID...',
    },
    '3': {
      title: 'Meditation and Mindfulness for ME/CFS Recovery',
      content: 'Exploring the powerful role of meditation and mindfulness in managing ME/CFS symptoms. Learn about different meditation techniques and the science behind them...',
    },
    '4': {
      title: 'Energy Management Techniques That Worked for Me',
      content: 'After years of trial and error with ME/CFS, I\'ve developed a personalized approach to energy management that has significantly improved my quality of life...',
    },
  },
  de: {
    '1': {
      title: 'ME/CFS verstehen: Ein umfassender Leitfaden',
      content: 'Myalgische Enzephalomyelitis/Chronisches Fatigue-Syndrom (ME/CFS) ist eine komplexe, chronische Erkrankung, die mehrere Körpersysteme betrifft. Dieser umfassende Leitfaden hilft Ihnen, die Erkrankung, ihre Symptome und aktuelle Forschung zu verstehen...',
    },
    '2': {
      title: 'Meine Reise mit Long COVID',
      content: 'Als ich Anfang 2023 an COVID-19 erkrankte, hätte ich mir nie die langanhaltenden Auswirkungen auf mein Leben vorstellen können. Dies ist mein persönlicher Bericht über den Umgang mit Long COVID...',
    },
    '3': {
      title: 'Meditation und Achtsamkeit für ME/CFS-Genesung',
      content: 'Erforschung der wichtigen Rolle von Meditation und Achtsamkeit bei der Bewältigung von ME/CFS-Symptomen. Lernen Sie verschiedene Meditationstechniken und die wissenschaftlichen Grundlagen kennen...',
    },
    '4': {
      title: 'Energiemanagement-Techniken, die mir geholfen haben',
      content: 'Nach Jahren des Ausprobierens mit ME/CFS habe ich einen personalisierten Ansatz zum Energiemanagement entwickelt, der meine Lebensqualität deutlich verbessert hat...',
    },
  },
};

export interface TranslatedBlogPost {
  title: string;
  content: string;
}

export function translateBlogPost(postId: string, language: Language): TranslatedBlogPost | null {
  return blogTranslations[language]?.[postId] || null;
}

// In a real application, this would be an API call to a translation service
export async function translateText(text: string, targetLanguage: Language): Promise<string> {
  // Mock implementation - in reality, this would call a translation API
  console.log(`Translating text to ${targetLanguage}...`);
  return text;
} 