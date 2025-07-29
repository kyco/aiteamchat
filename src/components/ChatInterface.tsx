import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ConversationEntry, MessageExchange } from '../types/chat';
import { ChatMember } from '../types/chat';
import { renderAvatar } from '../utils/avatar';

interface ChatInterfaceProps {
  conversation: ConversationEntry | null;
  selectedMembers: ChatMember[];
  isLoading: boolean;
  onShowSettings?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversation,
  selectedMembers, // Keep for backward compatibility and new messages
  isLoading,
  onShowSettings
}) => {
  const [activeExchangeTab, setActiveExchangeTab] = useState<{ [exchangeId: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.exchanges]);

  // Get member by ID from asked members for a specific exchange, fallback to selected members
  const getMemberById = (id: string, exchange?: MessageExchange) => {
    if (exchange && exchange.askedMembers && exchange.askedMembers.length > 0) {
      return exchange.askedMembers.find(member => member.id === id);
    }
    // Fallback to selectedMembers for backwards compatibility or empty askedMembers
    return selectedMembers.find(member => member.id === id);
  };

  const getActiveTab = (exchangeId: string, exchange: MessageExchange) => {
    if (activeExchangeTab[exchangeId]) {
      return activeExchangeTab[exchangeId];
    }
    // Default to primary if multiple responses, otherwise first member
    return exchange.responses.length > 1 ? 'primary' : (exchange.responses[0]?.memberId || 'primary');
  };

  const setActiveTab = (exchangeId: string, tabId: string) => {
    setActiveExchangeTab(prev => ({
      ...prev,
      [exchangeId]: tabId
    }));
  };

  // Function to render response content with special handling for API key errors
  const renderResponseContent = (content: string) => {
    const apiKeyErrorPattern = /OpenAI API key not configured\. Please add your API key in Settings\./;
    
    if (apiKeyErrorPattern.test(content)) {
      return (
        <div>
          <span>OpenAI API key not configured. Please </span>
          <button 
            onClick={onShowSettings}
            style={{
              background: 'none',
              border: 'none',
              color: '#3b82f6',
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'inherit',
              padding: 0
            }}
          >
            add your API key
          </button>
          <span> in Settings.</span>
        </div>
      );
    }
    
    return <ReactMarkdown>{content}</ReactMarkdown>;
  };

  if (!conversation || conversation.exchanges.length === 0) {
    return (
      <div className="chat-interface-empty">
        <div className="empty-state">
          <h3>Start a conversation</h3>
          <p>Ask a question to see responses from your selected team members</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface">
      <div className="chat-messages">
        {conversation.exchanges.map((exchange) => {
          const activeTab = getActiveTab(exchange.id, exchange);
          const hasPrimaryTab = exchange.responses.length > 1;

          return (
            <div key={exchange.id} className="message-exchange">
              {/* Combined Question and Response Bubble */}
              <div className="message-bubble combined-message">
                {/* User Question Section */}
                <div className="user-question-section">
                  <div className="question-label">YOUR QUESTION:</div>
                  <div className="question-content">{exchange.userMessage}</div>
                </div>

                {/* AI Responses Section */}
                {exchange.responses.length > 0 && (
                  <div className="ai-responses-section">
                    {/* Response Tabs */}
                    <div className="response-tabs">
                      <div className="tab-list">
                        {hasPrimaryTab && (
                          <button
                            className={`tab ${activeTab === 'primary' ? 'active' : ''} ${exchange.summaryPhase && exchange.summaryPhase !== 'completed' ? 'loading' : ''}`}
                            onClick={() => setActiveTab(exchange.id, 'primary')}
                          >
                            <span className="tab-icon">
                              {exchange.summaryPhase === 'waiting-for-members' ? '⏳' :
                               exchange.summaryPhase === 'generating-summary' ? '⏳' : '📋'}
                            </span>
                            Summary
                            {exchange.summaryPhase && exchange.summaryPhase !== 'completed' && (
                              <span className="loading-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                              </span>
                            )}
                          </button>
                        )}
                        {exchange.responses.map((response) => {
                          const member = getMemberById(response.memberId, exchange);
                          if (!member) return null;

                          return (
                            <button
                              key={response.memberId}
                              className={`tab ${activeTab === response.memberId ? 'active' : ''} ${response.isLoading ? 'loading' : ''}`}
                              onClick={() => setActiveTab(exchange.id, response.memberId)}
                              style={{ '--member-color': member.color } as React.CSSProperties}
                            >
                              <span className="tab-avatar">
                                {response.isLoading ? '⏳' : renderAvatar(member.avatar)}
                              </span>
                              {member.name}
                              {response.isLoading && (
                                <span className="loading-indicator">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Response Content */}
                      <div className="tab-content">
                        {activeTab === 'primary' && hasPrimaryTab && (
                          <div className="primary-summary">
                            {(() => {
                              console.log('Rendering summary tab, summaryPhase:', exchange.summaryPhase, 'primarySummary:', exchange.primarySummary ? exchange.primarySummary.substring(0, 100) + '...' : 'null/undefined');
                              return null;
                            })()}
                            {exchange.summaryPhase === 'waiting-for-members' ? (
                              <div className="loading-state">
                                <div className="typing-indicator">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                                <p>Waiting for experts to answer...</p>
                              </div>
                            ) : exchange.summaryPhase === 'generating-summary' ? (
                              <div className="loading-state">
                                <div className="typing-indicator">
                                  <span></span>
                                  <span></span>
                                  <span></span>
                                </div>
                                <p>Generating summary...</p>
                              </div>
                            ) : (
                              renderResponseContent(exchange.primarySummary || 'Summary unavailable')
                            )}
                          </div>
                        )}

                        {exchange.responses.map((response) => {
                          const member = getMemberById(response.memberId, exchange);
                          if (!member || activeTab !== response.memberId) return null;

                          return (
                            <div key={response.memberId} className="member-response">
                              <div className="response-content">
                                {response.isLoading ? (
                                  <div className="loading-state">
                                    <div className="typing-indicator">
                                      <span></span>
                                      <span></span>
                                      <span></span>
                                    </div>
                                    <p>Getting response from {member.name}...</p>
                                  </div>
                                ) : (
                                  renderResponseContent(response.content)
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};
