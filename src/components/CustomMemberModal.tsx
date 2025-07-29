import React, { useState } from 'react';
import { ChatMember } from '../types/chat';
import { generateMemberRole, generateMemberDescription, generateMemberStrengths } from '../services/api';

interface CustomMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMember: (member: ChatMember) => void;
}

export const CustomMemberModal: React.FC<CustomMemberModalProps> = ({
  isOpen,
  onClose,
  onCreateMember
}) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [description, setDescription] = useState('');
  const [avatar, setAvatar] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && prompt.trim()) {
      setIsGenerating(true);

      try {
        // Generate initials from name if avatar is empty
        const avatarValue = avatar.trim() || name.trim().split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

        // Generate missing fields using AI
        const finalRole = role.trim() || await generateMemberRole(name.trim(), prompt.trim());
        const finalDescription = description.trim() || await generateMemberDescription(name.trim(), finalRole, prompt.trim());
        const strengths = await generateMemberStrengths(prompt.trim());

        const newMember: ChatMember = {
          id: `custom-${Date.now()}`,
          name: name.trim(),
          role: finalRole,
          description: finalDescription,
          avatar: avatarValue,
          color,
          prompt: prompt.trim(),
          strengths
        };

        onCreateMember(newMember);
        resetForm();
        onClose();
      } catch (error) {
        console.error('Error generating member fields:', error);
        // Continue with provided values if generation fails
        const avatarValue = avatar.trim() || name.trim().split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

        const newMember: ChatMember = {
          id: `custom-${Date.now()}`,
          name: name.trim(),
          role: role.trim() || 'AI Assistant',
          description: description.trim() || 'An AI assistant ready to help with various tasks.',
          avatar: avatarValue,
          color,
          prompt: prompt.trim(),
          strengths: [
            'Provides thoughtful and comprehensive responses',
            'Adapts communication style to user needs',
            'Offers practical and actionable advice',
            'Maintains focus on problem-solving',
            'Delivers insights based on expertise'
          ]
        };

        onCreateMember(newMember);
        resetForm();
        onClose();
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const resetForm = () => {
    setName('');
    setRole('');
    setDescription('');
    setAvatar('');
    setColor('#6366f1');
    setPrompt('');
    setIsGenerating(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Member</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter member name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role (Optional)</label>
            <input
              id="role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g., Data Analyst, UX Designer (auto-generated if left blank)"
              disabled={isGenerating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe their expertise and how they approach problems (auto-generated if left blank)"
              disabled={isGenerating}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter the system prompt that defines how this member should behave and respond. This will guide their personality and expertise when participating in conversations."
              rows={4}
              required
              disabled={isGenerating}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="avatar">Avatar (Optional)</label>
              <input
                id="avatar"
                type="text"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="😊 or https://example.com/avatar.jpg (leave blank for initials)"
                disabled={isGenerating}
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isGenerating}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn" disabled={isGenerating}>
              Cancel
            </button>
            <button type="submit" className="create-btn" disabled={isGenerating}>
              {isGenerating ? 'Creating Member...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
