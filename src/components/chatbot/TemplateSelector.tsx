import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  HelpCircle,
  Target,
  Calendar,
  Star,
  Clock,
  Users,
  ArrowRight,
  Check,
  Filter,
  Search,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { chatbotTemplates, ChatbotTemplate } from "../../data/chatbotTemplates";

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ChatbotTemplate) => void;
  setSkippedTemplate: React.Dispatch<React.SetStateAction<boolean>>;
}

const iconMap = {
  Building2,
  HelpCircle,
  Target,
  Calendar,
};

const difficultyColors = {
  beginner: "text-green-600 bg-green-100 dark:text-green-200 dark:bg-green-900",
  intermediate:
    "text-yellow-600 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900",
  advanced: "text-red-600 bg-red-100 dark:text-red-200 dark:bg-red-900",
};

export function TemplateSelector({
  isOpen,
  onClose,
  onSelectTemplate,
  setSkippedTemplate,
}: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTemplate, setSelectedTemplate] =
    useState<ChatbotTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const categories = [
    { id: "all", name: "All Templates", count: chatbotTemplates.length },
    {
      id: "business",
      name: "Business",
      count: chatbotTemplates.filter((t) => t.category === "business").length,
    },
    {
      id: "support",
      name: "Support",
      count: chatbotTemplates.filter((t) => t.category === "support").length,
    },
    {
      id: "sales",
      name: "Sales",
      count: chatbotTemplates.filter((t) => t.category === "sales").length,
    },
    {
      id: "general",
      name: "General",
      count: chatbotTemplates.filter((t) => t.category === "general").length,
    },
  ];

  const difficulties = [
    { id: "all", name: "All Levels" },
    { id: "beginner", name: "Beginner" },
    { id: "intermediate", name: "Intermediate" },
    { id: "advanced", name: "Advanced" },
  ];

  const filteredTemplates = chatbotTemplates.filter((template) => {
    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" ||
      template.difficulty === selectedDifficulty;
    const matchesSearch =
      searchTerm === "" ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const handleSelectTemplate = (template: ChatbotTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handlePreviewTemplate = (template: ChatbotTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSkippedTemplate(true);
          onClose();
        }}
        title="Choose a Template"
        size="xl"
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Start with a Professional Template
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Choose from our collection of proven chatbot templates designed
              for different use cases
            </p>
          </div>

          {/* Search and Filters */}
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
            </div>
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category.count})
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                >
                  {difficulties.map((difficulty) => (
                    <option key={difficulty.id} value={difficulty.id}>
                      {difficulty.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-h-96 overflow-y-auto">
            {filteredTemplates.map((template, index) => {
              const IconComponent =
                iconMap[template.icon as keyof typeof iconMap] || Building2;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card
                    hover
                    className="p-6 h-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 bg-gradient-to-r ${template.color} rounded-xl flex items-center justify-center`}
                      >
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            difficultyColors[template.difficulty]
                          }`}
                        >
                          {template.difficulty}
                        </span>
                        {template.difficulty === "beginner" && (
                          <Star className="w-4 h-4 text-yellow-500" />
                        )}
                      </div>
                    </div>

                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {template.name}
                    </h4>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                      {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{template.tags.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <Users className="w-3 h-3 mr-1" />
                        {template.flow.nodes.length} nodes
                      </div>
                      <div className="flex items-center text-xs text-gray-600 dark:text-gray-300">
                        <Check className="w-3 h-3 mr-1" />
                        Advanced features included
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewTemplate(template)}
                        className="flex-1"
                      >
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSelectTemplate(template)}
                        className="flex-1"
                      >
                        Use Template
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No templates found
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Try adjusting your search criteria or browse all templates
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                  setSelectedDifficulty("all");
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                All templates are fully customizable after selection
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSkippedTemplate(true);
                  onClose();
                }}
              >
                Start from Scratch
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Template Preview Modal */}
      {showPreview && selectedTemplate && (
        <TemplatePreviewModal
          template={selectedTemplate}
          onClose={() => setShowPreview(false)}
          onSelect={() => handleSelectTemplate(selectedTemplate)}
        />
      )}
    </>
  );
}

interface TemplatePreviewModalProps {
  template: ChatbotTemplate;
  onClose: () => void;
  onSelect: () => void;
}

function TemplatePreviewModal({
  template,
  onClose,
  onSelect,
}: TemplatePreviewModalProps) {
  const IconComponent =
    iconMap[template.icon as keyof typeof iconMap] || Building2;

  return (
    <Modal isOpen={true} onClose={onClose} title="Template Preview" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start space-x-4">
          <div
            className={`w-16 h-16 bg-gradient-to-r ${template.color} rounded-xl flex items-center justify-center flex-shrink-0`}
          >
            <IconComponent className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                {template.name}
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  difficultyColors[template.difficulty]
                }`}
              >
                {template.difficulty}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-3">
              {template.description}
            </p>
            <div className="flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Flow Overview */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Flow Overview
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {template.flow.nodes.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Total Nodes
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {
                  template.flow.nodes.filter(
                    (n) => n.data.nodeType === "lead_capture"
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Lead Capture
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {
                  template.flow.nodes.filter(
                    (n) => n.data.nodeType === "conditional"
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Conditions
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {
                  template.flow.nodes.filter(
                    (n) => n.data.nodeType === "api_webhook"
                  ).length
                }
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                Integrations
              </div>
            </div>
          </div>
        </div>
        {/* Node Types */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Included Features
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {Array.from(
              new Set(template.flow.nodes.map((n) => n.data.nodeType))
            ).map((nodeType) => (
              <div
                key={nodeType}
                className="flex items-center space-x-2 text-sm"
              >
                <Check className="w-4 h-4 text-green-500 dark:text-green-300" />
                <span className="text-gray-700 dark:text-gray-200 capitalize">
                  {nodeType.replace("_", " ")} Node
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sample Flow */}
        <div>
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
            Sample Conversation Flow
          </h4>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
            {template.flow.nodes.slice(0, 5).map((node, index) => (
              <div key={node.id} className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {node.data.label}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {node.data.content?.substring(0, 100)}
                    {node.data.content?.length > 100 && "..."}
                  </div>
                </div>
              </div>
            ))}
            {template.flow.nodes.length > 5 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                +{template.flow.nodes.length - 5} more steps...
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close Preview
          </Button>
          <Button onClick={onSelect} className="flex-1">
            Use This Template
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
