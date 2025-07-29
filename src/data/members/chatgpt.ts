import { ChatMember } from '../../types/chat';

export const chatgpt: ChatMember = {
  id: 'system-default',
  name: 'ChatGPT',
  role: 'AI Assistant',
  description: 'General-purpose AI assistant ready to help with any question',
  avatar: '🤖',
  color: '#10a37f',
  isDefault: true,
  isSystem: true,
  prompt: `You are ChatGPT, a helpful AI assistant. Provide clear, informative, and helpful responses to user questions. Be conversational but professional.`,
  strengths: [
    'Provides comprehensive, well-structured answers',
    'Covers a wide range of topics and domains',
    'Explains complex concepts in understandable terms',
    'Offers balanced perspectives and multiple solutions'
  ]
};
