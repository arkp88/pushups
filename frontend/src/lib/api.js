import { supabase } from './supabase';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Global callback for backend wake-up detection
let onBackendWakingCallback = null;
let serverHasResponded = false; // Track if we've received any successful response

export function setBackendWakingCallback(callback) {
  onBackendWakingCallback = callback;
  // Reset the flag when callback is set (on app initialization)
  serverHasResponded = false;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Not authenticated');
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// Optional auth headers - returns headers without throwing if no session
async function getOptionalAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
}

// Check if user is authenticated
async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

// frontend/src/lib/api.js

async function fetchWithWakeDetection(url, options = {}) {
  let wakeTimer = null;

  // 1. Determine if this is a "light" request (GET)
  const isGetRequest = !options.method || options.method.toUpperCase() === 'GET';

  // 2. Check if we're on localhost (wake detection only needed for deployed backend)
  const isLocalhost = API_URL.includes('localhost') || API_URL.includes('127.0.0.1');

  // 3. PROACTIVE: Only start the timer if:
  //    - NOT on localhost (wake detection is only for Render free tier)
  //    - The server hasn't successfully responded yet this session
  //    - AND it's a GET request (avoids false positives on uploads)
  if (onBackendWakingCallback && !serverHasResponded && isGetRequest && !isLocalhost) {
    wakeTimer = setTimeout(() => {
      onBackendWakingCallback(true);
    }, 8000); // Show banner if first request takes > 8 seconds (Render cold start)
  }

  try {
    const response = await fetch(url, options);

    // 4. Clear the timer immediately when ANY response arrives
    if (wakeTimer) clearTimeout(wakeTimer);

    // 5. Mark server as "hot" immediately.
    // This prevents the timer from ever starting for future requests.
    serverHasResponded = true;

    // 6. Hide the banner immediately because we have a response (only if not localhost)
    if (onBackendWakingCallback && !isLocalhost) {
      onBackendWakingCallback(false);
    }

    return response;
  } catch (error) {
    if (wakeTimer) clearTimeout(wakeTimer);
    if (onBackendWakingCallback) onBackendWakingCallback(false);
    throw error;
  }
}

export const api = {
  async uploadTSV(file, setName, description, tags = '') {
    const { data: { session } } = await supabase.auth.getSession();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('set_name', setName);
    formData.append('description', description);
    formData.append('tags', tags);

    try {
      const response = await fetchWithWakeDetection(`${API_URL}/api/upload-tsv`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        // Handle specific HTTP error codes
        if (response.status === 413) {
          throw new Error('File is too large. Maximum file size is 16MB.');
        }

        // Try to parse JSON error, but handle non-JSON responses
        try {
          const error = await response.json();
          throw new Error(error.error || error.message || 'Upload failed');
        } catch (jsonError) {
          // If JSON parsing fails, get text response
          const textError = await response.text();
          throw new Error(textError || `Upload failed with status ${response.status}`);
        }
      }

      return response.json();
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server. The file might be too large, or the server may be unavailable.');
      }
      throw error;
    }
  },

  async getQuestionSets() {
    const authenticated = await isAuthenticated();
    const endpoint = authenticated ? '/api/question-sets' : '/api/public/question-sets';
    const headers = await getOptionalAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch question sets');
    return response.json();
  },

  async getQuestions(setId) {
    const authenticated = await isAuthenticated();
    const endpoint = authenticated
      ? `/api/question-sets/${setId}/questions`
      : `/api/public/question-sets/${setId}/questions`;
    const headers = await getOptionalAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  },

  async updateProgress(questionId, attempted, correct) {
    const headers = await getAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}/api/questions/${questionId}/progress`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ attempted, correct }),
    });
    if (!response.ok) throw new Error('Failed to update progress');
    return response.json();
  },

  async markMissed(questionId) {
    const headers = await getAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}/api/questions/${questionId}/mark-missed`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to mark as missed');
    return response.json();
  },

  async unmarkMissed(questionId) {
    const headers = await getAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}/api/questions/${questionId}/unmark-missed`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to unmark missed');
    return response.json();
  },

  async getMissedQuestions() {
    const headers = await getAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}/api/missed-questions`, { headers });
    if (!response.ok) throw new Error('Failed to fetch missed questions');
    return response.json();
  },

  async getStats() {
    const headers = await getAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}/api/stats`, { headers });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getMixedQuestions(filter = 'all') {
    const authenticated = await isAuthenticated();
    const endpoint = authenticated
      ? `/api/questions/mixed?filter=${filter}`
      : `/api/public/questions/mixed?filter=${filter}`;
    const headers = await getOptionalAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}${endpoint}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch mixed questions');
    return response.json();
  },

  async markSetOpened(setId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/question-sets/${setId}/mark-opened`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to mark set as opened');
    return response.json();
  },

  async deleteQuestionSet(setId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/question-sets/${setId}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete question set');
    }
    return response.json();
  },
  
  async toggleBookmark(questionId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/questions/${questionId}/bookmark`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to toggle bookmark');
    return response.json();
  },
  
  // --- GOOGLE DRIVE METHODS (NEW) ---
  async listDriveFiles(folderId) {
    const headers = await getAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}/api/drive/files?folderId=${folderId}`, { headers });
    if (!response.ok) throw new Error('Failed to list Drive files');
    return response.json();
  },

  async listDriveFilesRecursive(folderId) {
    const headers = await getAuthHeaders();

    // Create an AbortController with 25s timeout (less than backend's 30s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetchWithWakeDetection(`${API_URL}/api/drive/files/recursive?folderId=${folderId}`, {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to list Drive files recursively');
      }
      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out - folder may be too large. Try selecting a smaller subfolder.');
      }
      throw error;
    }
  },

async renameSet(setId, newName) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/question-sets/${setId}/rename`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ name: newName }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to rename set');
    }
    return response.json();
  },

  async importDriveFile(fileId, fileName, tags = '', setName = '') {
    const headers = await getAuthHeaders();
    const response = await fetchWithWakeDetection(`${API_URL}/api/drive/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fileId, fileName, tags, setName }),
    });
    if (!response.ok) throw new Error('Failed to import file');
    return response.json();
  }
};