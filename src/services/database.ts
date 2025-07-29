import { ChatMember, ConversationEntry } from '../types/chat';

const DB_NAME = 'AITeamChatDB';
const DB_VERSION = 5;
const MEMBERS_STORE = 'customMembers';
const CONVERSATIONS_STORE = 'conversations';
const MEMBER_PREFERENCES_STORE = 'memberPreferences';
const SYSTEM_MEMBERS_STORE = 'systemMembers';
const SETTINGS_STORE = 'settings';

class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create members store
        if (!db.objectStoreNames.contains(MEMBERS_STORE)) {
          const membersStore = db.createObjectStore(MEMBERS_STORE, { keyPath: 'id' });
          membersStore.createIndex('name', 'name', { unique: false });
        }

        // Create conversations store
        if (!db.objectStoreNames.contains(CONVERSATIONS_STORE)) {
          const conversationsStore = db.createObjectStore(CONVERSATIONS_STORE, { keyPath: 'id' });
          conversationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create member preferences store (for default member settings like hidden state)
        if (!db.objectStoreNames.contains(MEMBER_PREFERENCES_STORE)) {
          db.createObjectStore(MEMBER_PREFERENCES_STORE, { keyPath: 'memberId' });
        }

        // Create system members store (for system members with isSystem: true)
        if (!db.objectStoreNames.contains(SYSTEM_MEMBERS_STORE)) {
          const systemMembersStore = db.createObjectStore(SYSTEM_MEMBERS_STORE, { keyPath: 'id' });
          systemMembersStore.createIndex('name', 'name', { unique: false });
        }

        // Create settings store (for app settings like API key)
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  // Custom Members Methods
  async saveCustomMember(member: ChatMember): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBERS_STORE], 'readwrite');
      const store = transaction.objectStore(MEMBERS_STORE);
      const request = store.put(member);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getCustomMembers(): Promise<ChatMember[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBERS_STORE], 'readonly');
      const store = transaction.objectStore(MEMBERS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async deleteCustomMember(memberId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBERS_STORE], 'readwrite');
      const store = transaction.objectStore(MEMBERS_STORE);
      const request = store.delete(memberId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async updateCustomMember(member: ChatMember): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBERS_STORE], 'readwrite');
      const store = transaction.objectStore(MEMBERS_STORE);
      const request = store.put(member);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // Member Preferences Methods
  async saveMemberPreference(memberId: string, preferences: { isHidden?: boolean }): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBER_PREFERENCES_STORE], 'readwrite');
      const store = transaction.objectStore(MEMBER_PREFERENCES_STORE);
      const request = store.put({ memberId, ...preferences });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getMemberPreference(memberId: string): Promise<{ isHidden?: boolean } | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBER_PREFERENCES_STORE], 'readonly');
      const store = transaction.objectStore(MEMBER_PREFERENCES_STORE);
      const request = store.get(memberId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async getAllMemberPreferences(): Promise<Record<string, { isHidden?: boolean }>> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBER_PREFERENCES_STORE], 'readonly');
      const store = transaction.objectStore(MEMBER_PREFERENCES_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const preferences: Record<string, { isHidden?: boolean }> = {};
        const results = request.result || [];
        results.forEach((pref: any) => {
          preferences[pref.memberId] = { isHidden: pref.isHidden };
        });
        resolve(preferences);
      };
    });
  }

  // System Members Methods
  // These methods manage the systemMembers IndexedDB store which contains
  // all chat members with isSystem: true. This store is automatically
  // synchronized on app startup to ensure UI reflects current system member definitions.
  async saveSystemMembers(members: ChatMember[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYSTEM_MEMBERS_STORE], 'readwrite');
      const store = transaction.objectStore(SYSTEM_MEMBERS_STORE);

      // Clear existing system members first
      const clearRequest = store.clear();

      clearRequest.onerror = () => reject(clearRequest.error);
      clearRequest.onsuccess = () => {
        // Add all system members
        let completed = 0;
        const total = members.length;

        if (total === 0) {
          resolve();
          return;
        }

        const onComplete = () => {
          completed++;
          if (completed === total) resolve();
        };

        members.forEach(member => {
          const request = store.add(member);
          request.onerror = () => reject(request.error);
          request.onsuccess = onComplete;
        });
      };
    });
  }

  async getSystemMembers(): Promise<ChatMember[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYSTEM_MEMBERS_STORE], 'readonly');
      const store = transaction.objectStore(SYSTEM_MEMBERS_STORE);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async updateSystemMember(member: ChatMember): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYSTEM_MEMBERS_STORE], 'readwrite');
      const store = transaction.objectStore(SYSTEM_MEMBERS_STORE);
      const request = store.put(member);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSystemMemberById(memberId: string): Promise<ChatMember | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SYSTEM_MEMBERS_STORE], 'readonly');
      const store = transaction.objectStore(SYSTEM_MEMBERS_STORE);
      const request = store.get(memberId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // Conversations Methods
  async saveConversation(conversation: ConversationEntry): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONVERSATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const request = store.put(conversation);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getConversations(): Promise<ConversationEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONVERSATIONS_STORE], 'readonly');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Sort by timestamp descending (newest first)
        const conversations = (request.result || []).sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(conversations);
      };
    });
  }

  async deleteConversation(conversationId: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CONVERSATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(CONVERSATIONS_STORE);
      const request = store.delete(conversationId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MEMBERS_STORE, CONVERSATIONS_STORE, SYSTEM_MEMBERS_STORE], 'readwrite');

      const membersStore = transaction.objectStore(MEMBERS_STORE);
      const conversationsStore = transaction.objectStore(CONVERSATIONS_STORE);
      const systemMembersStore = transaction.objectStore(SYSTEM_MEMBERS_STORE);

      const clearMembers = membersStore.clear();
      const clearConversations = conversationsStore.clear();
      const clearSystemMembers = systemMembersStore.clear();

      let completed = 0;
      const onComplete = () => {
        completed++;
        if (completed === 3) resolve();
      };

      clearMembers.onerror = () => reject(clearMembers.error);
      clearConversations.onerror = () => reject(clearConversations.error);
      clearSystemMembers.onerror = () => reject(clearSystemMembers.error);

      clearMembers.onsuccess = onComplete;
      clearConversations.onsuccess = onComplete;
      clearSystemMembers.onsuccess = onComplete;
    });
  }

  // Settings Methods
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.put({ key, value });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readonly');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result?.value || null);
    });
  }

  async deleteSetting(key: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([SETTINGS_STORE], 'readwrite');
      const store = transaction.objectStore(SETTINGS_STORE);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Create a singleton instance
export const dbService = new DatabaseService();
