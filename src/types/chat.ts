export interface ChatMember {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string; // Can be emoji/text or URL to image
  color: string;
  isDefault?: boolean;
  isHidden?: boolean;
  isSystem?: boolean;
  prompt?: string;
  strengths?: string[];
}

export interface MemberResponse {
  memberId: string;
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface MessageExchange {
  id: string;
  userMessage: string;
  responses: MemberResponse[];
  primarySummary?: string;
  summaryPhase?: 'waiting-for-members' | 'generating-summary' | 'completed';
  timestamp: Date;
  askedMembers: ChatMember[]; // Track which members were asked for this exchange
}

export interface ConversationEntry {
  id: string;
  title?: string; // Auto-generated from first message
  exchanges: MessageExchange[];
  timestamp: Date; // Last updated
  threadId?: string; // Links related conversations together
}

export interface ChatState {
  conversations: ConversationEntry[];
  selectedMembers: ChatMember[];
  activeTab: string; // 'primary' or memberId
  customMembers: ChatMember[];
}
