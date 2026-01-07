'use server'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ADD THIS PART:
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY!,
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