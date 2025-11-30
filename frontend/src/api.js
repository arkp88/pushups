import { supabase } from './supabaseClient';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

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

export const api = {
  async uploadTSV(file, setName, description, tags = '') {
    const { data: { session } } = await supabase.auth.getSession();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('set_name', setName);
    formData.append('description', description);
    formData.append('tags', tags);

    const response = await fetch(`${API_URL}/api/upload-tsv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  async getQuestionSets() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/question-sets`, { headers });
    if (!response.ok) throw new Error('Failed to fetch question sets');
    return response.json();
  },

  async getQuestions(setId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/question-sets/${setId}/questions`, { headers });
    if (!response.ok) throw new Error('Failed to fetch questions');
    return response.json();
  },

  async updateProgress(questionId, attempted, correct) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/questions/${questionId}/progress`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ attempted, correct }),
    });
    if (!response.ok) throw new Error('Failed to update progress');
    return response.json();
  },

  async markMissed(questionId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/questions/${questionId}/mark-missed`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to mark as missed');
    return response.json();
  },

  async unmarkMissed(questionId) {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/questions/${questionId}/unmark-missed`, {
      method: 'POST',
      headers,
    });
    if (!response.ok) throw new Error('Failed to unmark missed');
    return response.json();
  },

  async getMissedQuestions() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/missed-questions`, { headers });
    if (!response.ok) throw new Error('Failed to fetch missed questions');
    return response.json();
  },

  async getStats() {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/stats`, { headers });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
  },

  async getMixedQuestions(filter = 'all') {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/questions/mixed?filter=${filter}`, { headers });
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
};
