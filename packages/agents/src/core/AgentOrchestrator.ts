import { EventEmitter } from 'events';
import { AgentRegistry } from './AgentRegistry';
import { TaskDecomposer } from './TaskDecomposer';
import { BaseAgent } from './BaseAgent';
import { AgentConfig, AgentEvent, AgentEventType } from './types';
import { EvolutionManager } from './EvolutionManager';
import { logger } from '../utils/logger';

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
    logger.info('AgentOrchestrator initialized');
  }

  public static getInstance(): AgentOrchestrator {
    if (!AgentOrchestrator.instance) {
      AgentOrchestrator.instance = new AgentOrchestrator();
    }
    return AgentOrchestrator.instance;
  }

  private emitEvent(type: AgentEventType, agentId: string, data?: any): void {
    this.emit(type, {
      type,
      timestamp: new Date(),
      agentId,
      data
    } as AgentEvent);
  }

  public async createAgent(config: AgentConfig): Promise<BaseAgent> {
    try {
      // Create new agent instance
      const agent = new BaseAgent(config);
      
      // Register agent
      this.activeAgents.set(config.id, agent);
      
      logger.info('Agent created and registered', {
        agentId: config.id,
        name: config.name,
        capabilities: Array.from(config.capabilities)
      });

      // Emit event
      this.emitEvent('agent_created', config.id, { config });

      return agent;
    } catch (error) {
      logger.error('Failed to create agent', {
        config,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      this.emitEvent('error', 'system', { error });
      throw error;
    }
  }

  public async destroyAgent(agentId: string): Promise<void> {
    const agent = this.activeAgents.get(agentId);
    if (agent) {
      // Clean up agent resources
      this.activeAgents.delete(agentId);
      
      logger.info('Agent destroyed', {
        agentId,
        name: agent.config.name
      });
      
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

      logger.info('Task execution started', {
        taskId: task.id,
        type: task.type,
        agentIds: task.agents.map(a => a.config.id),
        priority: task.priority
      });

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

      logger.info('Task execution completed', {
        taskId: task.id,
        agentId: primaryAgent.config.id,
        duration: task.endTime.getTime() - task.startTime!.getTime()
      });

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

      logger.error('Task execution failed', {
        taskId: task.id,
        agentId: task.agents[0]?.config.id,
        error: task.error,
        duration: task.endTime.getTime() - task.startTime!.getTime()
      });

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
    if (state.metrics.successRate < agent.config.evolutionThreshold) {
      logger.info('Agent evolution triggered', {
        agentId: agent.config.id,
        currentSuccessRate: state.metrics.successRate,
        threshold: agent.config.evolutionThreshold
      });
      await agent.evolve();
    }
  }

  public getActiveAgents(): Map<string, BaseAgent> {
    return new Map(this.activeAgents);
  }

  public getActiveTasks(): Map<string, Task> {
    return new Map(this.activeTasks);
  }
} 