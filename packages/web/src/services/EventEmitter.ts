type EventHandler = (...args: any[]) => void;

export class EventEmitter {
  private events: Map<string, EventHandler[]>;
  private onceEvents: Map<string, Set<EventHandler>>;

  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }

  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(handler);
  }

  once(event: string, handler: EventHandler): void {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set());
    }
    this.onceEvents.get(event)!.add(handler);
  }

  emit(event: string, ...args: any[]): void {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }

    const onceHandlers = this.onceEvents.get(event);
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        handler(...args);
        onceHandlers.delete(handler);
      });
      if (onceHandlers.size === 0) {
        this.onceEvents.delete(event);
      }
    }
  }

  removeListener(event: string, handler: EventHandler): void {
    const handlers = this.events.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
      if (handlers.length === 0) {
        this.events.delete(event);
      }
    }

    const onceHandlers = this.onceEvents.get(event);
    if (onceHandlers) {
      onceHandlers.delete(handler);
      if (onceHandlers.size === 0) {
        this.onceEvents.delete(event);
      }
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
      this.onceEvents.delete(event);
    } else {
      this.events.clear();
      this.onceEvents.clear();
    }
  }
} 