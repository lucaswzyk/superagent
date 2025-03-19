import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { GodNode } from '@superagent/agents';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling request:', err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Handle chat messages
    socket.on('chat_message', async (data) => {
      try {
        const godNode = GodNode.getInstance();
        const result = await godNode.processUserRequest({
          type: 'chat',
          content: data.content,
        });

        socket.emit('chat_message', {
          id: Date.now().toString(),
          role: 'assistant',
          content: result,
          timestamp: new Date(),
          status: 'sent',
        });
      } catch (error) {
        console.error('Error processing chat message:', error);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    // Handle metrics requests
    socket.on('get_metrics', async () => {
      try {
        const godNode = GodNode.getInstance();
        const metrics = godNode.getMetrics();
        socket.emit('metrics_update', metrics);
      } catch (error) {
        console.error('Error getting metrics:', error);
        // Send empty metrics to avoid client waiting
        socket.emit('metrics_update', {
          activeAgents: 0,
          totalTasks: 0,
          successRate: 0,
          averageResponseTime: 0,
          resourceUsage: {
            tokens: 0,
            computeUnits: 0,
            memory: 0,
            storage: 0
          },
          lastUpdated: new Date()
        });
      }
    });

    // Handle agent list requests
    socket.on('get_agents', async () => {
      try {
        const godNode = GodNode.getInstance();
        const agents = await godNode.getAgents();
        socket.emit('agents_update', agents);
      } catch (error) {
        console.error('Error getting agents:', error);
        // Send empty agents list to avoid client waiting
        socket.emit('agents_update', []);
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 