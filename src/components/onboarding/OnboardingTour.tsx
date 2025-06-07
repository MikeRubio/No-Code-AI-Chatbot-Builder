import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { useProfile } from '../../hooks/useProfile';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const onboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to BotBuilder Pro!',
    description: 'Let\'s take a quick tour to get you started with building your first AI chatbot.',
    target: '.dashboard-welcome',
    position: 'bottom'
  },
  {
    id: 'create-bot',
    title: 'Create Your First Bot',
    description: 'Click here to start building your first chatbot. You can create different types of bots for various purposes.',
    target: '.create-bot-button',
    position: 'left'
  },
  {
    id: 'sidebar-nav',
    title: 'Navigation Menu',
    description: 'Use this sidebar to navigate between your dashboard, chatbots, analytics, and settings.',
    target: '.sidebar-nav',
    position: 'right'
  },
  {
    id: 'analytics',
    title: 'Track Performance',
    description: 'Monitor your chatbot\'s performance with detailed analytics and insights.',
    target: '.analytics-link',
    position: 'right'
  },
  {
    id: 'upgrade',
    title: 'Upgrade for More Features',
    description: 'Start with our free plan and upgrade anytime to unlock more chatbots and advanced features.',
    target: '.upgrade-banner',
    position: 'top'
  }
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
      const element = document.querySelector(onboardingSteps[currentStep].target) as HTMLElement;
      setTargetElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.position = 'relative';
        element.style.zIndex = '1001';
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
    onboardingSteps.forEach(step => {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        element.style.zIndex = '';
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
          <div className="fixed inset-0 bg-black/50 z-1000" />
          
          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-1002 bg-white rounded-xl shadow-2xl p-6 max-w-sm"
            style={{
              top: targetElement ? getTooltipPosition(targetElement, step.position).top : '50%',
              left: targetElement ? getTooltipPosition(targetElement, step.position).left : '50%',
              transform: targetElement ? 'none' : 'translate(-50%, -50%)',
            }}
          >
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-1 mb-4">
              <div 
                className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Content */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Step counter */}
            <div className="text-xs text-gray-500 mb-4">
              Step {currentStep + 1} of {onboardingSteps.length}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={skipTour}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Skip tour
              </button>
              
              <div className="flex items-center space-x-2">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back
                  </Button>
                )}
                
                <Button
                  size="sm"
                  onClick={nextStep}
                >
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

            {/* Close button */}
            <button
              onClick={skipTour}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
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

  switch (position) {
    case 'top':
      return {
        top: rect.top - tooltipHeight - offset,
        left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
      };
    case 'bottom':
      return {
        top: rect.bottom + offset,
        left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
      };
    case 'left':
      return {
        top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
        left: rect.left - tooltipWidth - offset,
      };
    case 'right':
      return {
        top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
        left: rect.right + offset,
      };
    default:
      return {
        top: rect.bottom + offset,
        left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
      };
  }
}