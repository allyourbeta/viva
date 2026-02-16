import SocraticLoop from '../components/SocraticLoop';
import useSessionStore from '../store/sessionStore';
import { mockAnalysisState, mockQuestions } from './mockData';

export default {
  title: 'Steps/SocraticLoop',
  component: SocraticLoop,
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockAnalysisState,
        questions: mockQuestions,
        currentQuestionIndex: 0,
        answers: [],
      });
      return <Story />;
    },
  ],
};

export const FirstQuestion = {};

export const SecondQuestion = {
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockAnalysisState,
        questions: mockQuestions,
        currentQuestionIndex: 1,
        answers: [
          {
            questionIndex: 0,
            transcript: 'It degrades to O(n) because the tree becomes a linked list.',
            gap_closed: true,
            evaluation: 'Correct! A degenerate BST is effectively a linked list.',
            correction: null,
            follow_up_needed: false,
          },
        ],
      });
      return <Story />;
    },
  ],
};

export const AllComplete = {
  decorators: [
    (Story) => {
      useSessionStore.setState({
        ...mockAnalysisState,
        questions: mockQuestions,
        currentQuestionIndex: 3,
        answers: [
          { questionIndex: 0, transcript: '...', gap_closed: true, evaluation: 'Correct!' },
          { questionIndex: 1, transcript: '...', gap_closed: false, evaluation: 'Partially correct.' },
          { questionIndex: 2, transcript: '...', gap_closed: true, evaluation: 'Well done!' },
        ],
      });
      return <Story />;
    },
  ],
};
