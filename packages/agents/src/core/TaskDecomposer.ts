import { OpenAI } from 'openai';
import { z } from 'zod';

export interface SubTask {
  id: string;
  description: string;
  requiredCapabilities: string[];
  dependencies: string[];  // IDs of other subtasks this depends on
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
}

export interface Task {
  id: string;
  description: string;
  subtasks: SubTask[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

const SubTaskSchema = z.object({
  description: z.string(),
  requiredCapabilities: z.array(z.string()),
  dependencies: z.array(z.string()),
});

export class TaskDecomposer {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async decomposeTask(taskDescription: string): Promise<Task> {
    const systemPrompt = `You are a task decomposition expert. Given a high-level task description, break it down into logical subtasks.
For each subtask, identify:
1. A clear description of what needs to be done
2. The capabilities required (e.g., text-generation, image-generation, code-generation, etc.)
3. Dependencies on other subtasks

Format your response as a JSON array of subtasks, each with:
- description: string
- requiredCapabilities: string[]
- dependencies: string[] (empty array if no dependencies)`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: taskDescription },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = response.choices[0].message.content;
    if (!result) throw new Error('Failed to decompose task');

    try {
      const parsedSubtasks = JSON.parse(result).subtasks.map((subtask: any) =>
        SubTaskSchema.parse(subtask)
      );

      const task: Task = {
        id: crypto.randomUUID(),
        description: taskDescription,
        subtasks: parsedSubtasks.map((subtask: any) => ({
          id: crypto.randomUUID(),
          ...subtask,
          status: 'pending',
        })),
        status: 'pending',
      };

      return task;
    } catch (error) {
      throw new Error(`Failed to parse subtasks: ${error}`);
    }
  }

  getNextSubtasks(task: Task): SubTask[] {
    // Get subtasks that are ready to be executed (all dependencies completed)
    return task.subtasks.filter((subtask) => {
      if (subtask.status !== 'pending') return false;
      
      return subtask.dependencies.every((depId) => {
        const dependency = task.subtasks.find((st) => st.id === depId);
        return dependency?.status === 'completed';
      });
    });
  }

  updateSubtaskStatus(task: Task, subtaskId: string, status: SubTask['status'], result?: any): Task {
    const updatedTask = { ...task };
    const subtask = updatedTask.subtasks.find((st) => st.id === subtaskId);
    
    if (!subtask) throw new Error(`Subtask ${subtaskId} not found`);
    
    subtask.status = status;
    if (result !== undefined) subtask.result = result;

    // Update overall task status
    if (updatedTask.subtasks.every((st) => st.status === 'completed')) {
      updatedTask.status = 'completed';
    } else if (updatedTask.subtasks.some((st) => st.status === 'failed')) {
      updatedTask.status = 'failed';
    } else if (updatedTask.subtasks.some((st) => st.status === 'in_progress')) {
      updatedTask.status = 'in_progress';
    }

    return updatedTask;
  }
} 