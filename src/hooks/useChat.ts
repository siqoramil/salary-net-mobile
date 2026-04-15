import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { chatApi } from '../services/chat.service';
import { expenseKeys } from './useExpenses';


export const chatKeys = {
  all: ['chat'] as const,
  latest: ['chat', 'latest'] as const,
  messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
};

export function useLatestConversation() {
  return useQuery({
    queryKey: chatKeys.latest,
    queryFn: () => chatApi.getLatestConversation(),
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? ''),
    queryFn: () => chatApi.listMessages(conversationId!),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error('No conversation');
      return chatApi.sendMessage(conversationId, content);
    },
    onSuccess: () => {
      if (!conversationId) return;
      void qc.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
      void qc.invalidateQueries({ queryKey: expenseKeys.all });
    },
  });
}

export function useClearHistory(conversationId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => {
      if (!conversationId) throw new Error('No conversation');
      return chatApi.deleteConversation(conversationId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
