import React, { useState, useEffect } from 'react';
import { ChatMember, ChatState, ConversationEntry, MessageExchange, MemberResponse } from './types/chat';
import { defaultMembers } from './data/members';
import { openaiParallelApiCalls, generatePrimarySummary } from './services/api';
import { dbService } from './services/database';
import { MemberSelector } from './components/MemberSelector';
import { ChatInterface } from './components/ChatInterface';
import { ConversationHistory } from './components/ConversationHistory';
import { MessageInput } from './components/MessageInput';
import { CustomMemberModal } from './components/CustomMemberModal';
import { MemberInfoDisplay } from './components/MemberInfoDisplay';
import { EditMemberModal } from './components/EditMemberModal';
import { MemberManagement } from './components/MemberManagement';
import { AddMembers } from './components/AddMembers';
import { Settings } from './components/Settings';
import { sortMembers } from './utils/memberSort';
import './App.css';

function App() {
  const [chatState, setChatState] = useState<ChatState>({
    conversations: [],
    selectedMembers: [defaultMembers[0]], // Start with ChatGPT selected
    activeTab: defaultMembers[0].id,
    customMembers: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<ChatMember | null>(null);
  const [showMemberInfo, setShowMemberInfo] = useState<ChatMember | null>(null);
  const [showMemberManagement, setShowMemberManagement] = useState(false);
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [memberInfoOpenedFromManagement, setMemberInfoOpenedFromManagement] = useState(false);
  const [allMembers, setAllMembers] = useState<ChatMember[]>(sortMembers(defaultMembers));
  const [userMembers, setUserMembers] = useState<ChatMember[]>(sortMembers(defaultMembers.filter(member => member.isDefault))); // Start with all default members
  const [selectedConversation, setSelectedConversation] = useState<ConversationEntry | null>(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);

  // Initialize database and load persisted data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await dbService.init();
        setIsDbInitialized(true);

        // Sync system members first - update IndexedDB with current system members
        // This ensures that any changes to system member details (like name changes) are reflected
        const systemMembers = defaultMembers.filter(member => member.isSystem);
        await dbService.saveSystemMembers(systemMembers);
        console.log('System members synchronized with IndexedDB');

        // Load custom members
        const customMembers = await dbService.getCustomMembers();

        // Load member preferences (for hidden state)
        const memberPreferences = await dbService.getAllMemberPreferences();

        // Check if this is a first-time user
        const isFirstTimeUser = await dbService.isFirstTimeUser();

        // Load user member IDs (which members the user has added to their list)
        const userMemberIds = await dbService.getUserMemberIds();

        // Load conversations
        const conversations = await dbService.getConversations();
        setChatState(prev => ({
          ...prev,
          conversations: conversations.map(conv => ({
            ...conv,
            timestamp: new Date(conv.timestamp), // Convert string back to Date
            exchanges: conv.exchanges?.map(exchange => ({
              ...exchange,
              timestamp: new Date(exchange.timestamp),
              responses: exchange.responses.map(resp => ({
                ...resp,
                timestamp: new Date(resp.timestamp)
              })),
              // Add backwards compatibility for askedMembers field
              askedMembers: exchange.askedMembers || []
            })) || []
          }))
        }));

        // Apply preferences to default members and combine with custom members
        // Custom members can override default members if they have the same ID
        const customMemberIds = new Set(customMembers.map(m => m.id));

        const allMembersWithPreferences = [
          // Only include default members that haven't been overridden by custom versions
          ...defaultMembers
            .filter(member => !customMemberIds.has(member.id))
            .map(member => ({
              ...member,
              isHidden: memberPreferences[member.id]?.isHidden || false
            })),
          // Include all custom members (including overridden default ones)
          ...customMembers.map(member => ({
            ...member,
            isHidden: memberPreferences[member.id]?.isHidden || false
          }))
        ];

        setAllMembers(sortMembers(allMembersWithPreferences));

        // Set user members - for first-time users, include all default members and save them to DB
        // For returning users, load from the saved user member IDs
        if (isFirstTimeUser) {
          const defaultMembersWithPreferences = defaultMembers.filter(member => member.isDefault).map(member => ({
            ...member,
            isHidden: memberPreferences[member.id]?.isHidden || false
          }));

          setUserMembers(sortMembers(defaultMembersWithPreferences));

          // Save the default members to the user members store for future loads
          for (const member of defaultMembersWithPreferences) {
            await dbService.addUserMember(member.id);
          }
        } else {
          // For returning users, construct user members from saved IDs
          const userMembersList: ChatMember[] = [];

          for (const memberId of userMemberIds) {
            // Check if it's a custom member first
            const customMember = customMembers.find(m => m.id === memberId);
            if (customMember) {
              userMembersList.push({
                ...customMember,
                isHidden: memberPreferences[memberId]?.isHidden || false
              });
            } else {
              // Check if it's a default/system member
              const defaultMember = defaultMembers.find(m => m.id === memberId);
              if (defaultMember) {
                userMembersList.push({
                  ...defaultMember,
                  isHidden: memberPreferences[memberId]?.isHidden || false
                });
              }
            }
          }

          setUserMembers(sortMembers(userMembersList));
        }

        console.log('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsDbInitialized(true); // Continue without persistence
      }
    };

    initializeApp();
  }, []);

  const handleCreateCustomMember = async (newMember: ChatMember) => {
    try {
      // Add to allMembers state
      setAllMembers(prev => sortMembers([...prev, newMember]));
      setChatState(prev => ({
        ...prev,
        customMembers: [...prev.customMembers, newMember]
      }));

      // Add to user's personal members list
      setUserMembers(prev => sortMembers([...prev, newMember]));

      // Save to IndexedDB
      if (isDbInitialized) {
        await dbService.saveCustomMember(newMember);
        // Also add to user members so it persists in their list
        await dbService.addUserMember(newMember.id);
        console.log('Custom member saved to database and added to user members');
      }
    } catch (error) {
      console.error('Failed to save custom member:', error);
    }
  };

  // Helper function to save conversation to database
  const saveConversationToDatabase = (conversationId: string, logMessage: string) => {
    if (isDbInitialized) {
      setTimeout(() => {
        setChatState(prev => {
          const currentConversation = prev.conversations.find(conv => conv.id === conversationId);
          if (currentConversation) {
            dbService.saveConversation(currentConversation).then(() => {
              console.log(logMessage);
            }).catch(error => {
              console.error('Failed to save conversation:', error);
            });
          }
          return prev;
        });
      }, 50);
    }
  };

  const handleSendMessage = async (content: string) => {
    // Auto-select first user if no members are selected
    if (chatState.selectedMembers.length === 0) {
      const firstUser = userMembers.find(member => !member.isHidden);
      if (firstUser) {
        setChatState(prev => ({
          ...prev,
          selectedMembers: [firstUser],
          activeTab: firstUser.id
        }));
      }
    }

    setIsLoading(true);

    let conversationId: string;
    let conversation: ConversationEntry;
    let isNewConversation = false;

    // Get the current selected members (including auto-selected first user)
    const currentSelectedMembers = chatState.selectedMembers.length === 0
      ? [userMembers.find(member => !member.isHidden)].filter(Boolean) as ChatMember[]
      : chatState.selectedMembers;

    // Create new exchange with initial loading states for all members
    const exchangeId = `exchange-${Date.now()}`;
    const initialResponses: MemberResponse[] = currentSelectedMembers.map(member => ({
      memberId: member.id,
      content: '',
      timestamp: new Date(),
      isLoading: true
    }));

    const newExchange: MessageExchange = {
      id: exchangeId,
      userMessage: content,
      responses: initialResponses,
      timestamp: new Date(),
      askedMembers: currentSelectedMembers,
      summaryPhase: currentSelectedMembers.length > 1 ? 'waiting-for-members' : 'completed'
    };

    if (!selectedConversation) {
      // Create new conversation
      conversationId = `conv-${Date.now()}`;
      isNewConversation = true;
      conversation = {
        id: conversationId,
        title: content.length > 50 ? content.substring(0, 50) + '...' : content,
        exchanges: [newExchange],
        timestamp: new Date(),
        threadId: `thread-${Date.now()}`
      };
    } else {
      // Add to existing conversation
      conversationId = selectedConversation.id;
      conversation = {
        ...selectedConversation,
        exchanges: [...selectedConversation.exchanges, newExchange],
        timestamp: new Date()
      };
    }

    // Add or update the conversation in state
    if (isNewConversation) {
      setChatState(prev => ({
        ...prev,
        conversations: [conversation, ...prev.conversations]
      }));
    } else {
      setChatState(prev => ({
        ...prev,
        conversations: [
          conversation,
          ...prev.conversations.filter(conv => conv.id !== conversationId)
        ]
      }));
    }
    setSelectedConversation(conversation);

    try {
      // Get conversation history (previous exchanges) for context
      const conversationHistory = selectedConversation?.exchanges || [];

      // Callback to update individual member responses as they complete
      const onMemberResponse = (memberId: string, responseContent: string) => {
        setChatState(prev => ({
          ...prev,
          conversations: prev.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  exchanges: conv.exchanges.map(exchange =>
                    exchange.id === exchangeId
                      ? {
                          ...exchange,
                          responses: exchange.responses.map(response =>
                            response.memberId === memberId
                              ? { ...response, content: responseContent, isLoading: false }
                              : response
                          )
                        }
                      : exchange
                  )
                }
              : conv
          )
        }));

        // Also update selectedConversation
        setSelectedConversation(prev => {
          if (prev && prev.id === conversationId) {
            return {
              ...prev,
              exchanges: prev.exchanges.map(exchange =>
                exchange.id === exchangeId
                  ? {
                      ...exchange,
                      responses: exchange.responses.map(response =>
                        response.memberId === memberId
                          ? { ...response, content: responseContent, isLoading: false }
                          : response
                      )
                    }
                  : exchange
              )
            };
          }
          return prev;
        });

        // Save individual member response to database
        saveConversationToDatabase(conversationId, `Member response from ${memberId} saved to database`);
      };

      // Start parallel API calls for all members
      const memberResponsesPromise = openaiParallelApiCalls(
        currentSelectedMembers,
        content,
        conversationHistory,
        onMemberResponse
      );

      // Handle summary generation for multiple members
      const handleSummaryGeneration = async (responses: MemberResponse[]) => {
        const summaryId = `summary-${exchangeId}`;
        console.log('All member responses completed. Starting summary generation with ID:', summaryId);

        // First, update to "generating-summary" phase
        setChatState(prev => ({
          ...prev,
          conversations: prev.conversations.map(conv =>
            conv.id === conversationId
              ? {
                  ...conv,
                  exchanges: conv.exchanges.map(exchange =>
                    exchange.id === exchangeId
                      ? { ...exchange, summaryPhase: 'generating-summary' }
                      : exchange
                  )
                }
              : conv
          )
        }));

        setSelectedConversation(prev => {
          if (prev && prev.id === conversationId) {
            return {
              ...prev,
              exchanges: prev.exchanges.map(exchange =>
                exchange.id === exchangeId
                  ? { ...exchange, summaryPhase: 'generating-summary' }
                  : exchange
              )
            };
          }
          return prev;
        });

        // Save the "generating-summary" phase to database
        saveConversationToDatabase(conversationId, 'Conversation with generating-summary phase saved to database');

        try {
          const summary = await generatePrimarySummary(
            responses,
            content,
            allMembers,
            conversationHistory
          );

          console.log('Summary completed for ID:', summaryId, 'Summary:', summary.substring(0, 100) + '...');

          // Update the UI with the completed summary
          setChatState(prev => ({
            ...prev,
            conversations: prev.conversations.map(conv =>
              conv.id === conversationId
                ? {
                    ...conv,
                    exchanges: conv.exchanges.map(exchange =>
                      exchange.id === exchangeId
                        ? {
                            ...exchange,
                            primarySummary: summary,
                            summaryPhase: 'completed'
                          }
                        : exchange
                    )
                  }
                : conv
            )
          }));

          // Also update selectedConversation to ensure UI refreshes
          setSelectedConversation(prev => {
            if (prev && prev.id === conversationId) {
              return {
                ...prev,
                exchanges: prev.exchanges.map(exchange =>
                  exchange.id === exchangeId
                    ? {
                        ...exchange,
                        primarySummary: summary,
                        summaryPhase: 'completed'
                      }
                    : exchange
                )
              };
            }
            return prev;
          });

          // Save the completed summary to database
          saveConversationToDatabase(conversationId, 'Conversation with completed summary saved to database');

        } catch (error) {
          console.error('Summary generation failed for ID:', summaryId, error);

          setChatState(prev => ({
            ...prev,
            conversations: prev.conversations.map(conv =>
              conv.id === conversationId
                ? {
                    ...conv,
                    exchanges: conv.exchanges.map(exchange =>
                      exchange.id === exchangeId
                        ? {
                            ...exchange,
                            primarySummary: 'Summary generation failed',
                            summaryPhase: 'completed'
                          }
                        : exchange
                    )
                  }
                : conv
            )
          }));

          // Also update selectedConversation for error case
          setSelectedConversation(prev => {
            if (prev && prev.id === conversationId) {
              return {
                ...prev,
                exchanges: prev.exchanges.map(exchange =>
                  exchange.id === exchangeId
                    ? {
                        ...exchange,
                        primarySummary: 'Summary generation failed',
                        summaryPhase: 'completed'
                      }
                    : exchange
                )
              };
            }
            return prev;
          });

          // Save the failed summary state to database
          saveConversationToDatabase(conversationId, 'Conversation with failed summary saved to database');
        }
      };

      // Generate primary summary if multiple members
      if (currentSelectedMembers.length > 1) {
        memberResponsesPromise.then(handleSummaryGeneration);
      }

      // Wait for member responses to complete, then handle final updates
      await memberResponsesPromise;

      // Set active tab appropriately
      const newActiveTab = currentSelectedMembers.length > 1 ? 'primary' : currentSelectedMembers[0].id;
      setChatState(prev => ({
        ...prev,
        activeTab: newActiveTab
      }));

    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    } finally {
      setIsLoading(false);

      // After loading is complete, save to database and update selected conversation
      if (isDbInitialized) {
        setTimeout(() => {
          setChatState(prev => {
            const currentConversation = prev.conversations.find(conv => conv.id === conversationId);
            if (currentConversation) {
              // Save to database
              dbService.saveConversation(currentConversation).then(() => {
                console.log('Conversation saved to database');
              }).catch(error => {
                console.error('Failed to save conversation:', error);
              });

              // Update selected conversation
              setSelectedConversation(currentConversation);
            }
            return prev;
          });
        }, 100); // Small delay to ensure all state updates are complete
      }
    }
  };

  const handleMemberToggle = (member: ChatMember) => {
    setChatState(prev => {
      const isCurrentlySelected = prev.selectedMembers.some(m => m.id === member.id);
      let newSelectedMembers;

      if (isCurrentlySelected) {
        // Remove member
        newSelectedMembers = prev.selectedMembers.filter(m => m.id !== member.id);
      } else {
        // Add member
        newSelectedMembers = [...prev.selectedMembers, member];
      }

      // Update active tab if needed
      let newActiveTab = prev.activeTab;
      if (isCurrentlySelected && prev.activeTab === member.id) {
        // If we're removing the currently active member, switch to primary or first member
        newActiveTab = newSelectedMembers.length > 1 ? 'primary' : (newSelectedMembers[0]?.id || 'primary');
      } else if (!isCurrentlySelected && newSelectedMembers.length === 2) {
        // If we just went from 1 to 2 members, switch to primary view
        newActiveTab = 'primary';
      } else if (newSelectedMembers.length === 1) {
        // If only one member, switch to that member's tab
        newActiveTab = newSelectedMembers[0].id;
      }

      return {
        ...prev,
        selectedMembers: newSelectedMembers,
        activeTab: newActiveTab
      };
    });
  };

  const handleMemberInfoClick = (member: ChatMember) => {
    setShowMemberInfo(member);
    setMemberInfoOpenedFromManagement(false); // This is called from MemberSelector, not from management
    // Keep selectedConversation intact to maintain visual selection in sidebar
  };

  const handleMemberInfoClickFromManagement = (member: ChatMember) => {
    setShowMemberInfo(member);
    setMemberInfoOpenedFromManagement(true); // This is called from MemberManagement
  };

  const handleManageMembers = () => {
    setShowMemberManagement(true);
    setShowMemberInfo(null);
    setShowAddMembers(false);
    setShowSettings(false);
    setMemberInfoOpenedFromManagement(false); // Reset the flag
    // Keep selectedConversation intact to maintain visual selection in sidebar
  };

  const handleAddMembers = () => {
    setShowAddMembers(true);
    setShowMemberInfo(null);
    setShowMemberManagement(false);
    setShowSettings(false);
    // Keep selectedConversation intact to maintain visual selection in sidebar
  };

  const handleShowSettings = () => {
    setShowSettings(true);
    setShowMemberInfo(null);
    setShowMemberManagement(false);
    setShowAddMembers(false);
    setMemberInfoOpenedFromManagement(false);
    // Keep selectedConversation intact to maintain visual selection in sidebar
  };

  const handleAddMemberToConversation = async (member: ChatMember) => {
    // Add member to user's personal members list if not already there
    setUserMembers(prev => {
      const isAlreadyInUserList = prev.some(m => m.id === member.id);
      if (isAlreadyInUserList) {
        return prev; // Member already in user's list
      }
      return sortMembers([...prev, member]);
    });

    // Save to database if not already there
    try {
      if (isDbInitialized) {
        await dbService.addUserMember(member.id);
        console.log('User member added to database');
      }
    } catch (error) {
      console.error('Failed to save user member:', error);
    }

    // Also add to selected members for current conversation if not already selected
    setChatState(prev => {
      const isAlreadySelected = prev.selectedMembers.some(m => m.id === member.id);
      if (isAlreadySelected) {
        return prev; // Member already selected, no change
      }

      const newSelectedMembers = [...prev.selectedMembers, member];

      // Update active tab if needed
      let newActiveTab = prev.activeTab;
      if (newSelectedMembers.length === 2) {
        // If we just went from 1 to 2 members, switch to primary view
        newActiveTab = 'primary';
      }

      return {
        ...prev,
        selectedMembers: newSelectedMembers,
        activeTab: newActiveTab
      };
    });
  };  const handleEditMember = (member: ChatMember) => {
    setEditingMember(member);
    setShowEditModal(true);
  };

  const handleSaveMember = async (updatedMember: ChatMember) => {
    try {
      // Update in local state for both allMembers and userMembers
      setAllMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      setUserMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));

      // Update selected members if this member is currently selected
      setChatState(prev => ({
        ...prev,
        selectedMembers: prev.selectedMembers.map(m => m.id === updatedMember.id ? updatedMember : m)
      }));

      // Save to database - now include default members (except first default member)
      if (isDbInitialized && updatedMember.id !== 'system-default') {
        await dbService.updateCustomMember(updatedMember);
        console.log('Member updated in database');
      }

      // Update the member info display if it's currently showing this member
      if (showMemberInfo && showMemberInfo.id === updatedMember.id) {
        setShowMemberInfo(updatedMember);
      }
    } catch (error) {
      console.error('Failed to update member:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      // Remove from user's personal members list
      setUserMembers(prev => prev.filter(m => m.id !== memberId));

      // Remove from user members database
      if (isDbInitialized) {
        await dbService.removeUserMember(memberId);
        console.log('User member removed from database');
      }

      // Check if this is a default member or custom member
      const defaultMember = defaultMembers.find(m => m.id === memberId);

      if (!defaultMember) {
        // This is a custom member, remove it completely from allMembers
        setAllMembers(prev => prev.filter(m => m.id !== memberId));

        // Remove from custom members state
        setChatState(prev => ({
          ...prev,
          customMembers: prev.customMembers.filter(m => m.id !== memberId)
        }));

        // Delete from database
        if (isDbInitialized) {
          await dbService.deleteCustomMember(memberId);
          console.log('Custom member deleted from database');
        }
      }
      // Note: For default/system members, we don't remove them from allMembers
      // They remain available in the "Add Members" screen

      // Remove from selected members if currently selected
      setChatState(prev => ({
        ...prev,
        selectedMembers: prev.selectedMembers.filter(m => m.id !== memberId)
      }));

      setShowMemberInfo(null);
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  const handleToggleMemberHidden = async (memberId: string, isHidden: boolean) => {
    try {
      // Update local state in both allMembers and userMembers
      setAllMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, isHidden } : m
      ));
      setUserMembers(prev => prev.map(m =>
        m.id === memberId ? { ...m, isHidden } : m
      ));

      // If hiding a member, remove from selected members
      if (isHidden) {
        setChatState(prev => ({
          ...prev,
          selectedMembers: prev.selectedMembers.filter(m => m.id !== memberId)
        }));
      }

      // Save preference to database
      if (isDbInitialized) {
        await dbService.saveMemberPreference(memberId, { isHidden });
        console.log(`Member ${isHidden ? 'hidden' : 'shown'}`);
      }

      // Update the member info display
      setShowMemberInfo(prev => prev ? { ...prev, isHidden } : null);
    } catch (error) {
      console.error('Failed to toggle member visibility:', error);
    }
  };

  const handleConversationSelect = (conversation: ConversationEntry) => {
    setSelectedConversation(conversation);
    setShowMemberInfo(null); // Clear member info when selecting a conversation
    setShowMemberManagement(false);
    setShowAddMembers(false);
    setShowSettings(false);
    setMemberInfoOpenedFromManagement(false); // Reset the flag
    // Update active tab to primary if multiple responses in the latest exchange, otherwise to the single member
    const latestExchange = conversation.exchanges[conversation.exchanges.length - 1];
    const newActiveTab = latestExchange?.responses.length > 1 ? 'primary' :
      (latestExchange?.responses[0]?.memberId || 'primary');
    setChatState(prev => ({
      ...prev,
      activeTab: newActiveTab
    }));
  };

  const handleConversationDelete = async (conversationId: string) => {
    try {
      // Remove from local state
      setChatState(prev => ({
        ...prev,
        conversations: prev.conversations.filter(conv => conv.id !== conversationId)
      }));

      // Clear selected conversation if it's the one being deleted
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }

      // Delete from database
      if (isDbInitialized) {
        await dbService.deleteConversation(conversationId);
        console.log('Conversation deleted from database');
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
    setShowMemberInfo(null);
    setShowMemberManagement(false);
    setShowAddMembers(false);
    setShowSettings(false);
    setMemberInfoOpenedFromManagement(false); // Reset the flag
  };  return (
    <div className="app">
      <div className="app-container">
        <aside className="sidebar">
          <div className="app-header">
            <div className="app-header-content">
              <h1>AI Team Chat</h1>
              <button
                className="settings-btn"
                onClick={handleShowSettings}
                title="Settings"
                aria-label="Open settings"
              >
                ⚙️
              </button>
            </div>
            <p className="selected-members">
              {chatState.selectedMembers.length === 0
                ? "No members selected"
                : `${chatState.selectedMembers.length} member${chatState.selectedMembers.length > 1 ? 's' : ''} selected`
              }
            </p>
          </div>
          <MemberSelector
            members={userMembers}
            selectedMembers={chatState.selectedMembers}
            onMemberToggle={handleMemberToggle}
            onMemberInfoClick={handleMemberInfoClick}
            onAddMembers={handleAddMembers}
            onManageMembers={handleManageMembers}
            onNewChat={handleNewChat}
            onShowSettings={handleShowSettings}
          />
          <ConversationHistory
            conversations={chatState.conversations}
            selectedConversation={selectedConversation}
            onConversationSelect={handleConversationSelect}
            onConversationDelete={handleConversationDelete}
          />
        </aside>

        <main className="main-content">
          {showMemberManagement ? (
            <MemberManagement
              members={userMembers}
              onClose={() => {
                setShowMemberManagement(false);
                setMemberInfoOpenedFromManagement(false); // Reset the flag
              }}
              onToggleVisibility={handleToggleMemberHidden}
              onDelete={handleDeleteMember}
              onMemberSelect={handleMemberInfoClickFromManagement}
              onEdit={handleEditMember}
            />
          ) : showAddMembers ? (
            <AddMembers
              members={allMembers}
              userMembers={userMembers}
              onClose={() => setShowAddMembers(false)}
              onAddMember={handleAddMemberToConversation}
              onCreateMember={handleCreateCustomMember}
              onMemberInfoClick={handleMemberInfoClick}
            />
          ) : showSettings ? (
            <Settings
              onClose={() => setShowSettings(false)}
            />
          ) : (
            <ChatInterface
              conversation={selectedConversation}
              selectedMembers={chatState.selectedMembers}
              isLoading={isLoading}
              onShowSettings={handleShowSettings}
            />
          )}
          {/* Only show MessageInput when not in management screens */}
          {!showMemberManagement && !showAddMembers && !showSettings && (
            <MessageInput
              onSendMessage={handleSendMessage}
              disabled={isLoading}
            />
          )}
        </main>
      </div>

      {/* Modal overlays */}
      {showMemberInfo && (
        <MemberInfoDisplay
          member={showMemberInfo}
          onClose={() => {
            setShowMemberInfo(null);
            if (memberInfoOpenedFromManagement) {
              // Return to manage members screen
              setShowMemberManagement(true);
              setMemberInfoOpenedFromManagement(false);
            } else {
              // Return to chat interface
              setShowMemberManagement(false);
            }
          }}
          onEdit={handleEditMember}
          onDelete={handleDeleteMember}
          onToggleHidden={handleToggleMemberHidden}
        />
      )}

      <CustomMemberModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onCreateMember={handleCreateCustomMember}
      />

      <EditMemberModal
        isOpen={showEditModal}
        member={editingMember}
        onClose={() => {
          setShowEditModal(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
      />
    </div>
  );
}

export default App;
