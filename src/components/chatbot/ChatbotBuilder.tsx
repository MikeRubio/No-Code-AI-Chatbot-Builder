import React, { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import ReactFlow, {
  Node,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  MessageSquare,
  Save,
  Upload,
  TestTube,
  Share,
  Globe,
  BarChart3,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { useChatbots } from "../../hooks/useChatbots";
import { useProfile } from "../../hooks/useProfile";
import { useParams, useNavigate } from "react-router-dom";
import { ChatbotSimulator } from "./ChatbotSimulator";
import { FAQUploader } from "./FAQUploader";
import { WhatsAppSetup } from "../integrations/WhatsAppSetup";
import { MultiChannelSetup } from "../integrations/MultiChannelSetup";
import { ABTestManager } from "../analytics/ABTestManager";
import { CustomNode } from "./nodes/CustomNode";
import { NodePropertiesPanel } from "./NodePropertiesPanel";
import { TemplateSelector } from "./TemplateSelector";
import { ChatbotTemplate } from "../../data/chatbotTemplates";
import toast from "react-hot-toast";
import { nodeTypeDefinitions } from "./utils";

// Custom node types for React Flow
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};
// Custom edge style
const edgeTypes: EdgeTypes = {};

const defaultEdgeOptions = {
  style: { strokeWidth: 2, stroke: "#6366f1" },
  type: "smoothstep",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#6366f1",
  },
};

function ChatbotBuilderContent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reactFlowInstance = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showFAQUploader, setShowFAQUploader] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [showMultiChannelSetup, setShowMultiChannelSetup] = useState(false);
  const [showABTestManager, setShowABTestManager] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [skippedTemplate, setSkippedTemplate] = useState(false);
  const [chatbotName, setChatbotName] = useState("");
  const [chatbotDescription, setChatbotDescription] = useState("");
  // const [draggedNodeType, setDraggedNodeType] = useState<string | null>(null);

  const {
    chatbots,
    createChatbotAsync,
    updateChatbot,
    publishChatbot,
    isCreating,
    isUpdating,
  } = useChatbots();
  const { profile } = useProfile();

  const currentChatbot = id ? chatbots.find((bot) => bot.id === id) : null;

  // Show template selector for new chatbots
  useEffect(() => {
    if (
      !id &&
      nodes.length === 0 &&
      !showTemplateSelector &&
      !skippedTemplate
    ) {
      setShowTemplateSelector(true);
    }
  }, [id, nodes.length, showTemplateSelector, skippedTemplate]);

  // Load chatbot data on mount
  useEffect(() => {
    if (currentChatbot) {
      setChatbotName(currentChatbot.name);
      setChatbotDescription(currentChatbot.description || "");
      if (currentChatbot.flow_data?.nodes) {
        const flowNodes = currentChatbot.flow_data.nodes.map((node: Node) => ({
          id: node.id,
          type: "custom",
          position: node.position || { x: 100, y: 100 },
          data: {
            ...node.data,
            nodeType: node.type,
            onEdit: handleNodeEdit,
            onDelete: handleNodeDelete,
            isSelected: false,
          },
        }));

        const flowEdges = currentChatbot.flow_data.edges || [];

        setNodes(flowNodes);
        setEdges(flowEdges);
      }
    } else if (!id) {
      // New chatbot - reset everything
      setNodes([]);
      setEdges([]);
      setChatbotName("");
      setChatbotDescription("");
      setSelectedNode(null);
    }
    // eslint-disable-next-line
  }, [currentChatbot, id]);

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      // Update all nodes to show selection state
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isSelected: n.id === node.id,
          },
        }))
      );
    },
    [setNodes]
  );

  // Handle edge connection
  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        id: `edge-${params.source}-${params.target}`,
        ...defaultEdgeOptions,
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  // Handle drag over canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle node editing
  const handleNodeEdit = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: {
              ...n.data,
              isSelected: n.id === nodeId,
            },
          }))
        );
      }
    },
    [nodes, setNodes]
  );

  // Handle node deletion
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  // Update node properties
  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  ...newData,
                },
              }
            : node
        )
      );
    },
    [setNodes]
  );

  // Handle template selection
  const handleTemplateSelect = useCallback(
    (template: ChatbotTemplate) => {
      setChatbotName(template.name);
      setChatbotDescription(template.description);

      // Convert template nodes to React Flow format
      const templateNodes = template.flow.nodes.map((node: Node) => ({
        id: node.id,
        type: "custom",
        position: node.position,
        data: {
          ...node.data,
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete,
          isSelected: false,
        },
      }));

      setNodes(templateNodes);
      setEdges(template.flow.edges);
      setShowTemplateSelector(false);

      toast.success(`${template.name} template loaded successfully!`);
    },
    [setNodes, setEdges, handleNodeEdit, handleNodeDelete]
  );

  // Handle drop on canvas
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const nodeTypeDef = nodeTypeDefinitions.find((def) => def.type === type);
      if (!nodeTypeDef) return;

      // Check if user can use this node type
      if (nodeTypeDef.requiresPro && profile?.plan === "free") {
        toast.error(
          "This feature requires a Pro plan. Please upgrade to continue."
        );
        return;
      }

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type: "custom",
        position,
        data: {
          nodeType: type,
          label: nodeTypeDef.title,
          content: "",
          options: [],
          onEdit: handleNodeEdit,
          onDelete: handleNodeDelete,
          isSelected: false,
        },
      };

      setNodes((nds) => nds.concat(newNode));
      // setDraggedNodeType(null);
    },
    [
      reactFlowInstance,
      profile?.plan,
      handleNodeEdit,
      handleNodeDelete,
      setNodes,
    ]
  );

  // Save chatbot flow
  const handleSave = async () => {
    if (!chatbotName.trim()) {
      toast.error("Please enter a chatbot name");
      return;
    }
    // Convert React Flow nodes back to our format
    const flowData = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.nodeType,
        position: node.position,
        data: {
          label: node.data.label,
          content: node.data.content,
          options: node.data.options,
          actionType: node.data.actionType,
          fields: node.data.fields,
          conditions: node.data.conditions,
          apiConfig: node.data.apiConfig,
          surveyConfig: node.data.surveyConfig,
          fileConfig: node.data.fileConfig,
          handoffConfig: node.data.handoffConfig,
        },
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(edge.sourceHandle && { sourceHandle: edge.sourceHandle }),
        ...(edge.targetHandle && { targetHandle: edge.targetHandle }),
      })),
    };

    const chatbotData = {
      name: chatbotName,
      description: chatbotDescription,
      flow_data: flowData,
      settings: {},
    };

    if (currentChatbot) {
      updateChatbot({
        id: currentChatbot.id,
        updates: chatbotData,
      });
    } else {
      // Check plan limits for new chatbots
      if (profile?.plan === "free" && chatbots.length >= 1) {
        toast.error(
          "Free plan allows only 1 chatbot. Please upgrade to create more."
        );
        return;
      }

      try {
        const result = await createChatbotAsync(chatbotData);
        if (result && result.id) {
          navigate(`/chatbots/${result.id}/edit`);
        } else {
          toast.error("Failed to create chatbot. Please try again.");
        }
      } catch (err) {
        if (err instanceof Error) {
          toast.error(err.message || "Failed to create chatbot");
        } else {
          toast.error("Failed to create chatbot");
        }
      }
    }
  };

  // Publish chatbot
  const handlePublish = () => {
    if (!currentChatbot) {
      toast.error("Please save the chatbot first");
      return;
    }

    if (nodes.length === 0) {
      toast.error("Please add at least one node to your chatbot flow");
      return;
    }

    publishChatbot(currentChatbot.id);
  };

  // Check if user can use a feature
  const canUseFeature = (feature: string) => {
    if (!profile) return false;

    const proFeatures = [
      "ai_response",
      "whatsapp",
      "faq_upload",
      "appointment",
      "action",
      "conditional",
      "survey",
      "file_upload",
      "api_webhook",
      "human_handoff",
    ];
    return profile.plan !== "free" || !proFeatures.includes(feature);
  };

  // Handle drag start for node types
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    // setDraggedNodeType(nodeType);
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex bg-gray-950">
      {/* Sidebar */}
      <aside className="h-[90vh] w-80 bg-gray-900 border-r border-gray-800 flex-shrink-0 overflow-y-auto">
        <div className="p-6 space-y-6">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">
            Chatbot Settings
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                value={chatbotName}
                onChange={(e) => setChatbotName(e.target.value)}
                placeholder="My Awesome Chatbot"
                className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={chatbotDescription}
                onChange={(e) => setChatbotDescription(e.target.value)}
                placeholder="Describe what your chatbot does..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-900 text-gray-100"
              />
            </div>
          </div>
          <Button
            className="w-full"
            variant="primary"
            onClick={handleSave}
            disabled={isCreating || isUpdating}
          >
            <Save className="w-4 h-4 mr-2" />
            {isCreating || isUpdating ? "Saving..." : "Save Flow"}
          </Button>
          {currentChatbot && (
            <>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setShowSimulator(true)}
              >
                <TestTube className="w-4 h-4 mr-2" />
                Test Bot
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={handlePublish}
              >
                <Share className="w-4 h-4 mr-2" />
                Publish
              </Button>
            </>
          )}
          {currentChatbot && canUseFeature("faq_upload") && (
            <div>
              <h3 className="text-lg font-semibold text-gray-100 mt-8 mb-4">
                Advanced Features
              </h3>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowFAQUploader(true)}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload FAQ
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowMultiChannelSetup(true)}
              >
                <Globe className="w-4 h-4 mr-2" />
                Multi-Channel Deploy
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowABTestManager(true)}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                A/B Testing
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowWhatsAppSetup(true)}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp Setup
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col">
        {/* Node selection bar */}
        <div className="sticky top-0 z-20 bg-gray-950 border-b border-gray-800 px-8 py-4 flex gap-8 overflow-x-auto">
          {["flow", "basic", "ai", "data", "action"].map((category) => (
            <div
              key={category}
              className="flex flex-col items-center min-w-[140px]"
            >
              <span className="text-xs font-semibold text-gray-200 mb-2 capitalize">
                {category === "ai"
                  ? "AI Features"
                  : category === "data"
                  ? "Data Collection"
                  : category}
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-2xl  bg-gray-900/40 px-3 py-2">
                {nodeTypeDefinitions
                  .filter((nodeType) => nodeType.category === category)
                  .map((nodeType) => (
                    <motion.div
                      key={nodeType.type}
                      draggable={canUseFeature(nodeType.type)}
                      onDragStart={(e) => onDragStart(e, nodeType.type)}
                      whileHover={{
                        scale: canUseFeature(nodeType.type) ? 1.05 : 1,
                      }}
                      whileTap={{
                        scale: canUseFeature(nodeType.type) ? 0.95 : 1,
                      }}
                      className="inline-block shrink-0"
                    >
                      <Card
                        hover={canUseFeature(nodeType.type)}
                        className="p-2 w-32 min-w-32 box-border text-center bg-white/10 dark:bg-gray-900/70 border border-gray-500 dark:border-gray-700 rounded-xl"
                      >
                        <div
                          className={`w-6 h-6 bg-gradient-to-r ${nodeType.color} rounded-lg flex items-center justify-center mx-auto mb-1`}
                        >
                          <nodeType.icon className="w-3 h-3 text-white" />
                        </div>
                        <p className="text-xs font-medium text-gray-100">
                          {nodeType.title}
                        </p>
                        {nodeType.requiresPro && profile?.plan === "free" && (
                          <p className="text-xs text-orange-400 mt-1">Pro</p>
                        )}
                      </Card>
                    </motion.div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Canvas area */}
        <div className="flex-1 min-h-0 relative overflow-hidden">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={defaultEdgeOptions}
              fitView
              className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950"
            >
              <Background color="#e5e7eb" gap={20} />
              <Controls />
              <MiniMap
                nodeColor="#6366f1"
                maskColor="rgba(255, 255, 255, 0.8)"
                className="bg-white/70 dark:bg-gray-900/80 backdrop-blur-sm"
              />
              {/* Empty state */}
              {nodes.length === 0 && (
                <Panel className="mt-44" position="top-center">
                  <div className="text-center bg-white/70 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl p-8 shadow-lg">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      Start Building Your Advanced Chatbot
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4 max-w-md">
                      Choose from professional templates or drag and drop nodes
                      to create sophisticated conversation flows
                    </p>
                    <div className="flex space-x-3 justify-center">
                      <Button onClick={() => setShowTemplateSelector(true)}>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Browse Templates
                      </Button>
                      <Button variant="outline">Start from Scratch</Button>
                    </div>
                  </div>
                </Panel>
              )}
            </ReactFlow>

            {/* Node Properties Panel */}
            {selectedNode && (
              <NodePropertiesPanel
                node={selectedNode}
                onUpdate={(data) => updateNodeData(selectedNode.id, data)}
                onClose={() => {
                  setSelectedNode(null);
                  setNodes((nds) =>
                    nds.map((n) => ({
                      ...n,
                      data: {
                        ...n.data,
                        isSelected: false,
                      },
                    }))
                  );
                }}
              />
            )}

            <TemplateSelector
              isOpen={showTemplateSelector}
              onClose={() => setShowTemplateSelector(false)}
              onSelectTemplate={handleTemplateSelect}
              setSkippedTemplate={setSkippedTemplate}
            />

            {/* Modals */}
            {currentChatbot && (
              <>
                <ChatbotSimulator
                  chatbot={currentChatbot}
                  flow={{ nodes, edges }}
                  isOpen={showSimulator}
                  onClose={() => setShowSimulator(false)}
                />

                <Modal
                  isOpen={showFAQUploader}
                  onClose={() => setShowFAQUploader(false)}
                  title="Upload FAQ Documents"
                  size="lg"
                >
                  <FAQUploader
                    chatbotId={currentChatbot.id}
                    onUploadComplete={() => {
                      setShowFAQUploader(false);
                      toast.success("FAQ documents uploaded successfully!");
                    }}
                  />
                </Modal>

                <MultiChannelSetup
                  chatbotId={currentChatbot.id}
                  isOpen={showMultiChannelSetup}
                  onClose={() => setShowMultiChannelSetup(false)}
                />

                <ABTestManager
                  chatbotId={currentChatbot.id}
                  isOpen={showABTestManager}
                  onClose={() => setShowABTestManager(false)}
                />

                <WhatsAppSetup
                  chatbotId={currentChatbot.id}
                  isOpen={showWhatsAppSetup}
                  onClose={() => setShowWhatsAppSetup(false)}
                />
              </>
            )}
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}

export function ChatbotBuilder() {
  return (
    <ReactFlowProvider>
      <ChatbotBuilderContent />
    </ReactFlowProvider>
  );
}
