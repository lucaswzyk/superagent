export interface ResourceUsage {
  tokens: number;
  computeUnits: number;
  memory: number;
  storage: number;
  [key: string]: number;
}

export interface SystemMetrics {
  activeAgents: number;
  totalTasks: number;
  successRate: number;
  averageResponseTime: number;
  resourceUsage: ResourceUsage;
  lastUpdated: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
}

export interface AgentTask {
  id: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  priority: number;
  type: string;
  result?: any;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  status: 'idle' | 'busy' | 'error';
  currentTask?: AgentTask;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
  };
} 