"use client"
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react"
import { createAITask, deleteAllTasks, toggleTaskStatus } from "./actions" 
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, LayoutGrid, CheckCircle2, Circle } from "lucide-react"

export default function Home() {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  useEffect(() => {
    const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://placeholder.supabase.co';
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || isPlaceholder) return;

    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setTasks(data);
    };

    fetchTasks();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);
  
  const handleCreateAI = async () => {
    if (!inputValue) return;
    setIsLoading(true);
    try {
      const aiTask = await createAITask(inputValue); 
      setTasks(prev => [aiTask, ...prev]);
      setShowInput(false);
      setInputValue("");
    } catch (error) {
      alert("AI failed to process.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#08090a] text-zinc-400 font-sans">
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-4 space-y-4">
        <div className="flex items-center space-x-2 px-2 pb-4 text-white font-medium">
          <div className="w-6 h-6 bg-zinc-700 rounded-sm" />
          <span>Linear Clone</span>
        </div>
        <nav className="space-y-1">
          <div className="flex items-center space-x-3 px-2 py-1.5 rounded-md bg-zinc-800 text-white cursor-pointer">
            <LayoutGrid size={16} /> <span>Issues</span>
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6">
          <h2 className="text-white font-medium">All Issues</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={async () => { await deleteAllTasks(); setTasks([]); }} className="text-zinc-500 hover:text-red-400">Clear All</Button>
            <Button onClick={() => setShowInput(true)} variant="secondary" size="sm" className="bg-white text-black hover:bg-zinc-200">
              <PlusCircle className="mr-2 h-4 w-4" /> New Issue
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-4 max-w-4xl">
          <div className="relative">
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-4 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700 transition-colors"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2 mb-4">
            {["All", "High", "Medium", "Low"].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(p)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  filterPriority === p 
                    ? "bg-zinc-800 text-white border border-zinc-700" 
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {showInput && (
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-700 space-y-3">
              <input 
                className="w-full bg-transparent text-white outline-none" 
                placeholder="Describe task..." 
                autoFocus 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
              />
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>Cancel</Button>
                <Button size="sm" className="bg-blue-600 text-white" onClick={handleCreateAI} disabled={isLoading}>
                  {isLoading ? "Thinking..." : "Create with AI"}
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {tasks
              .filter(task => {
                const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesPriority = filterPriority === "All" || task.priority === filterPriority;
                return matchesSearch && matchesPriority;
              })
              .map((task, index) => (
              <Card key={task.id || index} className="bg-transparent border-zinc-800 hover:bg-zinc-900/50 p-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    onClick={async () => {
                      const updated = await toggleTaskStatus(task.id, task.status);
                      setTasks(tasks.map(t => t.id === task.id ? updated : t));
                    }}
                    className="cursor-pointer hover:text-blue-500"
                  >
                    {task.status === 'done' ? <CheckCircle2 size={16} className="text-blue-500" /> : <Circle size={16} />}
                  </div>
                  <span className="text-zinc-500 text-sm w-12">LIN-{tasks.length - index}</span>
                  <span className={`${task.status === 'done' ? 'line-through text-zinc-600' : 'text-zinc-200'} text-sm`}>
                    {task.title}
                  </span>
                </div>
                <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px] uppercase">
                  {task.priority}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}