import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

interface ResourceRequirements {
  tokens: number;
  computeUnits: number;
  memory: number;
  storage: number;
}

interface ResourceUsage {
  tokens: number;
  computeUnits: number;
  memory: number;
  storage: number;
}

export class ResourceManager extends EventEmitter {
  private static instance: ResourceManager;
  private currentUsage: ResourceUsage;
  private maxResources: ResourceUsage;

  private constructor() {
    super();
    this.currentUsage = {
      tokens: 0,
      computeUnits: 0,
      memory: 0,
      storage: 0
    };
    this.maxResources = {
      tokens: 1000000, // 1M tokens
      computeUnits: 1000, // 1000 compute units
      memory: 1024 * 1024 * 1024, // 1GB memory
      storage: 1024 * 1024 * 100 // 100MB storage
    };
    logger.info('ResourceManager initialized', { maxResources: this.maxResources });
  }

  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  public async allocateResources(requirements: ResourceRequirements): Promise<boolean> {
    // Check if we have enough resources
    if (
      this.currentUsage.tokens + requirements.tokens > this.maxResources.tokens ||
      this.currentUsage.computeUnits + requirements.computeUnits > this.maxResources.computeUnits ||
      this.currentUsage.memory + requirements.memory > this.maxResources.memory ||
      this.currentUsage.storage + requirements.storage > this.maxResources.storage
    ) {
      logger.warn('Resource allocation failed - insufficient resources', {
        requirements,
        currentUsage: this.currentUsage,
        maxResources: this.maxResources
      });
      return false;
    }

    // Allocate resources
    this.currentUsage.tokens += requirements.tokens;
    this.currentUsage.computeUnits += requirements.computeUnits;
    this.currentUsage.memory += requirements.memory;
    this.currentUsage.storage += requirements.storage;

    logger.info('Resources allocated', {
      requirements,
      currentUsage: this.currentUsage
    });

    return true;
  }

  public async releaseResources(requirements: ResourceRequirements): Promise<void> {
    // Release resources
    this.currentUsage.tokens -= requirements.tokens;
    this.currentUsage.computeUnits -= requirements.computeUnits;
    this.currentUsage.memory -= requirements.memory;
    this.currentUsage.storage -= requirements.storage;

    logger.info('Resources released', {
      requirements,
      currentUsage: this.currentUsage
    });
  }

  public getCurrentUsage(): ResourceUsage {
    return { ...this.currentUsage };
  }

  public getMaxResources(): ResourceUsage {
    return { ...this.maxResources };
  }
} 