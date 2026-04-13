import { api } from './api';
import type { ChatMessage, Conversation } from '../types/chat';

export const chatApi = {
  async getLatestConversation(): Promise<Conversation> {
    const { data } = await api.get<Conversation>('/chat/conversations/latest');
    return data;
  },

  async listConversations(): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>('/chat/conversations');
    return data;
  },

  async listMessages(conversationId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(
      `/chat/conversations/${conversationId}/messages`,
      { params: { limit, before } },
    );
    return data;
  },

  async sendMessage(conversationId: string, content: string): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(
      `/chat/conversations/${conversationId}/messages`,
      { content },
    );
    return data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    await api.delete(`/chat/conversations/${conversationId}`);
  },
};
