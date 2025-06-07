import { create } from 'zustand';

export interface ChatbotNode {
  id: string;
  type: 'start' | 'message' | 'question' | 'ai_response' | 'lead_capture' | 'appointment' | 'action';
  position: { x: number; y: number };
  data: {
    label: string;
    content?: string;
    options?: string[];
    actionType?: string;
    fields?: any[];
    systemPrompt?: string;
  };
}

export interface ChatbotEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: string;
}

export interface ChatbotFlow {
  nodes: ChatbotNode[];
  edges: ChatbotEdge[];
}

interface ChatbotState {
  currentBot: any | null;
  flow: ChatbotFlow;
  selectedNode: string | null;
  isDirty: boolean;
  setCurrentBot: (bot: any) => void;
  setFlow: (flow: ChatbotFlow) => void;
  setSelectedNode: (nodeId: string | null) => void;
  addNode: (node: ChatbotNode) => void;
  updateNode: (nodeId: string, data: Partial<ChatbotNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  addEdge: (edge: ChatbotEdge) => void;
  deleteEdge: (edgeId: string) => void;
  setDirty: (dirty: boolean) => void;
  resetFlow: () => void;
}

export const useChatbotStore = create<ChatbotState>((set, get) => ({
  currentBot: null,
  flow: { nodes: [], edges: [] },
  selectedNode: null,
  isDirty: false,
  
  setCurrentBot: (bot) => set({ currentBot: bot }),
  
  setFlow: (flow) => set({ flow, isDirty: false }),
  
  setSelectedNode: (nodeId) => set({ selectedNode: nodeId }),
  
  addNode: (node) =>
    set((state) => ({
      flow: {
        ...state.flow,
        nodes: [...state.flow.nodes, node],
      },
      isDirty: true,
    })),
    
  updateNode: (nodeId, data) =>
    set((state) => ({
      flow: {
        ...state.flow,
        nodes: state.flow.nodes.map((node) =>
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        ),
      },
      isDirty: true,
    })),
    
  deleteNode: (nodeId) =>
    set((state) => ({
      flow: {
        nodes: state.flow.nodes.filter((node) => node.id !== nodeId),
        edges: state.flow.edges.filter(
          (edge) => edge.source !== nodeId && edge.target !== nodeId
        ),
      },
      selectedNode: state.selectedNode === nodeId ? null : state.selectedNode,
      isDirty: true,
    })),
    
  addEdge: (edge) =>
    set((state) => ({
      flow: {
        ...state.flow,
        edges: [...state.flow.edges, edge],
      },
      isDirty: true,
    })),
    
  deleteEdge: (edgeId) =>
    set((state) => ({
      flow: {
        ...state.flow,
        edges: state.flow.edges.filter((edge) => edge.id !== edgeId),
      },
      isDirty: true,
    })),
    
  setDirty: (dirty) => set({ isDirty: dirty }),
  
  resetFlow: () => set({ 
    flow: { nodes: [], edges: [] }, 
    selectedNode: null, 
    isDirty: false 
  }),
}));