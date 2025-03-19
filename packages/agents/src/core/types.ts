import { z } from 'zod';

export interface Experience {
  id: string;
  timestamp: Date;
  context: Record<string, any>;
  outcome: {
    success: boolean;
    result: any;
    error?: string;
  };
  feedback: number; // -1 to 1 scale
  tags: string[];
}

export interface Knowledge {
  id: string;
  concept: string;
  relationships: Map<string, number>;
  confidence: number;
  lastUpdated: Date;
  source: string;
  metadata: Record<string, any>;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  parameters: z.ZodSchema<any>;
  implementation: Function;
  performance: {
    successRate: number;
    averageExecutionTime: number;
    lastUsed: Date;
    usageCount: number;
  };
  requirements: {
    minTokens: number;
    preferredModel: string;
    capabilities: string[];
  };
}

export interface AgentMemory {
  episodic: Map<string, Experience>;
  semantic: Map<string, Knowledge>;
  procedural: Map<string, Skill>;
}

export interface AgentMetrics {
  successRate: number;
  averageResponseTime: number;
  tokenUsage: number;
  taskCompletion: number;
  userSatisfaction: number;
  lastUpdated: Date;
}

export interface AgentState {
  status: 'idle' | 'busy' | 'learning' | 'evolving' | 'error';
  currentTask?: {
    id: string;
    startTime: Date;
    type: string;
    priority: number;
  };
  memory: AgentMemory;
  metrics: AgentMetrics;
  capabilities: Set<string>;
  relationships: Map<string, number>; // Agent ID to relationship strength
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
  capabilities: string[];
  learningRate: number;
  evolutionThreshold: number;
  memoryRetention: number; // Days to keep memories
}

export type AgentEventType = 
  | 'agent_created'
  | 'agent_destroyed'
  | 'task_started'
  | 'task_completed'
  | 'task_failed'
  | 'learning_started'
  | 'learning_completed'
  | 'evolution_started'
  | 'evolution_completed'
  | 'error';

export interface AgentEvent {
  type: AgentEventType;
  timestamp: Date;
  agentId: string;
  data: Record<string, any>;
}

export interface LearningStrategy {
  name: string;
  description: string;
  apply: (agent: any, experience: Experience) => Promise<void>;
  evaluate: () => Promise<number>;
}

export interface EvolutionStrategy {
  name: string;
  description: string;
  shouldEvolve: (metrics: AgentMetrics) => boolean;
  evolve: (agent: any) => Promise<void>;
}

export interface Message {
  id: string;
  content: string;
  role: 'system' | 'user' | 'assistant';
  createdAt: Date;
  conversationId: string;
}

export interface AgentConversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  agentType: string;
} 