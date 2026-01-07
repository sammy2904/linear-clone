'use server'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

// We create a helper function so createClient only runs when called
const getSupabase = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  );
};

export async function createAITask(prompt: string) {
  const supabase = getSupabase();
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
  });

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
    return { title: prompt, priority: "Medium", status: 'todo' };
  }
}

export async function deleteAllTasks() {
  const supabase = getSupabase();
  await supabase.from('tasks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

export async function toggleTaskStatus(id: string, currentStatus: string) {
  const supabase = getSupabase();
  const newStatus = currentStatus === 'done' ? 'todo' : 'done';
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', id)
    .select();
  if (error) throw error;
  return data[0];
}