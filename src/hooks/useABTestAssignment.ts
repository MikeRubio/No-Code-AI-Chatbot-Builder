import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ABTestAssignment {
  testId: string;
  variant: 'A' | 'B';
  flow: any;
}

export function useABTestAssignment(chatbotId: string, conversationId: string) {
  const [assignment, setAssignment] = useState<ABTestAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (chatbotId && conversationId) {
      assignToABTest();
    }
  }, [chatbotId, conversationId]);

  const assignToABTest = async () => {
    try {
      setIsLoading(true);

      // Check if there's an active A/B test for this chatbot
      const { data: activeTest, error: testError } = await supabase
        .from('ab_tests')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('status', 'running')
        .single();

      if (testError || !activeTest) {
        setAssignment(null);
        return;
      }

      // Check if this conversation is already assigned to a variant
      const { data: existingAssignment, error: assignmentError } = await supabase
        .from('ab_test_results')
        .select('variant')
        .eq('test_id', activeTest.id)
        .eq('conversation_id', conversationId)
        .single();

      let variant: 'A' | 'B';

      if (existingAssignment) {
        // Use existing assignment
        variant = existingAssignment.variant;
      } else {
        // Assign to variant based on traffic split
        const random = Math.random();
        variant = random < activeTest.traffic_split ? 'A' : 'B';

        // Record the assignment
        await supabase
          .from('ab_test_results')
          .insert({
            test_id: activeTest.id,
            variant: variant,
            conversation_id: conversationId,
            goal_achieved: false,
            session_duration: 0
          });
      }

      // Get the appropriate flow
      const flow = variant === 'A' ? activeTest.variant_a_flow : activeTest.variant_b_flow;

      setAssignment({
        testId: activeTest.id,
        variant,
        flow
      });

    } catch (error) {
      console.error('Error assigning to A/B test:', error);
      setAssignment(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTestResult = async (goalAchieved: boolean, sessionDuration?: number) => {
    if (!assignment) return;

    try {
      await supabase
        .from('ab_test_results')
        .update({
          goal_achieved: goalAchieved,
          session_duration: sessionDuration || 0
        })
        .eq('test_id', assignment.testId)
        .eq('conversation_id', conversationId);
    } catch (error) {
      console.error('Error updating A/B test result:', error);
    }
  };

  return {
    assignment,
    isLoading,
    updateTestResult
  };
}