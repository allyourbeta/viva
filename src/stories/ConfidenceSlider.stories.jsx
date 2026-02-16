import ConfidenceSlider from '../components/ConfidenceSlider';
import useSessionStore from '../store/sessionStore';
import { mockConfidenceState } from './mockData';

export default {
  title: 'Steps/ConfidenceSlider',
  component: ConfidenceSlider,
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockConfidenceState });
      return <Story />;
    },
  ],
};

export const Default = {};

export const LowConfidence = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockConfidenceState, confidenceBefore: 2 });
      return <Story />;
    },
  ],
};

export const HighConfidence = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockConfidenceState, confidenceBefore: 9 });
      return <Story />;
    },
  ],
};
