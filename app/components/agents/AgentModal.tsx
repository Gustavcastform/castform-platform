'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { promptTemplates, PromptTemplate } from '../../lib/prompt-templates';
import { Agent } from '@/lib/types';

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentSaved: (agent: Agent) => void;
  agent?: Agent | null; // If provided, we're editing; if not, we're creating
}

const transcribers = {
  deepgram: ['nova-2', 'nova-3'],
  google: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash-preview-05-20'],
  openai: ['gpt-4o-transcribe', 'gpt-4o-mini-transcribe'],
};

const models = {
  openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  anthropic: [
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ],
  google: ['gemini-1.5-pro-latest', 'gemini-1.5-flash-latest'],
};

const voices = {
  deepgram: ['asteria', 'luna', 'stella'],
  '11labs': ['burt', 'marissa', 'andrea'],
  openai: ['alloy', 'echo', 'fable'],
};

type TranscriberProvider = keyof typeof transcribers;
type ModelProvider = keyof typeof models;
type VoiceProvider = keyof typeof voices;

export default function AgentModal({
  isOpen,
  onClose,
  onAgentSaved,
  agent,
}: AgentModalProps) {
  const isEditing = !!agent;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentGoal, setAgentGoal] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [websiteSummary, setWebsiteSummary] = useState('');
  const [tone, setTone] = useState('neutral');
  const [pacing, setPacing] = useState('normal');
  const [transcriberProvider, setTranscriberProvider] =
    useState<TranscriberProvider>('deepgram');
  const [transcriberModel, setTranscriberModel] = useState('nova-2');
  const [modelProvider, setModelProvider] = useState<ModelProvider>('openai');
  const [modelName, setModelName] = useState('gpt-4o');
  const [voiceProvider, setVoiceProvider] = useState<VoiceProvider>('deepgram');
  const [voiceId, setVoiceId] = useState('asteria');
  const [firstMessage, setFirstMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [tool, setTool] = useState('none');

  // Reset form when modal opens/closes or agent changes
  useEffect(() => {
    if (isOpen) {
      if (agent) {
        // Editing mode - populate with agent data
        setName(agent.name);
        setDescription(agent.description || '');
        setAgentGoal(agent.agent_goal || '');
        setWebsiteUrl(agent.website_url || '');
        setWebsiteSummary(agent.website_summary || '');
        setTone(agent.tone || 'neutral');
        setPacing(agent.pacing || 'normal');
        setTranscriberProvider(agent.transcriber_provider as TranscriberProvider);
        setTranscriberModel(agent.transcriber_model);
        setModelProvider(agent.model_provider as ModelProvider);
        setModelName(agent.model_name);
        setVoiceProvider(agent.voice_provider as VoiceProvider);
        setVoiceId(agent.voice_id);
        setFirstMessage(agent.first_message || '');
        setTool(agent.tool || 'none');
      } else {
        // Creating mode - reset to defaults
        setName('');
        setDescription('');
        setAgentGoal('');
        setWebsiteUrl('');
        setWebsiteSummary('');
        setTone('neutral');
        setPacing('normal');
        setTranscriberProvider('deepgram');
        setTranscriberModel('nova-2');
        setModelProvider('openai');
        setModelName('gpt-4o');
        setVoiceProvider('deepgram');
        setVoiceId('asteria');
        setFirstMessage('');
        setTool('none');
      }
    }
  }, [isOpen, agent]);

  const handleProviderChange = <T extends TranscriberProvider | ModelProvider | VoiceProvider>(
    value: T,
    setter: React.Dispatch<React.SetStateAction<T>>,
    modelSetter: React.Dispatch<React.SetStateAction<string>>,
    modelMap: Record<string, string[]>
  ) => {
    setter(value);
    modelSetter(modelMap[value][0]);
  };

  const handleSummarize = async () => {
    if (!websiteUrl) {
      toast.error('Please enter a website URL to summarize.');
      return;
    }
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl }),
      });

      if (response.ok) {
        const data = await response.json() as { summary: string };
        setWebsiteSummary(data.summary);
        toast.success('Website summarized successfully!');
      } else {
        toast.error('Failed to summarize website.');
      }
    } catch (error) {
      toast.error('Error summarizing website.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      ...(isEditing && { id: agent.id }),
      name,
      description,
      agent_goal: agentGoal,
      website_url: websiteUrl,
      website_summary: websiteSummary,
      tone,
      pacing,
      tool,
      transcriber_provider: transcriberProvider,
      transcriber_model: transcriberModel,
      model_provider: modelProvider,
      model_name: modelName,
      voice_provider: voiceProvider,
      voice_id: voiceId,
      first_message: firstMessage,
    };

    try {
      const response = await fetch('/api/agents', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error: string };
        toast.error(errorData.error || `An unknown error occurred while ${isEditing ? 'updating' : 'creating'} the agent.`);
        return;
      }

      const result = await response.json() as { agent?: Agent };
      toast.success(`Agent ${isEditing ? 'updated' : 'created'} successfully!`);
      
      if (isEditing) {
        // For editing, we need to fetch the updated agent or construct it
        onAgentSaved({ ...agent, ...payload } as Agent);
      } else {
        // For creating, the API returns the new agent
        onAgentSaved(result.agent!);
      }
      
      onClose();
    } catch (err: any) {
      toast.error('A network error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl border border-gray-700 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Agent' : 'Create New Agent'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6">
          <div className="space-y-8">
            {/* Section 1: Agent Identity */}
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Agent Identity</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input 
                    id="name" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white" 
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">Description (Optional)</label>
                  <textarea 
                    id="description" 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white" 
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Behavior & Knowledge */}
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Behavior & Knowledge</h3>
              <div className="space-y-4">
                <div>
                  <div>
                    <label htmlFor="promptTemplate" className="block text-sm font-medium text-gray-300 mb-1">Prompt Template (Optional)</label>
                    <select 
                      id="promptTemplate" 
                      onChange={e => {
                        const selectedTemplate = promptTemplates.find((t: PromptTemplate) => t.id === e.target.value);
                        if (selectedTemplate) {
                          setAgentGoal(selectedTemplate.prompt);
                        }
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white mb-2"
                    >
                      <option value="">Select a template...</option>
                      {promptTemplates.map((template: PromptTemplate) => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                  <label htmlFor="agentGoal" className="block text-sm font-medium text-gray-300 mb-1">Agent Prompt</label>
                  <textarea 
                    id="agentGoal" 
                    value={agentGoal} 
                    onChange={e => setAgentGoal(e.target.value)} 
                    required 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white" 
                    rows={3} 
                    placeholder="e.g., Schedule appointments for a dental clinic."
                  />
                </div>
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-300 mb-1">Website for Knowledge (Optional)</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="url" 
                      id="websiteUrl" 
                      value={websiteUrl} 
                      onChange={e => setWebsiteUrl(e.target.value)} 
                      className="block w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white" 
                      placeholder="https://example.com" 
                    />
                    <Button 
                      type="button" 
                      onClick={handleSummarize} 
                      disabled={isSummarizing || !websiteUrl} 
                      className="whitespace-nowrap bg-purple-600 hover:bg-purple-700 disabled:opacity-50 h-10 px-4 rounded-md"
                    >
                      {isSummarizing ? 'Summarizing...' : 'Get Summary'}
                    </Button>
                  </div>
                </div>
                {websiteSummary && (
                  <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-md">
                    <p className="text-sm text-gray-300">{websiteSummary}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-1">Tone</label>
                    <select 
                      id="tone" 
                      value={tone} 
                      onChange={e => setTone(e.target.value)} 
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white"
                    >
                      <option>neutral</option>
                      <option>formal</option>
                      <option>friendly</option>
                      <option>assertive</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="pacing" className="block text-sm font-medium text-gray-300 mb-1">Pacing</label>
                    <select 
                      id="pacing" 
                      value={pacing} 
                      onChange={e => setPacing(e.target.value)} 
                      className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white"
                    >
                      <option>normal</option>
                      <option>slow</option>
                      <option>fast</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Technical Setup */}
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Technical Setup</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Transcriber</label>
                  <select 
                    value={transcriberProvider} 
                    onChange={e => handleProviderChange(e.target.value as TranscriberProvider, setTranscriberProvider, setTranscriberModel, transcribers)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mb-2 text-white"
                  >
                    {(Object.keys(transcribers) as TranscriberProvider[]).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select 
                    value={transcriberModel} 
                    onChange={e => setTranscriberModel(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                  >
                    {transcribers[transcriberProvider].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
                  <select 
                    value={modelProvider} 
                    onChange={e => handleProviderChange(e.target.value as ModelProvider, setModelProvider, setModelName, models)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mb-2 text-white"
                  >
                    {(Object.keys(models) as ModelProvider[]).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select 
                    value={modelName} 
                    onChange={e => setModelName(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                  >
                    {models[modelProvider].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Voice</label>
                  <select 
                    value={voiceProvider} 
                    onChange={e => handleProviderChange(e.target.value as VoiceProvider, setVoiceProvider, setVoiceId, voices)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 mb-2 text-white"
                  >
                    {(Object.keys(voices) as VoiceProvider[]).map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select 
                    value={voiceId} 
                    onChange={e => setVoiceId(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                  >
                    {voices[voiceProvider].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Section 4: Tools */}
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Tools</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="tool" className="block text-sm font-medium text-gray-300 mb-1">Select a tool</label>
                  <select 
                    id="tool" 
                    value={tool} 
                    onChange={e => setTool(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white"
                  >
                    <option value="none">None</option>
                    <option value="book_meeting">Book a Meeting</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 5: Conversation Hooks */}
            <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-indigo-400 mb-4">Conversation Hooks</h3>
              <div className="space-y-4">
                <div>
                  <label htmlFor="firstMessage" className="block text-sm font-medium text-gray-300 mb-1">First Message (Optional)</label>
                  <input 
                    id="firstMessage" 
                    value={firstMessage} 
                    onChange={e => setFirstMessage(e.target.value)} 
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-indigo-500 text-white" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Type {"{{name}}"} to insert the user name.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 pt-8 sticky bottom-0 bg-gray-800 py-4">
            <Button 
              type="button" 
              onClick={onClose} 
              variant="ghost"  
              className="mr-2 text-gray-300 dark:text-white border-0 bg-red-500 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-700"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? `${isEditing ? 'Updating' : 'Creating'} Agent...` : `${isEditing ? 'Save Changes' : 'Create Agent'}`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
