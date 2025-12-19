import { supabase } from './supabase';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Global callback for backend wake-up detection
let onBackendWakingCallback = null;

export function setBackendWakingCallback(callback) {
  onBackendWakingCallback = callback;
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

// Wrapper to detect slow requests (backend waking up)
async function fetchWithWakeDetection(url, options = {}) {
  let wakeNotificationShown = false;

  // Set a timer to show "waking up" message after 3 seconds
  const wakeTimer = setTimeout(() => {
    if (onBackendWakingCallback) {
      wakeNotificationShown = true;
      onBackendWakingCallback(true);
    }
  }, 3000);

  try {
    const response = await fetch(url, options);
    clearTimeout(wakeTimer);

    // Clear wake notification if it was shown
    if (wakeNotificationShown && onBackendWakingCallback) {
      onBackendWakingCallback(false);
    }

    return response;
  } catch (error) {
    clearTimeout(wakeTimer);
    if (wakeNotificationShown && onBackendWakingCallback) {
      onBackendWakingCallback(false);
    }
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
      const response = await fetch(`${API_URL}/api/upload-tsv`, {
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
    const response = await fetch(`${API_URL}/api/drive/files?folderId=${folderId}`, { headers });
    if (!response.ok) throw new Error('Failed to list Drive files');
    return response.json();
  },

  async listDriveFilesRecursive(folderId) {
    const headers = await getAuthHeaders();

    // Create an AbortController with 25s timeout (less than backend's 30s)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch(`${API_URL}/api/drive/files/recursive?folderId=${folderId}`, {
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
    const response = await fetch(`${API_URL}/api/drive/import`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fileId, fileName, tags, setName }),
    });
    if (!response.ok) throw new Error('Failed to import file');
    return response.json();
  }
};