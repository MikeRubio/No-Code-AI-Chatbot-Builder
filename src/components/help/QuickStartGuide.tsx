import { useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  Info,
  Code,
  Lightbulb,
  HelpCircle,
  ArrowRight,
  Star,
  X,
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

export interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  action?: string;
  code?: string;
  warning?: string;
  note?: string;
}

export interface QuickStartGuide {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  icon: string;
  steps: QuickStartStep[];
  tips: string[];
  troubleshooting: Array<{
    problem: string;
    solution: string;
  }>;
  nextSteps: string[];
}

interface QuickStartGuideProps {
  guide: QuickStartGuide;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickStartGuideComponent({
  guide,
  isOpen,
  onClose,
}: QuickStartGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const handleStepComplete = (stepIndex: number) => {
    setCompletedSteps((prev) => new Set([...prev, stepIndex]));
    if (stepIndex < guide.steps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const handleStepNavigation = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Add dark variants for badge backgrounds and text
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-green-600 bg-green-100 dark:text-green-200 dark:bg-green-900";
      case "intermediate":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-200 dark:bg-yellow-900";
      case "advanced":
        return "text-red-600 bg-red-100 dark:text-red-200 dark:bg-red-900";
      default:
        return "text-gray-600 bg-gray-100 dark:text-gray-200 dark:bg-gray-800";
    }
  };

  const currentStepData = guide.steps[currentStep];
  const progress = (completedSteps.size / guide.steps.length) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-6xl max-h-[90vh] bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {guide.title}
              </h1>
              <span
                className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(
                  guide.difficulty
                )}`}
              >
                {guide.difficulty}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {guide.estimatedTime}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              {guide.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-300">Progress</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {completedSteps.size} of {guide.steps.length} steps completed
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Step Navigation Sidebar */}
          <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Steps
              </h3>
              <div className="space-y-2">
                {guide.steps.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => handleStepNavigation(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                      currentStep === index
                        ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                        : completedSteps.has(index)
                        ? "bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-800"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      {completedSteps.has(index) ? (
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-300" />
                      ) : (
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${
                            currentStep === index
                              ? "border-blue-600 dark:border-blue-400 bg-blue-100 dark:bg-blue-900"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {currentStep === index && (
                            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full m-0.5" />
                          )}
                        </div>
                      )}
                      <span className="font-medium">Step {index + 1}</span>
                    </div>
                    <div className="text-xs line-clamp-2 ml-6">
                      {step.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Step Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    Step {currentStep + 1}: {currentStepData.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {currentStepData.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentStep(
                        Math.min(guide.steps.length - 1, currentStep + 1)
                      )
                    }
                    disabled={currentStep === guide.steps.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Step Content */}
              <div className="space-y-6">
                {/* Action */}
                {currentStepData.action && (
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Action Required
                    </h4>
                    <div className="text-blue-800 dark:text-blue-100 text-sm whitespace-pre-wrap">
                      {currentStepData.action}
                    </div>
                  </div>
                )}

                {/* Code Example */}
                {currentStepData.code && (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <h4 className="font-medium text-white mb-3 flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      Code Example
                    </h4>
                    <pre className="text-green-400 text-sm overflow-x-auto">
                      <code>{currentStepData.code}</code>
                    </pre>
                  </div>
                )}

                {/* Warning */}
                {currentStepData.warning && (
                  <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-2 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Important Warning
                    </h4>
                    <p className="text-orange-800 dark:text-orange-100 text-sm">
                      {currentStepData.warning}
                    </p>
                  </div>
                )}

                {/* Note */}
                {currentStepData.note && (
                  <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Note
                    </h4>
                    <p className="text-blue-800 dark:text-blue-100 text-sm">
                      {currentStepData.note}
                    </p>
                  </div>
                )}

                {/* Step Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    {!completedSteps.has(currentStep) && (
                      <Button
                        onClick={() => handleStepComplete(currentStep)}
                        size="sm"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </Button>
                    )}
                    {completedSteps.has(currentStep) && (
                      <div className="flex items-center text-green-600 dark:text-green-300 text-sm font-medium">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Step Completed
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {currentStep < guide.steps.length - 1 && (
                      <Button
                        size="sm"
                        onClick={() => setCurrentStep(currentStep + 1)}
                      >
                        Next Step
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                    {currentStep === guide.steps.length - 1 &&
                      completedSteps.has(currentStep) && (
                        <Button
                          size="sm"
                          onClick={onClose}
                          className="bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
                        >
                          Complete Guide
                          <CheckCircle className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              {guide.tips.length > 0 && (
                <Card className="p-6 mt-8 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    Pro Tips
                  </h3>
                  <div className="space-y-3">
                    {guide.tips.map((tip, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Star className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700 dark:text-gray-200 text-sm">
                          {tip}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Troubleshooting */}
              {guide.troubleshooting.length > 0 && (
                <Card className="p-6 mt-6 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <button
                    onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                      <HelpCircle className="w-5 h-5 mr-2 text-blue-500" />
                      Troubleshooting
                    </h3>
                    <ChevronRight
                      className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
                        showTroubleshooting ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {showTroubleshooting && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-4 space-y-4"
                    >
                      {guide.troubleshooting.map((item, index) => (
                        <div
                          key={index}
                          className="border-l-4 border-red-200 dark:border-red-800 pl-4 py-2"
                        >
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                            Problem: {item.problem}
                          </h4>
                          <p className="text-gray-700 dark:text-gray-200 text-sm">
                            <strong>Solution:</strong> {item.solution}
                          </p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </Card>
              )}

              {/* Next Steps */}
              {completedSteps.size === guide.steps.length &&
                guide.nextSteps.length > 0 && (
                  <Card className="p-6 mt-6 bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-800">
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      🎉 Congratulations! What's Next?
                    </h3>
                    <div className="space-y-3">
                      {guide.nextSteps.map((step, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <ArrowRight className="w-4 h-4 text-green-600 dark:text-green-300 mt-0.5 flex-shrink-0" />
                          <p className="text-green-800 dark:text-green-100 text-sm">
                            {step}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
