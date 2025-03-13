import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTaskContext } from './TaskContext';
import { Task, TaskStatus, Priority } from '../types';
import aiService from '../services/aiService';

type AssistantRecommendation = {
  id: string;
  type: 'prioritization' | 'scheduling' | 'delegation' | 'decomposition' | 'pattern';
  message: string;
  actionText: string;
  action?: () => Promise<void>;
  applied: boolean;
  taskIds: string[];
};

type TimeSlot = {
  startTime: Date;
  endTime: Date;
  productivity: number; // 0-10 scale based on user's completion history
  suggestion?: string;
};

type ProductivityPattern = {
  dayOfWeek: number;
  hourOfDay: number;
  productivityScore: number;
};

type TaskAssistantContextType = {
  isAnalyzing: boolean;
  recommendations: AssistantRecommendation[];
  applyRecommendation: (id: string) => Promise<void>;
  dismissRecommendation: (id: string) => void;
  optimalTimeSlots: TimeSlot[];
  productivityPatterns: ProductivityPattern[];
  generateTaskDecomposition: (taskId: string) => Promise<string[]>;
  getContextualPrompt: (taskId: string) => Promise<string>;
  similarTaskHistory: (taskId: string) => Promise<Task[]>;
  analyzeProductivity: () => void;
  aiInsights: string;
};

const TaskAssistantContext = createContext<TaskAssistantContextType | undefined>(undefined);

export const TaskAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tasks, updateTask } = useTaskContext();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<AssistantRecommendation[]>([]);
  const [optimalTimeSlots, setOptimalTimeSlots] = useState<TimeSlot[]>([]);
  const [productivityPatterns, setProductivityPatterns] = useState<ProductivityPattern[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  
  // Analyze tasks and generate intelligent recommendations
  useEffect(() => {
    if (tasks.length > 0) {
      analyzeTasksAndGenerateRecommendations();
    }
  }, [tasks]);

  const analyzeTasksAndGenerateRecommendations = async () => {
    setIsAnalyzing(true);
    
    try {
      const newRecommendations: AssistantRecommendation[] = [];
      
      // Use AI to analyze task patterns if we have enough tasks
      if (tasks.length >= 3) {
        try {
          const aiAnalysis = await aiService.analyzeTaskPatterns(tasks);
          setAiInsights(aiAnalysis);
          
          // Add AI-based recommendation
          newRecommendations.push({
            id: 'ai-insight-' + Date.now(),
            type: 'pattern',
            message: "I've analyzed your tasks and found some productivity patterns and insights.",
            actionText: "View AI Analysis",
            action: async () => {
              // This would show a modal with the AI analysis in a real implementation
            },
            applied: false,
            taskIds: tasks.map(t => t.id)
          });
        } catch (error) {
          console.error("Error calling AI service:", error);
          // Fallback to regular recommendations
        }
      }
      
      // Find overdue tasks
      const overdueHighPriorityTasks = tasks.filter(
        task => task.status !== TaskStatus.COMPLETED && 
               task.deadline && 
               task.deadline < new Date() &&
               task.priority === Priority.HIGH
      );
      
      if (overdueHighPriorityTasks.length > 0) {
        newRecommendations.push({
          id: 'overdue-' + Date.now(),
          type: 'prioritization',
          message: `You have ${overdueHighPriorityTasks.length} overdue high-priority tasks that need immediate attention.`,
          actionText: "Focus on these first",
          action: async () => {
            // Implementation would show these tasks in a special focus mode
          },
          applied: false,
          taskIds: overdueHighPriorityTasks.map(t => t.id)
        });
      }
      
      // Find task clusters that could be batched together
      const similarTasks = findSimilarTaskClusters(tasks);
      if (similarTasks.length > 2) {
        newRecommendations.push({
          id: 'batch-' + Date.now(),
          type: 'pattern',
          message: `I've identified ${similarTasks.length} similar tasks that could be batched together for better efficiency.`,
          actionText: "Create task batch",
          applied: false,
          taskIds: similarTasks.map(t => t.id)
        });
      }
      
      // Generate optimal schedule based on user's productivity patterns and task deadlines
      const optimizedSchedule = generateOptimalSchedule(tasks);
      if (optimizedSchedule.length > 0) {
        newRecommendations.push({
          id: 'schedule-' + Date.now(),
          type: 'scheduling',
          message: "I've analyzed your productivity patterns and created an optimized schedule for your tasks.",
          actionText: "View optimized schedule",
          applied: false,
          taskIds: tasks.map(t => t.id)
        });
      }
      
      setOptimalTimeSlots(optimizedSchedule);
      setRecommendations(prev => [...prev, ...newRecommendations]);
    } catch (error) {
      console.error("Error analyzing tasks:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const findSimilarTaskClusters = (tasks: Task[]): Task[] => {
    // AI-powered task similarity detection would go here
    // For now return a sample implementation
    const keywords = ['report', 'email', 'meeting', 'design'];
    const result: Task[] = [];
    
    keywords.forEach(keyword => {
      const matches = tasks.filter(task => 
        task.title.toLowerCase().includes(keyword) ||
        (task.description && task.description.toLowerCase().includes(keyword))
      );
      
      if (matches.length >= 2) {
        result.push(...matches);
      }
    });
    
    return result;
  };
  
  const generateOptimalSchedule = (tasks: Task[]): TimeSlot[] => {
    // Algorithm to generate optimal time slots based on user's past productivity
    // This would use machine learning in a real implementation
    
    // Generate sample time slots for now
    const now = new Date();
    const slots: TimeSlot[] = [];
    
    for (let i = 0; i < 5; i++) {
      const startTime = new Date(now);
      startTime.setHours(9 + i * 2, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1, 30, 0, 0);
      
      const productivity = Math.min(10, Math.max(1, 5 + Math.floor(Math.random() * 5)));
      
      slots.push({
        startTime,
        endTime,
        productivity,
        suggestion: productivity > 8 
          ? "Focus on complex tasks" 
          : productivity > 5 
          ? "Good for moderate difficulty tasks" 
          : "Best for simple tasks"
      });
    }
    
    return slots;
  };
  
  const applyRecommendation = async (id: string) => {
    const recommendation = recommendations.find(r => r.id === id);
    if (!recommendation) return;
    
    if (recommendation.action) {
      await recommendation.action();
    }
    
    setRecommendations(prev => 
      prev.map(r => r.id === id ? { ...r, applied: true } : r)
    );
  };
  
  const dismissRecommendation = (id: string) => {
    setRecommendations(prev => prev.filter(r => r.id !== id));
  };
  
  const analyzeProductivity = () => {
    // Generate mock productivity patterns by day and hour
    const patterns: ProductivityPattern[] = [];
    
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour < 20; hour += 2) {
        // Generate a productivity score between 1-10
        // In a real app this would be calculated from task completion history
        const baseScore = day === 0 || day === 6 ? 5 : 7; // Lower on weekends
        const timeBonus = (hour >= 9 && hour <= 11) ? 2 : (hour >= 14 && hour <= 16 ? 1 : 0);
        const variation = Math.random() * 2 - 1; // -1 to 1
        
        const productivityScore = Math.min(10, Math.max(1, baseScore + timeBonus + variation));
        
        patterns.push({
          dayOfWeek: day,
          hourOfDay: hour,
          productivityScore: Math.round(productivityScore * 10) / 10
        });
      }
    }
    
    setProductivityPatterns(patterns);
  };
  
  const generateTaskDecomposition = async (taskId: string): Promise<string[]> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return [];
    
    try {
      // Use AI service to decompose the task
      return await aiService.decomposeTask(task.title, task.description);
    } catch (error) {
      console.error("Error generating task decomposition:", error);
      
      // Fallback to predefined subtasks if AI fails
      if (task.title.toLowerCase().includes('report')) {
        return [
          'Gather data for report', 
          'Create outline', 
          'Write first draft', 
          'Add charts and visuals',
          'Review for errors',
          'Share for feedback'
        ];
      } else if (task.title.toLowerCase().includes('meeting')) {
        return [
          'Create agenda', 
          'Send invitations', 
          'Prepare presentation',
          'Set up meeting room/link',
          'Follow up with minutes'
        ];
      } else {
        return [
          'Research ' + task.title,
          'Create initial plan',
          'Execute main component',
          'Review and refine',
          'Finalize ' + task.title
        ];
      }
    }
  };
  
  const getContextualPrompt = async (taskId: string): Promise<string> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return '';
    
    // Generate a starting point for the task based on its type and title
    // In a real app, this could use an LLM API to generate smart prompts
    
    if (task.title.toLowerCase().includes('report')) {
      return `# ${task.title} \n\n## Executive Summary\n\n[Insert brief overview of key findings]\n\n## Background\n\n[Context of why this report was needed]\n\n## Findings\n\n1. [Key finding one]\n2. [Key finding two]\n3. [Key finding three]\n\n## Recommendations\n\n* [Recommendation one]\n* [Recommendation two]\n\n## Next Steps\n\n[Action items to take]`;
    } else if (task.title.toLowerCase().includes('email')) {
      return `Subject: ${task.title}\n\nDear [Recipient],\n\nI hope this email finds you well. I'm writing regarding [purpose].\n\n[Key points]\n\n[Request or next steps]\n\nThank you for your time and consideration.\n\nBest regards,\n[Your Name]`;
    } else if (task.title.toLowerCase().includes('presentation')) {
      return `# ${task.title}\n\n## Introduction\n* Who we are\n* Purpose of this presentation\n\n## Current Situation\n* Key metrics\n* Challenges faced\n\n## Proposal\n* Our solution\n* Benefits\n* Implementation\n\n## Next Steps\n* Action items\n* Timeline\n\n## Q&A`;
    }
    
    return `# ${task.title}\n\n## Objectives\n\n- \n- \n\n## Notes\n\n- \n- \n\n## Action Items\n\n- \n- `;
  };
  
  const similarTaskHistory = async (taskId: string): Promise<Task[]> => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return [];
    
    // Find similar tasks based on title and description
    // This would use more sophisticated NLP in a real implementation
    
    return tasks.filter(t => 
      t.id !== taskId && (
        t.title.toLowerCase().includes(task.title.toLowerCase()) ||
        (task.description && t.description && 
         t.description.toLowerCase().includes(task.description.toLowerCase()))
      )
    ).slice(0, 3); // Limit to 3 related tasks
  };

  return (
    <TaskAssistantContext.Provider value={{
      isAnalyzing,
      recommendations,
      applyRecommendation,
      dismissRecommendation,
      optimalTimeSlots,
      productivityPatterns,
      generateTaskDecomposition,
      getContextualPrompt,
      similarTaskHistory,
      analyzeProductivity,
      aiInsights
    }}>
      {children}
    </TaskAssistantContext.Provider>
  );
};

export const useTaskAssistant = () => {
  const context = useContext(TaskAssistantContext);
  if (context === undefined) {
    throw new Error('useTaskAssistant must be used within a TaskAssistantProvider');
  }
  return context;
};
