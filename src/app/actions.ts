'use server'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// 1. Initialize Supabase
const supabase = createClient(
  'https://yafbojytyunwunpivcv.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZmhib2p5dHl1bnd1bnBpdmN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3NzU2MDYsImV4cCI6MjA4MzM1MTYwNn0.ton9t3PlZ96r_fEl-wFc4392VCc8LJ0nv4WY3rr4hZQ' // <--- PUT YOUR KEY HERE
);

// 2. Initialize AI
const google = createGoogleGenerativeAI({
  apiKey: 'AIzaSyBBqaUxW6lGdinulJ8nHlvI7wzyNxmQfNM4', 
});

export async function createAITask(prompt: string) {
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'), 
      schema: z.object({
        title: z.string(),
        priority: z.enum(['Low', 'Medium', 'High']),
      }),
      prompt: `Extract task info: "${prompt}"`,
    });

    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: object.title, priority: object.priority, status: 'todo' }])
      .select();

    if (error) throw error;
    return data[0]; 
  } catch (error: any) {
    console.error("AI Error:", error.message);
    return { title: prompt, priority: "Medium", status: 'todo' };
  }
}

export async function deleteAllTasks() {
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

// NEW: This updates the status in the database
export async function toggleTaskStatus(id: string, currentStatus: string) {
  const newStatus = currentStatus === 'done' ? 'todo' : 'done';
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', id)
    .select();
    
  if (error) throw error;
  return data[0];
}