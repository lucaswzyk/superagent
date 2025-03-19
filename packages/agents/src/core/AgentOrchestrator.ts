import { EventEmitter } from 'events';
import { AgentRegistry } from './AgentRegistry';
import { TaskDecomposer } from './TaskDecomposer';
import { BaseAgent } from './BaseAgent';
import { AgentConfig, AgentEvent, AgentEventType } from './types';
import { EvolutionManager } from './EvolutionManager';

export interface Task {
  id: string;
  description: string;
  agents: BaseAgent[];
  priority: number;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startTime?: Date;
  endTime?: Date;
}

export class AgentOrchestrator extends EventEmitter {
  private static instance: AgentOrchestrator;
  private registry: AgentRegistry;
  private decomposer: TaskDecomposer;
  private evolutionManager: EvolutionManager;
  private activeAgents: Map<string, BaseAgent>;
  private activeTasks: Map<string, Task>;

  private constructor() {
    super();
    this.registry = AgentRegistry.getInstance();
    this.decomposer = new TaskDecomposer();
    this.evolutionManager = EvolutionManager.getInstance();
    this.activeAgents = new Map();
    this.activeTasks = new Map();
  }

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  private emitEvent(type: AgentEventType, agentId: string, data: Record<string, any> = {}): void {
    const event: AgentEvent = {
      type,
      timestamp: new Date(),
      agentId,
      data
    };
    this.emit(type, event);
  }

  public async createAgent(config: AgentConfig): Promise<BaseAgent> {
    try {
      // Create new agent instance
      const agent = new BaseAgent(config);
      
      // Register agent
      this.activeAgents.set(config.id, agent);
      
      // Emit event
      this.emitEvent('agent_created', config.id, { config });

      return agent;
    } catch (error) {
      this.emitEvent('error', 'system', { error });
      throw error;
    }
  }

  public async destroyAgent(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      // Clean up agent resources
      this.activeAgents.delete(agentId);
      
      // Emit event
      this.emitEvent('agent_destroyed', agentId);
    }
  }

  public async executeTask(task: Task): Promise<any> {
    try {
      // Update task status
      task.status = 'in_progress';
      task.startTime = new Date();
      this.activeTasks.set(task.id, task);

      // Emit event
      this.emitEvent('task_started', task.agents[0]?.config.id || 'system', { taskId: task.id });

      // Execute task using primary agent
      const primaryAgent = task.agents[0];
      if (!primaryAgent) {
        throw new Error('No agent assigned to task');
      }

      const result = await primaryAgent.processConversation({
        id: task.id,
        title: task.description,
        messages: [{
          id: task.id,
          content: task.description,
          role: 'user',
          createdAt: new Date(),
          conversationId: task.id
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: 'system',
        agentType: task.type
      });

      // Update task status
      task.status = 'completed';
      task.result = result;
      task.endTime = new Date();

      // Emit event
      this.emitEvent('task_completed', primaryAgent.config.id, { taskId: task.id, result });

      // Check if agent needs evolution
      await this.checkAndEvolveAgent(primaryAgent);

      return result;
    } catch (error) {
      // Update task status
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      task.endTime = new Date();

      // Emit event
      this.emitEvent('task_failed', task.agents[0]?.config.id || 'system', { 
        taskId: task.id, 
        error: task.error 
      });

      throw error;
    }
  }

  private async checkAndEvolveAgent(agent: BaseAgent): Promise<void> {
    const state = agent.getState();
    if (state.metrics.successRate < 0.8 || state.metrics.userSatisfaction < 0.7) {
      await this.evolutionManager.evolveAgent(agent);
    }
  }

  public getActiveAgents(): Map<string, BaseAgent> {
    return new Map(this.activeAgents);
  }

  public getActiveTasks(): Map<string, Task> {
    return new Map(this.activeTasks);
  }
} 