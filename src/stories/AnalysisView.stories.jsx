import AnalysisView from '../components/AnalysisView';
import useSessionStore from '../store/sessionStore';
import { mockAnalysisState } from './mockData';

export default {
  title: 'Steps/AnalysisView',
  component: AnalysisView,
  decorators: [
    (Story) => {
      useSessionStore.setState({ ...mockAnalysisState });
      return <Story />;
    },
  ],
};

export const GapFix = {};

export const LevelUp = {
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockAnalysisState,
        routingMode: 'level_up',
        routingRationale: 'Student demonstrates solid foundational knowledge. Pushing to deeper transfer.',
        analysis: {
          ...mockAnalysisState.analysis,
          confidence_assessment: 7,
          factual_errors: [],
          blind_spots: [],
        },
      });
      return <Story />;
    },
  ],
};
