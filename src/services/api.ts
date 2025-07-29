import { ChatMember, MemberResponse, MessageExchange } from '../types/chat';
import OpenAI from 'openai';
import { prompts } from '../prompts';
import { OPENAI_MODEL } from '../config/constants';
import { memberPromptsMap } from '../data/members/index';
import { apiKeyService } from './apiKeyService';

// OpenAI client will be initialized dynamically with the current API key
let openaiClient: OpenAI | null = null;

// Get or create OpenAI client with current API key
const getOpenAIClient = async (): Promise<OpenAI> => {
  const apiKey = await apiKeyService.getApiKey();

  if (!openaiClient || apiKey !== openaiClient.apiKey) {
    openaiClient = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Note: In production, API calls should go through your backend
    });
  }

  return openaiClient;
};

// System prompts for each persona
const getSystemPrompt = (member: ChatMember): string => {
  return memberPromptsMap[member.id as keyof typeof memberPromptsMap] || memberPromptsMap.chatgpt;
};

// Check if OpenAI API key is configured
const isOpenAIConfigured = async (): Promise<boolean> => {
  return await apiKeyService.isConfigured();
};

// Real OpenAI API call with conversation history
export const openaiApiCall = async (
  member: ChatMember,
  message: string,
  conversationHistory: MessageExchange[] = [],
  onProgress?: (memberId: string, content: string) => void
): Promise<string> => {
  if (!(await isOpenAIConfigured())) {
    const errorMessage = "OpenAI API key not configured. Please add your API key in Settings.";
    onProgress?.(member.id, errorMessage);
    return errorMessage;
  }

  try {
    const openai = await getOpenAIClient();

    // Build conversation context
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: getSystemPrompt(member) }
    ];

    // Add conversation history context
    conversationHistory.forEach(exchange => {
      messages.push({ role: 'user', content: exchange.userMessage });

      // Find this member's response in the exchange
      const memberResponse = exchange.responses.find(r => r.memberId === member.id);
      if (memberResponse && memberResponse.content.trim()) {
        messages.push({ role: 'assistant', content: memberResponse.content });
      }
    });

    // Add current user message
    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const responseContent = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";
    onProgress?.(member.id, responseContent);
    return responseContent;
  } catch (error) {
    console.error('OpenAI API error:', error);
    const errorMessage = "OpenAI API error occurred. Please check your API key and try again.";
    onProgress?.(member.id, errorMessage);
    return errorMessage;
  }
};

// Parallel API call handler for multiple members
export const openaiParallelApiCalls = async (
  members: ChatMember[],
  message: string,
  conversationHistory: MessageExchange[] = [],
  onMemberResponse: (memberId: string, content: string) => void
): Promise<MemberResponse[]> => {
  const memberPromises = members.map(async (member) => {
    try {
      const content = await openaiApiCall(member, message, conversationHistory, onMemberResponse);
      return {
        memberId: member.id,
        content,
        timestamp: new Date(),
        isLoading: false
      };
    } catch (error) {
      console.error(`Error getting response from ${member.name}:`, error);
      const errorContent = `Error: Could not get response from ${member.name}`;
      onMemberResponse(member.id, errorContent);
      return {
        memberId: member.id,
        content: errorContent,
        timestamp: new Date(),
        isLoading: false
      };
    }
  });

  return Promise.all(memberPromises);
};

// Generate primary summary using all member responses
export const generatePrimarySummary = async (
  memberResponses: MemberResponse[],
  userMessage: string,
  allMembers: ChatMember[],
  conversationHistory: MessageExchange[] = []
): Promise<string> => {
  if (!(await isOpenAIConfigured())) {
    return "Summary generation unavailable: OpenAI API key not configured. Please add your API key in Settings.";
  }

  try {
    const openai = await getOpenAIClient();

    // Create a context string from member responses
    const expertResponses = memberResponses
      .filter(response => response.content.trim() !== '')
      .map(response => {
        const member = allMembers.find(m => m.id === response.memberId);
        const memberName = member?.name || 'Unknown Expert';
        return `${memberName}: ${response.content}`;
      })
      .join('\n\n');

    // Add conversation history context if available
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious conversation context:\n';
      conversationHistory.slice(-3).forEach(exchange => { // Only include last 3 exchanges for context
        conversationContext += `User: ${exchange.userMessage}\n`;
        exchange.responses.forEach(resp => {
          const member = allMembers.find(m => m.id === resp.memberId);
          conversationContext += `${member?.name || 'Expert'}: ${resp.content.split('.')[0]}.${resp.content.split(' ').length > 20 ? '...' : resp.content.split('.').slice(1).join('.')}\n`;
        });
        conversationContext += '---\n';
      });
    }

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: prompts.summariser.system },
        { role: "user", content: prompts.summariser.user(userMessage, expertResponses) + conversationContext }
      ],
      max_tokens: 800,
      temperature: 0.5,
    });

    const summary = completion.choices[0]?.message?.content || "Unable to generate summary. Please try again.";
    console.log('Generated summary successfully:', summary.substring(0, 100) + '...');
    return summary;
  } catch (error) {
    console.error('OpenAI API error while generating summary:', error);
    const errorMessage = "OpenAI API error occurred while generating summary. Please check your API key and try again.";
    console.log('Error in summary generation:', errorMessage);
    return errorMessage;
  }
};

// Generate member role based on name and prompt
export const generateMemberRole = async (name: string, prompt: string): Promise<string> => {
  if (!(await isOpenAIConfigured())) {
    return "Custom AI Assistant";
  }

  try {
    const openai = await getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: prompts.roleGenerator
        },
        {
          role: "user",
          content: `Name: ${name}\n\nPrompt: ${prompt}\n\nGenerate a professional role/title:`
        }
      ],
      max_tokens: 20,
      temperature: 0.3,
    });

    return completion.choices[0]?.message?.content?.trim() || "Custom AI Assistant";
  } catch (error) {
    console.error('OpenAI API error while generating role:', error);
    return "Custom AI Assistant";
  }
};

// Generate member description based on name, role, and prompt
export const generateMemberDescription = async (name: string, role: string, prompt: string): Promise<string> => {
  if (!(await isOpenAIConfigured())) {
    return "A custom AI assistant ready to help with various tasks.";
  }

  try {
    const openai = await getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: prompts.descriptionGenerator
        },
        {
          role: "user",
          content: `Name: ${name}\nRole: ${role}\n\nPrompt: ${prompt}\n\nGenerate a description:`
        }
      ],
      max_tokens: 100,
      temperature: 0.5,
    });

    return completion.choices[0]?.message?.content?.trim() || "A custom AI assistant ready to help with various tasks.";
  } catch (error) {
    console.error('OpenAI API error while generating description:', error);
    return "A custom AI assistant ready to help with various tasks.";
  }
};

// Generate member strengths using bullet points prompt
export const generateMemberStrengths = async (prompt: string): Promise<string[]> => {
  if (!(await isOpenAIConfigured())) {
    return [];
  }

  try {
    const openai = await getOpenAIClient();

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: prompts.bulletPoints
        },
        {
          role: "user",
          content: `System prompt: ${prompt}\n\nGenerate exactly 5 bullet points for "Strengths & Approach":`
        }
      ],
      max_tokens: 300,
      temperature: 0.4,
    });

    const response = completion.choices[0]?.message?.content?.trim() || "";

    // Parse the response into an array of strengths
    const strengths = response
      .split('\n')
      .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 5); // Ensure exactly 5 strengths


    return strengths;
  } catch (error) {
    console.error('OpenAI API error while generating strengths:', error);
    return [];
  }
};
