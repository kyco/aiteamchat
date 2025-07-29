import React, { useState, useEffect } from 'react';
import { apiKeyService } from '../services/apiKeyService';

interface SettingsProps {
  onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [originalApiKey, setOriginalApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load the current user API key when component mounts
    const loadApiKey = async () => {
      try {
        const userApiKey = await apiKeyService.getUserApiKey();
        if (userApiKey) {
          setApiKey(userApiKey);
          setOriginalApiKey(userApiKey);
        }
      } catch (err) {
        console.error('Failed to load API key:', err);
      }
    };

    loadApiKey();
  }, []);

  const handleSave = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (apiKey.trim() === '') {
        // Clear the API key if empty
        await apiKeyService.clearApiKey();
      } else {
        // Save the API key
        await apiKeyService.saveApiKey(apiKey);
      }

      setOriginalApiKey(apiKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError('Failed to save API key');
      console.error('Failed to save API key:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const validateApiKey = (key: string): boolean => {
    // Basic OpenAI API key validation
    return key.startsWith('sk-') && key.length > 20;
  };

  const isValidKey = apiKey.trim() === '' || validateApiKey(apiKey);
  const hasChanges = apiKey !== originalApiKey;

  return (
    <div className="member-management">
      <div className="member-management-header">
        <h3>Settings</h3>
        <button className="member-info-close" onClick={onClose}>×</button>
      </div>

      <div className="member-management-content">
        <div className="setting-section">
          <h4 className="setting-label">OpenAI API Key</h4>
          <p className="setting-description">
            Enter your OpenAI API key to enable AI responses. If left empty, the app will use the default development key (if available).
          </p>

          <div className="api-key-input-container">
            <input
              id="api-key-input"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setError(null);
                setIsSaved(false);
              }}
              placeholder="sk-..."
              className={`api-key-input ${!isValidKey ? 'invalid' : ''}`}
              disabled={isLoading}
            />

            <button
              onClick={handleSave}
              disabled={isLoading || !hasChanges || !isValidKey}
              className="save-api-key-btn"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>

          {isSaved && (
            <div className="success-message">
              ✓ API key saved successfully
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {hasChanges && !error && !isSaved && (
            <div className="info-message">
              You have unsaved changes
            </div>
          )}          {!isValidKey && apiKey.trim() !== '' && (
            <div className="validation-error">
              Please enter a valid OpenAI API key (should start with "sk-")
            </div>
          )}

          <div className="setting-info">
            <p>
              <strong>How to get an API key:</strong>
            </p>
            <ol>
              <li>Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">OpenAI API Keys</a></li>
              <li>Sign in to your OpenAI account</li>
              <li>Click "Create new secret key"</li>
              <li>Copy the key and paste it here</li>
            </ol>

            <p className="privacy-note">
              <strong>Privacy:</strong> Your API key is stored locally in your browser and never sent to any server except OpenAI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
