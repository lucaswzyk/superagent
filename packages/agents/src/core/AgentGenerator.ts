import { OpenAI } from 'openai';
import { BaseAgent } from './BaseAgent';
import { AgentConfig } from './types';
import { AgentMetadata } from './AgentRegistry';
import { v4 as uuidv4 } from 'uuid';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

export class AgentGenerator {
  private openai: OpenAI;
  private tempDir: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.tempDir = join(process.cwd(), 'temp');
  }

  async generateAgentCode(capabilities: string[]): Promise<{ code: string; metadata: AgentMetadata }> {
    const systemPrompt = `You are an expert AI agent developer. Create a specialized agent class that implements the following capabilities: ${capabilities.join(', ')}.

The agent should extend the BaseAgent class and implement these methods:
1. processReflection(reflection: Reflection): Promise<string>
2. processConversation(conversation: AgentConversation): Promise<string>

Include appropriate system prompts and processing logic for the specified capabilities.
Format the response as a JSON object with:
1. code: The complete TypeScript code for the agent class
2. metadata: The agent metadata including name, description, capabilities, and model requirements

Use best practices for AI agent development and ensure type safety.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Generate an agent that can handle these capabilities: ${capabilities.join(', ')}` 
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = response.choices[0].message.content;
    if (!result) throw new Error('Failed to generate agent code');

    try {
      const parsed = JSON.parse(result);
      return {
        code: parsed.code,
        metadata: parsed.metadata,
      };
    } catch (error) {
      throw new Error(`Failed to parse generated agent code: ${error}`);
    }
  }

  async createAgentClass(capabilities: string[]): Promise<{
    AgentClass: typeof BaseAgent;
    metadata: AgentMetadata;
  }> {
    const { code, metadata } = await this.generateAgentCode(capabilities);

    try {
      // Create a new module with the required imports
      const moduleCode = `
        const { BaseAgent } = require('./BaseAgent');
        const { Reflection } = require('@superagent/shared');
        ${code}
        module.exports = { DynamicAgent: ${metadata.name} };
      `;

      // Write the code to a temporary file
      const tempFile = join(this.tempDir, `agent-${uuidv4()}.js`);
      writeFileSync(tempFile, moduleCode);

      try {
        // Import the temporary file
        const module = require(tempFile);
        const AgentClass = module.DynamicAgent;

        if (!AgentClass || !(AgentClass.prototype instanceof BaseAgent)) {
          throw new Error('No valid agent class found in generated code');
        }

        return { AgentClass, metadata };
      } finally {
        // Clean up the temporary file
        unlinkSync(tempFile);
      }
    } catch (error) {
      throw new Error(`Failed to create agent class: ${error}`);
    }
  }

  validateAgentImplementation(AgentClass: typeof BaseAgent): void {
    // Verify that the agent class properly implements all required methods
    const agent = new AgentClass({
      id: uuidv4(),
      name: 'validator',
      description: 'A validation agent that ensures data quality and consistency',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1000,
      capabilities: ['validation', 'data_quality'],
      learningRate: 0.1,
      evolutionThreshold: 0.8,
      memoryRetention: 30 // Keep memories for 30 days
    });

    // Check that required methods exist and are functions
    const requiredMethods = ['processReflection', 'processConversation'];
    for (const method of requiredMethods) {
      if (typeof (agent as any)[method] !== 'function') {
        throw new Error(`Agent class missing required method: ${method}`);
      }
    }
  }
} 