import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "../ui/Button";
import { useProfile } from "../../hooks/useProfile";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to BotForge!",
    description:
      "Let's take a quick tour to get you started with building your first AI chatbot.",
    target: ".dashboard-welcome",
    position: "bottom",
  },
  {
    id: "create-bot",
    title: "Create Your First Bot",
    description:
      "Click here to start building your first chatbot. You can create different types of bots for various purposes.",
    target: ".create-bot-button",
    position: "left",
  },
  {
    id: "analytics",
    title: "Track Performance",
    description:
      "Monitor your chatbot's performance with detailed analytics and insights.",
    target: ".analytics-link",
    position: "right",
  },
  {
    id: "upgrade",
    title: "Upgrade for More Features",
    description:
      "Start with our free plan and upgrade anytime to unlock more chatbots and advanced features.",
    target: ".upgrade-banner",
    position: "top",
  },
];

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const { profile, completeOnboarding } = useProfile();

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      setIsVisible(true);
    }
  }, [profile]);

  useEffect(() => {
    if (isVisible && onboardingSteps[currentStep]) {
      const element = document.querySelector(
        onboardingSteps[currentStep].target
      ) as HTMLElement;
      setTargetElement(element);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.style.position = "relative";
        element.style.zIndex = "1001";
      }
    }
  }, [currentStep, isVisible]);

  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const finishOnboarding = () => {
    setIsVisible(false);
    completeOnboarding();

    // Reset z-index for all elements
    onboardingSteps.forEach((step) => {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        element.style.zIndex = "";
      }
    });
  };

  const skipTour = () => {
    finishOnboarding();
  };

  if (!isVisible || !onboardingSteps[currentStep]) return null;

  const step = onboardingSteps[currentStep];
  const progress = ((currentStep + 1) / onboardingSteps.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[9999] backdrop-blur-sm"
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed z-[10000] bg-white/90 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl p-7 max-w-md w-full backdrop-blur-xl"
            style={{
              top: targetElement
                ? getTooltipPosition(targetElement, step.position).top
                : "50%",
              left: targetElement
                ? getTooltipPosition(targetElement, step.position).left
                : "50%",
              transform: targetElement ? "none" : "translate(-50%, -50%)",
            }}
          >
            {/* Blue accent bar */}
            <div className="absolute top-0 left-0 w-full h-1 rounded-t-2xl bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500" />

            {/* Close button */}
            <button
              onClick={skipTour}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/60 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400 dark:text-gray-300" />
            </button>

            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-1 mb-6 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full"
                style={{ width: `${progress}%` }}
                layout
                transition={{ type: "spring", stiffness: 200, damping: 24 }}
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {step.title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Step counter */}
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Step {currentStep + 1} of {onboardingSteps.length}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={skipTour}
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-sm font-medium underline underline-offset-2 transition"
              >
                Skip tour
              </button>
              <div className="flex items-center space-x-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    className="rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                <Button size="sm" onClick={nextStep} className="rounded-lg">
                  {currentStep === onboardingSteps.length - 1 ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getTooltipPosition(element: HTMLElement, position: string) {
  const rect = element.getBoundingClientRect();
  const tooltipWidth = 320; // max-w-sm
  const tooltipHeight = 200; // approximate
  const offset = 16;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  let top = 0;
  let left = 0;
  let finalPosition = position;

  // Preferred positions
  switch (position) {
    case "top":
      top = rect.top - tooltipHeight - offset;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      top = rect.bottom + offset;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - offset;
      break;
    case "right":
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + offset;
      break;
    default:
      top = rect.bottom + offset;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
  }
  // Flip if out of bounds (right/left)
  if (position === "right" && left + tooltipWidth > viewportWidth - 8) {
    // Not enough space on right, try left
    left = rect.left - tooltipWidth - offset;
    finalPosition = "left";
  } else if (position === "left" && left < 8) {
    // Not enough space on left, try right
    left = rect.right + offset;
    finalPosition = "right";
  }

  // Flip if out of bounds (top/bottom)
  if (position === "top" && top < 8) {
    // Not enough space on top, try bottom
    top = rect.bottom + offset;
    finalPosition = "bottom";
  } else if (
    position === "bottom" &&
    top + tooltipHeight > viewportHeight - 8
  ) {
    // Not enough space on bottom, try top
    top = rect.top - tooltipHeight - offset;
    finalPosition = "top";
  }

  // Clamp to viewport as a last resort
  top = Math.max(8, Math.min(top, viewportHeight - tooltipHeight - 8));
  left = Math.max(8, Math.min(left, viewportWidth - tooltipWidth - 8));

  return { top, left, position: finalPosition };
}
