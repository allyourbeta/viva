import SessionDashboard from '../components/SessionDashboard';
import { mockAssessments } from './mockData';

export default {
  title: 'Tutorial/SessionDashboard',
  component: SessionDashboard,
  decorators: [
    (Story) => (
      <div className="max-w-sm space-y-4">
        <Story />
      </div>
    ),
  ],
};

export const Default = {
  args: {
    topic: 'Binary Search Trees',
    confidenceBefore: 6,
    currentMode: 'gap_fix',
    assessments: mockAssessments,
    roundCount: 2,
    elapsed: 185,
  },
};

export const EarlySession = {
  args: {
    topic: 'React useEffect',
    confidenceBefore: 7,
    currentMode: 'socratic_probe',
    assessments: [],
    roundCount: 0,
    elapsed: 12,
  },
};

export const LevelUpMode = {
  args: {
    topic: 'Nash Equilibrium',
    confidenceBefore: 8,
    currentMode: 'level_up',
    assessments: [
      {
        what_they_nailed: ['Definition', 'Prisoner dilemma example', 'Best response concept'],
        key_weakness_targeted: 'Mixed strategy equilibria',
        mode: 'level_up',
      },
    ],
    roundCount: 3,
    elapsed: 420,
  },
};
