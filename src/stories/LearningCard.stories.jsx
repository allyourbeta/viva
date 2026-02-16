import LearningCard from '../components/LearningCard';
import useSessionStore from '../store/sessionStore';
import { mockCardState, mockLearningCard } from './mockData';

// Stub saveSession to prevent real Supabase calls in Storybook
import * as supabaseApi from '../api/supabase';
if (typeof supabaseApi.saveSession === 'function') {
  supabaseApi.saveSession = async (data) => ({ id: 'sb-mock', ...data, created_at: new Date().toISOString() });
}

export default {
  title: 'Steps/LearningCard',
  component: LearningCard,
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockCardState });
      return <Story />;
    },
  ],
};

export const PositiveDelta = {
  args: { onDone: () => console.log('Back to ledger') },
};

export const NegativeDelta = {
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockCardState,
        confidenceBefore: 8,
        learningCard: { ...mockLearningCard, confidence_after: 5 },
      });
      return <Story />;
    },
  ],
  args: { onDone: () => console.log('Back to ledger') },
};

export const NoDelta = {
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockCardState,
        confidenceBefore: 6,
        learningCard: { ...mockLearningCard, confidence_after: 6 },
      });
      return <Story />;
    },
  ],
  args: { onDone: () => console.log('Back to ledger') },
};

export const NullCard = {
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockCardState,
        learningCard: null,
      });
      return <Story />;
    },
  ],
  args: { onDone: () => console.log('Back to ledger') },
};
