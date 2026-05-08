
export const LOCALE_MAP: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  ur: 'ur-PK',
  pa: 'pa-IN',
  or: 'or-IN',
  as: 'as-IN'
};

export const getLocale = (code: string) => LOCALE_MAP[code] || code;

export const speakText = (text: string, langCode: string) => {
  if (!window.speechSynthesis) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const locale = getLocale(langCode);
  utterance.lang = locale;

  // Try to find a better voice for the requested locale
  const voices = window.speechSynthesis.getVoices();
  const bestVoice = voices.find(v => v.lang.startsWith(langCode) || v.lang === locale);
  
  if (bestVoice) {
    utterance.voice = bestVoice;
  }

  // Common Indian language synthesis can be slow, increase rate slightly for clarity
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  window.speechSynthesis.speak(utterance);
};
