import SessionHistory from '../components/SessionHistory';
import useSessionStore from '../store/sessionStore';
import { mockSessions, mockHistoryState } from './mockData';

export default {
  title: 'Views/SessionHistory',
  component: SessionHistory,
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockHistoryState });
      return <Story />;
    },
  ],
  parameters: {
    layout: 'padded',
  },
};

export const WithSessions = {
  args: { onNewSession: () => console.log('New session') },
};

export const Empty = {
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockHistoryState, sessions: [] });
      return <Story />;
    },
  ],
  args: { onNewSession: () => console.log('New session') },
};
