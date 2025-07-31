import ChatInterface from '@/components/ChatInterface';
import AuthWrapper from '@/components/AuthWrapper';

const Index = () => {
  return (
    <AuthWrapper>
      {(user, session) => <ChatInterface user={user} session={session} />}
    </AuthWrapper>
  );
};

export default Index;
