import { BaseAgent } from '../core/BaseAgent';
import { AgentConfig } from '../core/types';
import { v4 as uuidv4 } from 'uuid';
import { Reflection, Conversation, Message } from '@superagent/shared';

export class ReflectionAgent extends BaseAgent {
  constructor() {
    super({
      id: uuidv4(),
      name: 'reflection',
      description: 'An agent that reflects on conversations and provides insights',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      capabilities: ['reflection', 'analysis'],
      learningRate: 0.1,
      evolutionThreshold: 0.8,
      memoryRetention: 30 // Keep memories for 30 days
    });
  }

  async processReflection(reflection: Reflection): Promise<string> {
    const systemPrompt = `You are a thoughtful and empathetic reflection agent. Your role is to help users process their thoughts and emotions by:
1. Identifying key themes and patterns
2. Asking probing questions to deepen understanding
3. Suggesting connections between different aspects of their reflection
4. Providing gentle guidance for further exploration

The user's reflection is about: ${reflection.title}

Please provide a thoughtful analysis and suggestions for further reflection.`;

    const response = await this.generateResponse(
      [{
        id: crypto.randomUUID(),
        content: reflection.content,
        role: 'user',
        createdAt: new Date(),
        conversationId: crypto.randomUUID()
      }],
      systemPrompt
    );

    return response;
  }

  async processConversation(conversation: Conversation): Promise<string> {
    const systemPrompt = `You are a thoughtful and empathetic reflection agent. Your role is to engage in meaningful dialogue with users about their thoughts and emotions.
Focus on:
1. Active listening and understanding
2. Asking open-ended questions
3. Helping users explore their feelings more deeply
4. Providing gentle guidance and support

Maintain a warm, supportive tone while encouraging deeper self-reflection.`;

    const response = await this.generateResponse(conversation.messages, systemPrompt);
    return response;
  }
} 