import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

interface AuthWrapperProps {
  children: (user: User, session: Session, sessionId: string) => React.ReactNode;
}

interface CustomUser {
  email: string;
  name?: string;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [customUser, setCustomUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomSignIn, setShowCustomSignIn] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

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

  const generateSessionId = () => {
    const userAgent = navigator.userAgent;
    const timestamp = Date.now();
    const screenInfo = `${screen.width}x${screen.height}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Create a fingerprint from available browser data
    const fingerprint = btoa(`${userAgent}-${screenInfo}-${timezone}-${timestamp}`);
    return fingerprint.substring(0, 16);
  };

  const signInWithCustom = () => {
    if (!email.trim()) return;
    
    const sessionId = generateSessionId();
    const mockUser: CustomUser = {
      email: email.trim(),
      name: name.trim() || undefined
    };
    
    setCustomUser(mockUser);
    setLoading(false);
  };

  const signOut = async () => {
    if (session) {
      const { error } = await supabase.auth.signOut();
      if (error) console.error('Error signing out:', error);
    } else {
      setCustomUser(null);
      setEmail('');
      setName('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper-texture flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if ((!session || !user) && !customUser) {
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
          
          {!showCustomSignIn ? (
            <div className="space-y-4">
              <Button 
                onClick={signInWithGoogle}
                className="w-full shadow-soft hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Sign in with Google
              </Button>
              
              <div className="relative">
                <Separator />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-background px-2 text-xs text-muted-foreground">or</span>
                </div>
              </div>
              
              <Button 
                onClick={() => setShowCustomSignIn(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <UserIcon className="w-4 h-4 mr-2" />
                Quick Sign In
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-base"
                />
                <Input
                  type="text"
                  placeholder="Enter your name (optional)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-base"
                />
              </div>
              
              <Button 
                onClick={signInWithCustom}
                disabled={!email.trim()}
                className="w-full shadow-soft hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Continue
              </Button>
              
              <Button 
                onClick={() => setShowCustomSignIn(false)}
                variant="ghost"
                className="w-full"
              >
                Back to sign in options
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Generate session ID based on the authentication type
  const getSessionId = () => {
    if (user?.email) {
      return user.email; // Use email for Google auth
    } else if (customUser) {
      return generateSessionId(); // Use generated ID for custom auth
    }
    return 'anonymous';
  };

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
      {children(
        user || {
          id: 'custom-user',
          email: customUser?.email || '',
          user_metadata: { name: customUser?.name },
          app_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          phone_confirmed_at: null,
          confirmation_sent_at: null,
          recovery_sent_at: null,
          email_change_sent_at: null,
          new_email: null,
          new_phone: null,
          invited_at: null,
          action_link: null,
          phone: null,
          role: 'authenticated',
          last_sign_in_at: new Date().toISOString()
        } as User,
        session || {} as Session,
        getSessionId()
      )}
    </div>
  );
};

export default AuthWrapper;