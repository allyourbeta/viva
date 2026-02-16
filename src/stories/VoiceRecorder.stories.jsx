import VoiceRecorder from '../components/VoiceRecorder';
import useSessionStore from '../store/sessionStore';
import { mockRecordingState } from './mockData';

export default {
  title: 'Steps/VoiceRecorder',
  component: VoiceRecorder,
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockRecordingState });
      return <Story />;
    },
  ],
};

export const Ready = {};

export const WithTranscript = {
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockRecordingState,
        transcript: 'A binary search tree has nodes where the left child is smaller and the right child is larger than the parent...',
      });
      return <Story />;
    },
  ],
};
