import Layout from '../components/Layout';
import useSessionStore from '../store/sessionStore';

export default {
  title: 'Shell/Layout',
  component: Layout,
  decorators: [
    (Story, context) => {
      useSessionStore.setState({ step: context.args._step || 'source' });
      return <Story />;
    },
  ],
};

export const Ledger = {
  args: { _step: 'source' },
  render: (args) => (
    <Layout>
      <div className="paper-card p-8 text-center">
        <p className="serif text-lg">Ledger view content</p>
      </div>
    </Layout>
  ),
};

export const LiveTutorial = {
  args: { _step: 'tutorial' },
  render: (args) => (
    <Layout>
      <div className="paper-card p-8 text-center">
        <p className="serif text-lg">Tutorial view content</p>
      </div>
    </Layout>
  ),
};
