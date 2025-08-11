'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AgentModal from '@/components/agents/AgentModal';
import ConfirmationModal from '@/components/agents/ConfirmationModal';
import { Agent } from '@/lib/types';
import { PlusCircle, Edit, Trash2, Bot, BrainCircuit, Mic, Ear, Calendar } from 'lucide-react';

export default function AgentsPage() {
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/agents');
        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }
        const data = await response.json() as Agent[];
        setAgents(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const handleAgentSaved = (savedAgent: Agent) => {
    if (selectedAgent) {
      // Editing existing agent
      setAgents(prevAgents => prevAgents.map(agent => agent.id === savedAgent.id ? savedAgent : agent));
    } else {
      // Creating new agent
      setAgents(prevAgents => [savedAgent, ...prevAgents]);
    }
    setSelectedAgent(null);
  };

  const openEditModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsAgentModalOpen(true);
  };

  const openDeleteModal = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsDeleteModalOpen(true);
  };
  
  const closeDeleteModal = () => {
    setSelectedAgent(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteAgent = async () => {
    if (!selectedAgent) return;

    try {
      const response = await fetch(`/api/agents?id=${selectedAgent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      setAgents(prevAgents => prevAgents.filter(agent => agent.id !== selectedAgent.id));
      closeDeleteModal();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">Your AI Agents</h1>
        <Button onClick={() => { setSelectedAgent(null); setIsAgentModalOpen(true); }} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 rounded-full px-6 py-3 text-lg font-semibold transition-transform transform hover:scale-105">
          <PlusCircle className="mr-2 h-6 w-6" />
                  Create New Agent
        </Button>
              </div>

      <AgentModal
        isOpen={isAgentModalOpen}
        onClose={() => { setIsAgentModalOpen(false); setSelectedAgent(null); }}
        onAgentSaved={handleAgentSaved}
        agent={selectedAgent}
      />

      {selectedAgent && (
        <ConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={closeDeleteModal}
            onConfirm={handleDeleteAgent}
            title={`Delete "${selectedAgent.name}"?`}
            description="This action is irreversible. The agent will be permanently deleted from Vapi and our database."
        />
      )}

      {isLoading && <p className="text-center text-lg text-gray-500 dark:text-gray-400 animate-pulse">Summoning your agents...</p>}
      {error && <p className="text-center text-lg text-red-600 dark:text-red-400">Error: {error}</p>}
      
      {!isLoading && !error && agents.length === 0 && (
        <div className="text-center py-20 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800/50">
            <Bot size={64} className="mx-auto text-indigo-400 mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Your Agent Roster is Empty</h3>
            <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Click "Create New Agent" to assemble your first AI assistant.</p>
                  </div>
      )}

      {!isLoading && !error && agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex flex-col p-6 relative group">
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 truncate">{agent.name}</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm text-ellipsis overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{agent.description || 'No description provided.'}</p>
                <div className="mt-5 border-t border-gray-200 dark:border-gray-700 pt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
                  <div className="flex items-center"><BrainCircuit size={14} className="mr-2 text-purple-500" /><span>{agent.model_provider}</span></div>
                  <div className="flex items-center"><Mic size={14} className="mr-2 text-emerald-500" /><span>{agent.voice_provider}</span></div>
                  <div className="flex items-center"><Ear size={14} className="mr-2 text-blue-500" /><span>{agent.transcriber_provider}</span></div>
                  </div>
                </div>
              <div className="absolute top-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button variant="ghost" size="sm" onClick={() => openEditModal(agent)} className="p-2 h-7 w-7 rounded-full">
                    <Edit className="h-4 w-4"/>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openDeleteModal(agent)} className="p-2 h-7 w-7 text-red-500 hover:text-red-600 rounded-full">
                    <Trash2 className="h-4 w-4"/>
                </Button>
            </div>
          </div>
          ))}
        </div>
      )}
    </div>
  );
} 