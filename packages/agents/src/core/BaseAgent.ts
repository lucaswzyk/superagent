import { OpenAI } from 'openai';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentState,
  AgentEvent,
  Experience,
  Knowledge,
  LearningStrategy,
  EvolutionStrategy,
  Message,
  AgentConversation,
  AgentConfig
} from './types';

export class BaseAgent extends EventEmitter {
  protected openai: OpenAI;
  public readonly config: AgentConfig;
  protected state: AgentState;
  protected learningStrategies: Map<string, LearningStrategy>;
  protected evolutionStrategies: Map<string, EvolutionStrategy>;

  constructor(config: AgentConfig) {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.config = config;
    this.learningStrategies = new Map();
    this.evolutionStrategies = new Map();
    
    // Initialize agent state
    this.state = {
      status: 'idle',
      memory: {
        episodic: new Map(),
        semantic: new Map(),
        procedural: new Map()
      },
      metrics: {
        successRate: 1.0,
        averageResponseTime: 0,
        tokenUsage: 0,
        taskCompletion: 1.0,
        userSatisfaction: 1.0,
        lastUpdated: new Date()
      },
      capabilities: new Set(config.capabilities),
      relationships: new Map()
    };

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.on('task_completed', this.handleTaskCompletion.bind(this));
    this.on('task_failed', this.handleTaskFailure.bind(this));
    this.on('learning_completed', this.updateMetrics.bind(this));
  }

  protected async generateResponse(
    messages: Message[],
    systemPrompt: string
  ): Promise<string> {
    const startTime = Date.now();
    
    try {
      const relevantMemories = await this.retrieveRelevantMemories(messages);
      const enhancedPrompt = this.enhancePromptWithMemories(systemPrompt, relevantMemories);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: enhancedPrompt },
          ...messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const result = response.choices[0].message.content || '';
      
      // Record the experience
      await this.recordExperience({
        id: uuidv4(),
        timestamp: new Date(),
        context: { messages, systemPrompt },
        outcome: { success: true, result },
        feedback: 0, // Will be updated when feedback is received
        tags: ['response_generation']
      });

      // Update metrics
      this.state.metrics.averageResponseTime = 
        (this.state.metrics.averageResponseTime + (Date.now() - startTime)) / 2;
      
      return result;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  protected async retrieveRelevantMemories(context: any): Promise<Array<Experience | Knowledge>> {
    // Implement memory retrieval logic using embeddings or other similarity measures
    return [];
  }

  protected enhancePromptWithMemories(
    basePrompt: string,
    memories: Array<Experience | Knowledge>
  ): string {
    // Enhance the prompt with relevant memories
    const memoryContext = memories
      .map(m => this.formatMemoryForPrompt(m))
      .join('\n');
    
    return `${basePrompt}\n\nRelevant Context:\n${memoryContext}`;
  }

  private formatMemoryForPrompt(memory: Experience | Knowledge): string {
    if ('concept' in memory) {
      return `Knowledge: ${memory.concept} (Confidence: ${memory.confidence})`;
    } else {
      return `Experience: ${JSON.stringify(memory.outcome)}`;
    }
  }

  public async processConversation(conversation: AgentConversation): Promise<string> {
    this.state.status = 'busy';
    this.state.currentTask = {
      id: conversation.id,
      startTime: new Date(),
      type: conversation.agentType,
      priority: 1
    };

    try {
      const systemPrompt = `You are ${this.config.name}, an AI agent specialized in ${this.config.description}.`;
      const response = await this.generateResponse(conversation.messages, systemPrompt);
      
      this.state.status = 'idle';
      delete this.state.currentTask;
      
      return response;
    } catch (error) {
      this.state.status = 'error';
      throw error;
    }
  }

  public async learn(experience: Experience): Promise<void> {
    this.state.status = 'learning';
    this.emit('learning_started', { 
      type: 'learning_started',
      timestamp: new Date(),
      agentId: this.config.id,
      data: { experience }
    } as AgentEvent);

    try {
      for (const strategy of this.learningStrategies.values()) {
        await strategy.apply(this, experience);
      }

      this.emit('learning_completed', {
        type: 'learning_completed',
        timestamp: new Date(),
        agentId: this.config.id,
        data: {}
      } as AgentEvent);
    } catch (error) {
      this.emit('error', {
        type: 'error',
        timestamp: new Date(),
        agentId: this.config.id,
        data: { error }
      } as AgentEvent);
      throw error;
    } finally {
      this.state.status = 'idle';
    }
  }

  public async evolve(): Promise<void> {
    if (this.shouldEvolve()) {
      this.state.status = 'evolving';
      this.emit('evolution_started', {
        type: 'evolution_started',
        timestamp: new Date(),
        agentId: this.config.id,
        data: {}
      } as AgentEvent);

      try {
        for (const strategy of this.evolutionStrategies.values()) {
          if (strategy.shouldEvolve(this.state.metrics)) {
            await strategy.evolve(this);
          }
        }

        this.emit('evolution_completed', {
          type: 'evolution_completed',
          timestamp: new Date(),
          agentId: this.config.id,
          data: {}
        } as AgentEvent);
      } catch (error) {
        this.emit('error', {
          type: 'error',
          timestamp: new Date(),
          agentId: this.config.id,
          data: { error }
        } as AgentEvent);
        throw error;
      } finally {
        this.state.status = 'idle';
      }
    }
  }

  private shouldEvolve(): boolean {
    return this.state.metrics.successRate < this.config.evolutionThreshold;
  }

  protected async recordExperience(experience: Experience): Promise<void> {
    this.state.memory.episodic.set(experience.id, experience);
    await this.learn(experience);
    
    // Clean up old memories based on retention policy
    this.cleanupOldMemories();
  }

  private cleanupOldMemories(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.config.memoryRetention);

    for (const [id, experience] of this.state.memory.episodic) {
      if (experience.timestamp < cutoff) {
        this.state.memory.episodic.delete(id);
      }
    }
  }

  private async handleTaskCompletion(event: AgentEvent): Promise<void> {
    this.state.metrics.successRate = 
      (this.state.metrics.successRate * 9 + 1) / 10; // Rolling average
    this.state.metrics.taskCompletion += 1;
    this.state.metrics.lastUpdated = new Date();
  }

  private async handleTaskFailure(event: AgentEvent): Promise<void> {
    this.state.metrics.successRate = 
      (this.state.metrics.successRate * 9) / 10; // Rolling average
    this.state.metrics.lastUpdated = new Date();
    
    // Trigger evolution if success rate drops too low
    await this.evolve();
  }

  private async updateMetrics(): Promise<void> {
    this.state.metrics.lastUpdated = new Date();
    // Additional metric updates based on learning outcomes
  }

  public getState(): AgentState {
    return { ...this.state };
  }

  public getCapabilities(): Set<string> {
    return new Set(this.state.capabilities);
  }

  public async addCapability(capability: string): Promise<void> {
    this.state.capabilities.add(capability);
  }

  public async removeCapability(capability: string): Promise<void> {
    this.state.capabilities.delete(capability);
  }
} 