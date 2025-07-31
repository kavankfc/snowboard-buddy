import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogIn, LogOut } from 'lucide-react';

interface AuthWrapperProps {
  children: (user: User, session: Session) => React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`
      }
    });
    if (error) console.error('Error signing in:', error);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error signing out:', error);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-texture flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session || !user) {
    return (
      <div className="min-h-screen bg-paper-texture flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 shadow-soft border-2 border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-handwriting font-bold text-primary mb-2">
              Snowboard Doctor
            </h1>
            <p className="text-muted-foreground">
              Sign in to start chatting with your AI snowboard assistant
            </p>
          </div>
          
          <Button 
            onClick={signInWithGoogle}
            className="w-full shadow-soft hover:shadow-lg transition-all duration-200"
            size="lg"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-10">
        <Button
          onClick={signOut}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign out
        </Button>
      </div>
      {children(user, session)}
    </div>
  );
};

export default AuthWrapper;