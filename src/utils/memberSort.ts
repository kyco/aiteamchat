import { ChatMember } from '../types/chat';
import { defaultMembersData } from '../data/members/index';

/**
 * Consistent sorting function for members across all screens.
 * Sorting order:
 * 1. Default/System members in the exact order they appear in defaultMembersData
 * 2. Custom members (by name alphabetically)
 */
export const sortMembers = (members: ChatMember[]): ChatMember[] => {
  // Create a map of member ID to their position in the default array
  const defaultMemberOrder = new Map<string, number>();
  defaultMembersData.forEach((member, index) => {
    defaultMemberOrder.set(member.id, index);
  });

  return [...members].sort((a, b) => {
    const aIsDefault = defaultMemberOrder.has(a.id);
    const bIsDefault = defaultMemberOrder.has(b.id);

    // If both are default members, sort by their position in defaultMembersData
    if (aIsDefault && bIsDefault) {
      return defaultMemberOrder.get(a.id)! - defaultMemberOrder.get(b.id)!;
    }

    // Default members come before custom members
    if (aIsDefault && !bIsDefault) return -1;
    if (!aIsDefault && bIsDefault) return 1;

    // Both are custom members, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });
};
