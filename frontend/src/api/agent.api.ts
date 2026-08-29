import { api } from './client'
import type { AgentChatRequest, AgentChatResponse, ChatDto, ChatResponse } from '../types'
export const agentApi = {
  chat: (dto: AgentChatRequest) => api.post<AgentChatResponse>('/api/agent/chat', dto).then((r) => r.data),
  chatV1: (dto: ChatDto) => api.post<ChatResponse>('/api/v1/agent/chat', dto).then((r) => r.data),
  health: () => api.get('/api/agent/health').then((r) => r.data),
}
