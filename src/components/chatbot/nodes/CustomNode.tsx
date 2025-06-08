import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import {
  MessageSquare,
  HelpCircle,
  Zap,
  Play,
  User,
  Calendar,
  Edit3,
  Trash2,
  Brain,
} from "lucide-react";

interface CustomNodeData {
  nodeType: string;
  label: string;
  content?: string;
  options?: string[];
  actionType?: string;
  fields?: any[];
  onEdit: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  isSelected: boolean;
}

const nodeIcons = {
  start: Play,
  message: MessageSquare,
  question: HelpCircle,
  ai_response: Brain,
  lead_capture: User,
  appointment: Calendar,
  action: Zap,
};

const nodeColors = {
  start: "from-green-500 to-green-600",
  message: "from-blue-500 to-blue-600",
  question: "from-purple-500 to-purple-600",
  ai_response: "from-indigo-500 to-indigo-600",
  lead_capture: "from-pink-500 to-pink-600",
  appointment: "from-orange-500 to-orange-600",
  action: "from-red-500 to-red-600",
};

export const CustomNode = memo<NodeProps<CustomNodeData>>(
  ({ id, data, selected }) => {
    const Icon =
      nodeIcons[data.nodeType as keyof typeof nodeIcons] || MessageSquare;
    const colorClass =
      nodeColors[data.nodeType as keyof typeof nodeColors] ||
      "from-gray-500 to-gray-600";

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      data.onEdit(id);
    };

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this node?")) {
        data.onDelete(id);
      }
    };

    const getPreviewText = () => {
      if (data.content) {
        return data.content.length > 50
          ? data.content.substring(0, 50) + "..."
          : data.content;
      }
      if (data.options && data.options.length > 0) {
        return `${data.options.length} option${
          data.options.length > 1 ? "s" : ""
        }`;
      }
      return "Click to configure";
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className={`relative bg-white rounded-xl shadow-lg border-2 transition-all duration-200 ${
          selected || data.isSelected
            ? "border-blue-500 shadow-xl"
            : "border-gray-200 hover:border-gray-300"
        }`}
        style={{ width: 250, minHeight: 100 }}
      >
        {/* Input Handle */}
        {data.nodeType !== "start" && (
          <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 bg-gray-400 border-2 border-white"
          />
        )}

        {/* Node Content */}
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 bg-gradient-to-r ${colorClass} rounded-lg flex items-center justify-center`}
              >
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-gray-900 text-sm">
                {data.label}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Edit node"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                title="Delete node"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="text-xs text-gray-600 leading-relaxed">
            {getPreviewText()}
          </div>

          {/* Node Type Badge */}
          <div className="mt-2">
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
              {data.nodeType.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Output Handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-blue-500 border-2 border-white"
        />
      </motion.div>
    );
  }
);

CustomNode.displayName = "CustomNode";
