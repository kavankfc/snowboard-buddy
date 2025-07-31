import ChatInterface from '@/components/ChatInterface';
import AuthWrapper from '@/components/AuthWrapper';

const Index = () => {
  return (
    <AuthWrapper>
      {(user, session, sessionId) => <ChatInterface user={user} session={session} sessionId={sessionId} />}
    </AuthWrapper>
  );
};

export default Index;
