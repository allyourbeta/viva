import SessionWizard from '../components/SessionWizard';
import useSessionStore from '../store/sessionStore';
import { mockSourceState, mockConfidenceState, mockCardState } from './mockData';

export default {
  title: 'Views/SessionWizard',
  component: SessionWizard,
  args: {
    onComplete: () => console.log('Complete'),
    onBack: () => console.log('Back'),
  },
};

export const SourceStep = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockSourceState });
      return <Story />;
    },
  ],
};

export const ConfidenceStep = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockConfidenceState });
      return <Story />;
    },
  ],
};

export const CardStep = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockCardState });
      return <Story />;
    },
  ],
};
