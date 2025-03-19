import { BaseAgent } from './BaseAgent';

export interface AgentMetadata {
  name: string;
  description: string;
  capabilities: string[];
  modelRequirements: {
    type: 'llm' | 'image' | 'audio' | 'video';
    minTokens?: number;
    apiProvider?: string;
  }[];
}

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, { agent: typeof BaseAgent; metadata: AgentMetadata }>;

  private constructor() {
    this.agents = new Map();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public registerAgent(
    name: string,
    agentClass: typeof BaseAgent,
    metadata: AgentMetadata
  ): void {
    if (this.agents.has(name)) {
      throw new Error(`Agent with name ${name} is already registered`);
    }
    this.agents.set(name, { agent: agentClass, metadata });
  }

  public getAgent(name: string): { agent: typeof BaseAgent; metadata: AgentMetadata } {
    const agent = this.agents.get(name);
    if (!agent) {
      throw new Error(`Agent ${name} not found in registry`);
    }
    return agent;
  }

  public findAgentsByCapability(capability: string): { agent: typeof BaseAgent; metadata: AgentMetadata }[] {
    return Array.from(this.agents.values()).filter(({ metadata }) =>
      metadata.capabilities.includes(capability)
    );
  }

  public getAllAgents(): { name: string; metadata: AgentMetadata }[] {
    return Array.from(this.agents.entries()).map(([name, { metadata }]) => ({
      name,
      metadata,
    }));
  }
} 