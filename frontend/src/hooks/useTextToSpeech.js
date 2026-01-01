import { useState, useRef, useCallback } from 'react';

/**
 * Hook for text-to-speech functionality
 * @param {Function} setAppNotification - Callback to show notifications
 * @returns {Object} Text-to-speech state and controls
 */
export function useTextToSpeech(setAppNotification = () => {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Track if we've added voiceschanged listener to prevent memory leak
  const voicesListenerAddedRef = useRef(false);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Speak the given text
   * @param {Event} e - Click event (to stop propagation)
   * @param {string} textToSpeak - The text to speak
   */
  const speakText = useCallback((e, textToSpeak) => {
    if (e) e.stopPropagation(); // Prevent card flip

    if (!window.speechSynthesis) {
      setAppNotification('Text-to-speech is not supported in your browser.', true);
      return;
    }

    // If already speaking, stop it
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip HTML tags for speech
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = textToSpeak;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';

    const utterance = new SpeechSynthesisUtterance(plainText);

    // Function to set voice once voices are loaded
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();

      // Prefer natural-sounding voices (Google, Microsoft, Apple Enhanced)
      const preferredVoice = voices.find(voice =>
        voice.name.includes('Google') ||
        voice.name.includes('Enhanced') ||
        voice.name.includes('Premium') ||
        (voice.name.includes('Samantha') && voice.lang === 'en-US')
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    };

    // Try to set voice immediately
    setVoice();

    // Only add voiceschanged listener once to prevent memory leak
    if (window.speechSynthesis.getVoices().length === 0 && !voicesListenerAddedRef.current) {
      voicesListenerAddedRef.current = true;
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        setVoice();
        voicesListenerAddedRef.current = false;
      }, { once: true });
    }

    // Slower, more natural rate
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      setAppNotification('Speech error occurred.', true);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSpeaking, setAppNotification]);

  return {
    isSpeaking,
    speakText,
    stopSpeaking,
  };
}
