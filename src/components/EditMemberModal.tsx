import React, { useState, useEffect } from 'react';
import { ChatMember } from '../types/chat';

interface EditMemberModalProps {
  isOpen: boolean;
  member: ChatMember | null;
  onClose: () => void;
  onSave: (member: ChatMember) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    description: '',
    avatar: '',
    color: '#10a37f',
    prompt: '',
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        role: member.role,
        description: member.description,
        avatar: member.avatar,
        color: member.color,
        prompt: member.prompt || '',
      });
    }
  }, [member]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    // Generate initials from name if avatar is empty
    const avatarValue = formData.avatar.trim() || formData.name.trim().split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);

    const updatedMember: ChatMember = {
      ...member,
      ...formData,
      avatar: avatarValue,
    };

    onSave(updatedMember);
    onClose();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (!isOpen || !member) return null;

  const isSystemMember = member.isSystem;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit {isSystemMember ? 'System' : member.isDefault ? 'Default' : 'Custom'} Member</h2>
          {/* <button className="modal-close" onClick={onClose}>×</button> */}
        </div>

        <form onSubmit={handleSubmit} className="member-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSystemMember}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Role (Optional)</label>
            <input
              type="text"
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isSystemMember}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              disabled={isSystemMember}
            />
          </div>

          <div className="form-group">
            <label htmlFor="prompt">Prompt</label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              placeholder="Enter the AI prompt that defines how this member should behave and respond. This will guide their personality and expertise when participating in conversations."
              rows={4}
              required
              disabled={isSystemMember}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="avatar">Avatar (Optional)</label>
              <input
                type="text"
                id="avatar"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="😊 or https://example.com/avatar.jpg (leave blank for initials)"
                disabled={isSystemMember}
              />
            </div>

            <div className="form-group">
              <label htmlFor="color">Color</label>
              <input
                type="color"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                required
                disabled={isSystemMember}
              />
            </div>
          </div>

          {isSystemMember && (
            <p className="form-note">
              Note: System members cannot be edited as they are built-in experts.
            </p>
          )}

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSystemMember}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
