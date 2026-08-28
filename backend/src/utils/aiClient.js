const axios = require('axios');

let aiServiceUrl = process.env.AI_SERVICE_URL || 'https://student-attendance-system-1-p2tq.onrender.com';


const aiClient = axios.create({
  baseURL: aiServiceUrl,
  timeout: 15000, // 15 seconds timeout
});

// Helper to safely parse and translate Axios errors into readable messages
const handleAiError = (error, context) => {
  let userMessage = 'AI Service connection failed';
  let technicalDetails = error.message;

  if (error.code === 'ECONNREFUSED') {
    userMessage = 'AI Service unreachable (Connection Refused). Ensure the Python service is running and accessible.';
  } else if (error.code === 'ETIMEDOUT' || error.message.includes('timeout')) {
    userMessage = 'AI Service request timed out. The model might be cold starting on Render.';
  } else if (error.response) {
    // The request was made and the server responded with a status code outside of the 2xx range
    userMessage = error.response.data?.message || `AI Service returned an error: ${error.response.status}`;
    technicalDetails = JSON.stringify(error.response.data);
  } else if (error.request) {
    // The request was made but no response was received
    userMessage = 'AI Service did not respond. Check deployment health and port bindings.';
  }

  console.error(`[AI CLIENT ERROR] Context: ${context}`);
  console.error(`[AI CLIENT ERROR] Message: ${technicalDetails}`);

  return {
    success: false,
    message: userMessage,
    isTimeout: error.code === 'ETIMEDOUT' || error.message.includes('timeout')
  };
};

/**
 * Checks AI service health before heavy processing
 */
const pingAiService = async () => {
  try {
    const res = await aiClient.get('/api/health', { timeout: 5000 });
    return res.data && res.data.success;
  } catch (err) {
    console.error('[AI CLIENT WARNING] Ping failed:', err.message);
    return false;
  }
};

/**
 * Sends a POST request to the AI service with retry logic
 */
const postToAi = async (endpoint, payload, maxRetries = 2) => {
  let attempt = 0;
  
  // Removed pingAiService() here to avoid doubling network roundtrips
  while (attempt < maxRetries) {
    try {
      console.log(`[AI CLIENT] Sending POST to ${endpoint} (Attempt ${attempt + 1}/${maxRetries})`);
      const response = await aiClient.post(endpoint, payload);
      return response.data;
    } catch (error) {
      attempt++;
      const parsedError = handleAiError(error, `POST ${endpoint}`);
      
      // If it's a 4xx error (like bad image), don't retry.
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw parsedError;
      }
      
      if (attempt >= maxRetries) {
        throw parsedError;
      }
      
      // Wait 2 seconds before retrying network failures
      console.log(`[AI CLIENT] Retrying in 2000ms...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

module.exports = { aiClient, handleAiError, pingAiService, postToAi };
