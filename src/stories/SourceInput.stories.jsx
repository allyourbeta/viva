import SourceInput from '../components/SourceInput';
import useSessionStore from '../store/sessionStore';
import { mockSourceState } from './mockData';

export default {
  title: 'Steps/SourceInput',
  component: SourceInput,
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockSourceState });
      return <Story />;
    },
  ],
};

export const Default = {};

export const WithTopic = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockSourceState, topic: 'Binary Search Trees' });
      return <Story />;
    },
  ],
};

export const Loading = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockSourceState, topic: 'React Hooks', isLoading: true });
      return <Story />;
    },
  ],
};
