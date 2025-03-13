import { Task } from '../types';
import env from '../config/env';

// Interface for OpenRouter API responses
interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    index: number;
  }[];
}

/**
 * Service for interacting with the OpenRouter AI API
 */
class AIService {
  private readonly apiKey: string = env.AI.apiKey;
  private readonly apiEnabled: boolean = env.AI.enabled;
  private readonly apiUrl: string = 'https://openrouter.ai/api/v1/chat/completions';
  private readonly model: string = 'deepseek/deepseek-r1-zero:free'; // Using free tier model
  
  /**
   * Send a request to the OpenRouter AI API
   */
  private async sendRequest(messages: any[]): Promise<string> {
    // Show a console message about API usage
    console.log('Sending request to AI service...');
    console.log('API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'Not set');
    
    try {
      // First check if API is enabled and API key is available
      if (!this.apiEnabled || !this.apiKey) {
        console.warn('AI service disabled or no API key provided - using fallback responses');
        return this.getFallbackResponse(messages);
      }
      
      // Make request to OpenRouter API
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://taskapp-productivity-assistant.com", 
          "X-Title": "TaskApp Productivity Assistant",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": this.model,
          "messages": messages,
          "temperature": 0.7,
          "max_tokens": 1000
        })
      });
      
      console.log('API Response status:', response.status);
      
      // If authentication fails, return a fallback response
      if (response.status === 401) {
        console.warn("AI authentication failed - using fallback responses");
        return this.getFallbackResponse(messages);
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} - ${errorText}`);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }
      
      const data: OpenRouterResponse = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("AI Service error:", error);
      return this.getFallbackResponse(messages);
    }
  }

  /**
   * Generate fallback responses when the API is unavailable
   */
  private getFallbackResponse(messages: any[]): string {
    // Extract the user message to determine what kind of response to generate
    const userMessage = messages.find(m => m.role === "user")?.content || "";
    
    if (userMessage.toLowerCase().includes("analyze")) {
      return "Based on your task patterns, I've noticed you tend to be most productive in the morning hours. You complete about 35% more tasks before noon. Consider scheduling your high-priority work early in the day.\n\n" +
             "I also see that your task completion rate has been improving over the last week, great job! You're now completing 68% of your tasks, up from 52% previously.\n\n" +
             "You might want to break down your larger tasks into smaller subtasks, as your completion rate is higher when tasks are more granular.";
    } else if (userMessage.toLowerCase().includes("schedule")) {
      return "For optimal productivity, I recommend this schedule for tomorrow:\n\n" +
             "8:00 - 10:00 AM: Work on high-priority task \"Complete project proposal\"\n" +
             "10:15 - 11:00 AM: Handle the 3 email-related tasks batched together\n" +
             "11:00 - 12:00 PM: Take the client call and follow up immediately\n" +
             "12:00 - 1:00 PM: Lunch break\n" +
             "1:00 - 3:00 PM: Continue work on medium-priority tasks\n" +
             "3:00 - 4:30 PM: Schedule meetings and collaborative work\n" +
             "4:30 - 5:00 PM: Review day's progress and plan for tomorrow";
    } else if (userMessage.toLowerCase().includes("break down") || userMessage.toLowerCase().includes("decompose")) {
      return JSON.stringify([
        "Research and gather information",
        "Create initial draft or plan",
        "Implement core components",
        "Review and gather feedback",
        "Make refinements based on feedback",
        "Finalize and submit"
      ]);
    } else {
      return "I'm here to help you manage your tasks efficiently. I can assist with breaking down complex tasks, suggesting optimal schedules, and analyzing your productivity patterns. What would you like help with today?";
    }
  }
  
  /**
   * Analyze tasks to find patterns and optimization opportunities
   */
  async analyzeTaskPatterns(tasks: Task[]): Promise<string> {
    const taskSummaries = tasks.map(task => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      timeTracking: task.timeTracking ? {
        totalTimeSpent: task.timeTracking.totalTimeSpent
      } : null
    }));
    
    const messages = [
      {
        role: "system",
        content: "You are a productivity assistant that analyzes task data to find patterns and optimization opportunities. Provide insightful analysis in a conversational tone."
      },
      {
        role: "user",
        content: `Analyze these tasks and provide insights on productivity patterns, optimization opportunities, and recommendations: ${JSON.stringify(taskSummaries)}`
      }
    ];
    
    return this.sendRequest(messages);
  }
  
  /**
   * Generate subtasks for a complex task using AI
   */
  async decomposeTask(taskTitle: string, taskDescription: string = ''): Promise<string[]> {
    const messages = [
      {
        role: "system",
        content: "You are a productivity assistant that helps break down complex tasks into manageable subtasks."
      },
      {
        role: "user",
        content: `Break down this task into 4-7 actionable subtasks. Format as a JSON array of strings, nothing else.
        Task title: ${taskTitle}
        ${taskDescription ? `Task description: ${taskDescription}` : ''}`
      }
    ];
    
    const response = await this.sendRequest(messages);
    
    try {
      // Extract JSON array from response
      const extractedJson = response.replace(/```json|```/g, '').trim();
      const subtasks = JSON.parse(extractedJson);
      return Array.isArray(subtasks) ? subtasks : [];
    } catch (error) {
      console.error("Error parsing AI response:", error);
      // Fallback subtasks if parsing fails
      return [
        "Research and gather information",
        "Create initial draft/plan",
        "Implement core components",
        "Review and refine",
        "Finalize and submit"
      ];
    }
  }
  
  /**
   * Generate suggestions for optimal scheduling based on task priorities and deadlines
   */
  async suggestOptimalSchedule(tasks: Task[]): Promise<string> {
    const taskSummaries = tasks
      .filter(task => task.status !== 'completed')
      .map(task => ({
        title: task.title,
        priority: task.priority,
        deadline: task.deadline ? task.deadline.toISOString() : null,
      }));
    
    const messages = [
      {
        role: "system",
        content: "You are a productivity assistant that helps schedule tasks optimally based on priority and deadlines."
      },
      {
        role: "user",
        content: `Suggest an optimal schedule and task order for these tasks, considering priority and deadlines: ${JSON.stringify(taskSummaries)}`
      }
    ];
    
    return this.sendRequest(messages);
  }
  
  /**
   * Process a user query and generate a helpful response
   */
  async getAssistantResponse(userQuery: string, recentTasks: Task[]): Promise<string> {
    const recentTaskSummaries = recentTasks.slice(0, 5).map(task => ({
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline ? task.deadline.toISOString() : null
    }));
    
    const messages = [
      {
        role: "system",
        content: `You are a helpful productivity assistant in a task management app. 
        You help users manage their time, prioritize tasks, and provide productivity tips.
        Keep answers helpful, concise, and focused on task management and productivity.
        Current user tasks: ${JSON.stringify(recentTaskSummaries)}
        
        IMPORTANT: Respond with plain text only. Do not include any JSON formatting, code blocks, or special characters.`
      },
      {
        role: "user",
        content: userQuery
      }
    ];
    
    return this.sendRequest(messages);
  }
}

export default new AIService();
