import { io, Socket } from 'socket.io-client';
import { EventEmitter } from './EventEmitter';

export interface WebSocketMessage {
  type: string;
  payload: any;
}

class WebSocketService extends EventEmitter {
  private static instance: WebSocketService;
  private socket: Socket | null = null;
  private messageQueue: { type: string; payload: any }[] = [];
  private connecting = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    super();
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private async ensureConnected(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    if (this.connecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000); // 10 second timeout

      this.once('connected', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.once('error', (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.connect();
    });

    try {
      await this.connectionPromise;
    } finally {
      this.connecting = false;
      this.connectionPromise = null;
    }
  }

  public connect(url: string = 'http://localhost:3000'): void {
    if (this.socket) {
      return;
    }

    console.log('Connecting to Socket.IO server at:', url);

    this.socket = io(url, {
      path: '/api/socket',
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Socket.IO connected');
      this.emit('connected');
      this.processQueue();
    });

    this.socket.on('disconnect', () => {
      console.log('Socket.IO disconnected');
      this.emit('disconnected');
    });

    this.socket.on('error', (error: Error) => {
      console.error('Socket.IO error:', error);
      this.emit('error', error);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket.IO connection error:', error);
      this.emit('error', error);
    });

    // Handle all incoming messages
    this.socket.onAny((eventName, payload) => {
      this.emit(eventName, payload);
    });
  }

  private async processQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) {
        try {
          await this.send(message.type, message.payload, false);
        } catch (error) {
          console.error('Failed to process queued message:', error);
          this.messageQueue.unshift(message); // Put the message back at the start of the queue
          break;
        }
      }
    }
  }

  public async send(type: string, payload: any, shouldQueue: boolean = true): Promise<void> {
    try {
      await this.ensureConnected();
      if (!this.socket?.connected) {
        throw new Error('Socket.IO is not connected');
      }
      this.socket.emit(type, payload);
    } catch (error) {
      if (shouldQueue) {
        console.log('Queueing message for later delivery:', { type, payload });
        this.messageQueue.push({ type, payload });
      } else {
        throw error;
      }
    }
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const wsService = WebSocketService.getInstance(); 