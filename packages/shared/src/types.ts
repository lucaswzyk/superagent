import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  image: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ReflectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
});

export const MessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant']),
  createdAt: z.date(),
  conversationId: z.string(),
});

export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  userId: z.string(),
  agentType: z.enum(['reflection', 'law', 'creative']),
  messages: z.array(MessageSchema),
});

export const AgentNoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  agentType: z.enum(['reflection', 'law', 'creative']),
  createdAt: z.date(),
  reflectionId: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type Reflection = z.infer<typeof ReflectionSchema>;
export type Conversation = z.infer<typeof ConversationSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type AgentNote = z.infer<typeof AgentNoteSchema>; 