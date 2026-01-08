"use client"
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react"
import { createAITask, deleteAllTasks, toggleTaskStatus } from "./actions" 
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, LayoutGrid, CheckCircle2, Circle, Trash2 } from "lucide-react"

export default function Home() {
  const [filter, setFilter] = useState<'todo' | 'done'>('todo');
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");

  // Helper for priority colors - adds "Attention to Detail"
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

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
      setShowInput(false);
      setInputValue("");
    } catch (error) {
      alert("AI failed to process.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#08090a] text-zinc-400 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-4 space-y-4 shrink-0">
        <div className="flex items-center space-x-2 px-2 pb-4 text-white font-medium">
          <div className="w-6 h-6 bg-blue-600 rounded-sm flex items-center justify-center text-[10px]">L</div>
          <span>Linear Clone</span>
        </div>
        <nav className="space-y-1">
          <div className="flex items-center space-x-3 px-2 py-1.5 rounded-md bg-zinc-800/50 text-white cursor-pointer">
            <LayoutGrid size={16} /> <span>Issues</span>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-white font-medium">All Issues</h2>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={async () => { await deleteAllTasks(); setTasks([]); }} className="text-zinc-500 hover:text-red-400">
              <Trash2 size={14} className="mr-2" /> Clear All
            </Button>
            <Button onClick={() => setShowInput(true)} variant="secondary" size="sm" className="bg-white text-black hover:bg-zinc-200">
              <PlusCircle className="mr-2 h-4 w-4" /> New Issue
            </Button>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* Status Tabs */}
          <div className="flex gap-4 border-b border-white/10 pb-2">
            <button 
              onClick={() => setFilter('todo')}
              className={`pb-2 px-1 text-sm font-medium transition-all ${filter === 'todo' ? 'border-b-2 border-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Active Issues
            </button>
            <button 
              onClick={() => setFilter('done')}
              className={`pb-2 px-1 text-sm font-medium transition-all ${filter === 'done' ? 'border-b-2 border-blue-500 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Completed
            </button>
          </div>

          {/* Search and Priority Filters */}
          <div className="space-y-4">
            <input 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-md px-4 py-2 text-sm text-zinc-200 outline-none focus:border-zinc-700 transition-colors"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <div className="flex gap-2">
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
          </div>

          {/* AI Input Area */}
          {showInput && (
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-700 space-y-3 shadow-xl animate-in fade-in zoom-in duration-200">
              <input 
                className="w-full bg-transparent text-white outline-none text-lg" 
                placeholder="What needs to be done?" 
                autoFocus 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAI()}
              />
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" size="sm" onClick={() => setShowInput(false)}>Cancel</Button>
                <Button size="sm" className="bg-blue-600 text-white" onClick={handleCreateAI} disabled={isLoading}>
                  {isLoading ? "AI is thinking..." : "Create with AI"}
                </Button>
              </div>
            </div>
          )}

          {/* Task List */}
          <div className="space-y-1">
            {tasks
              .filter(task => {
                const matchesStatus = task.status === filter;
                const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesPriority = filterPriority === "All" || task.priority === filterPriority;
                return matchesStatus && matchesSearch && matchesPriority;
              })
              .map((task, index) => (
                <Card key={task.id || index} className="bg-transparent border-transparent border-b border-zinc-800/50 hover:bg-zinc-900/30 p-3 flex items-center justify-between rounded-none group transition-colors">
                  <div className="flex items-center space-x-4">
                    <div 
                      onClick={async () => {
                        const updated = await toggleTaskStatus(task.id, task.status);
                        // The UI will update automatically via the Supabase Realtime channel
                      }}
                      className="cursor-pointer text-zinc-600 hover:text-blue-500 transition-colors"
                    >
                      {task.status === 'done' ? <CheckCircle2 size={18} className="text-blue-500" /> : <Circle size={18} />}
                    </div>
                    <span className="text-zinc-600 text-xs font-mono w-14 shrink-0">LIN-{index + 1}</span>
                    <span className={`${task.status === 'done' ? 'line-through text-zinc-600' : 'text-zinc-200'} text-sm font-medium`}>
                      {task.title}
                    </span>
                  </div>
                  <Badge variant="outline" className={`border-transparent uppercase text-[10px] font-bold ${getPriorityStyles(task.priority)}`}>
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