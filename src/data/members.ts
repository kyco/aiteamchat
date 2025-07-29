import { ChatMember } from '../types/chat';
import { defaultMembersData } from './members/index';

// Since ChatMember now includes all properties, we can use the members directly
export const defaultMembers: ChatMember[] = defaultMembersData;
