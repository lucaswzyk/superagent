import { EventEmitter } from 'events';
import { logger } from '../utils/logger';

export class KnowledgeGraph extends EventEmitter {
  private static instance: KnowledgeGraph;
  private nodes: Map<string, any>;
  private relationships: Map<string, Set<string>>;

  private constructor() {
    super();
    this.nodes = new Map();
    this.relationships = new Map();
    logger.info('KnowledgeGraph initialized');
  }

  public static getInstance(): KnowledgeGraph {
    if (!KnowledgeGraph.instance) {
      KnowledgeGraph.instance = new KnowledgeGraph();
    }
    return KnowledgeGraph.instance;
  }

  public addNode(id: string, data: any): void {
    this.nodes.set(id, data);
    this.relationships.set(id, new Set());
    logger.info('Node added to knowledge graph', { nodeId: id });
  }

  public addRelationship(fromId: string, toId: string): void {
    const fromRelationships = this.relationships.get(fromId);
    if (fromRelationships) {
      fromRelationships.add(toId);
      logger.info('Relationship added to knowledge graph', { fromId, toId });
    }
  }

  public getNode(id: string): any {
    return this.nodes.get(id);
  }

  public getRelationships(id: string): Set<string> {
    return this.relationships.get(id) || new Set();
  }

  public removeNode(id: string): void {
    this.nodes.delete(id);
    this.relationships.delete(id);
    // Remove relationships pointing to this node
    for (const relationships of this.relationships.values()) {
      relationships.delete(id);
    }
    logger.info('Node removed from knowledge graph', { nodeId: id });
  }
} 