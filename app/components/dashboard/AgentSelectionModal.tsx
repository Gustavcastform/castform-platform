'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
// TODO: Find and import Dialog and Select components
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Agent {
  id: string;
  name: string;
}

interface AgentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgent: (agentId: string) => void;
  contactNumber: string;
}

export function AgentSelectionModal({ isOpen, onClose, onSelectAgent, contactNumber }: AgentSelectionModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch('/api/agents')
        .then(res => res.json() as Promise<Agent[]>)
        .then(data => {
          setAgents(data);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Failed to fetch agents:', error);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  const handleSelect = () => {
    if (selectedAgent) {
      onSelectAgent(selectedAgent);
    }
  };

  // TODO: Implement a proper modal UI
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg">
        <h2 className="text-lg font-bold mb-4">Select Agent for Call</h2>
        <div>
          <p className="mb-2">You are calling: <strong>{contactNumber}</strong></p>
          {isLoading ? (
            <p>Loading agents...</p>
          ) : (
            <select onChange={(e) => setSelectedAgent(e.target.value)} value={selectedAgent} className="w-full p-2 border rounded">
              <option value="" disabled>Select an agent</option>
              {agents.map(agent => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSelect} disabled={!selectedAgent || isLoading}>
            Start Call
          </Button>
        </div>
      </div>
    </div>
  );
}
