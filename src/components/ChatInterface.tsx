import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}
const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    toast
  } = useToast();

  // Generate session ID based on browser fingerprint including IP
  useEffect(() => {
    const generateSessionId = async () => {
      try {
        // Fetch IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        const ipAddress = ipData.ip;
        const navigator_info = navigator.userAgent;
        const screen_info = `${screen.width}x${screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fingerprint = `${navigator_info}-${screen_info}-${timezone}-${ipAddress}-${Date.now()}`;
        return btoa(fingerprint).substring(0, 32);
      } catch (error) {
        console.warn('Could not fetch IP address, using fallback:', error);
        // Fallback without IP
        const navigator_info = navigator.userAgent;
        const screen_info = `${screen.width}x${screen.height}`;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const fingerprint = `${navigator_info}-${screen_info}-${timezone}-${Date.now()}`;
        return btoa(fingerprint).substring(0, 32);
      }
    };
    generateSessionId().then(setSessionId);
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    try {
      const response = await fetch('https://n8n.kloudflake.com/webhook/d105c3ad-3488-438c-b405-b856c90ce80e/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Basic ' + btoa('snowboardoctor:snowboardoctor')
        },
        body: JSON.stringify({
          chatInput: userMessage.content,
          sessionId: sessionId
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Extract output from JSON response
      const botContent = data.output || 'I received your message!';
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botContent,
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Connection Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  return <div className="min-h-screen bg-paper-texture p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-handwriting font-bold text-primary mb-2">
            Snowboard Doctor
          </h1>
          <p className="text-muted-foreground font-medium">Your personal AI snowboard assistant</p>
        </div>

        {/* Chat Container */}
        <Card className="shadow-soft border-2 border-border/50 overflow-hidden">
          {/* Chat History */}
          <ScrollArea className="h-[500px] md:h-[600px] p-4 md:p-6">
            <div className="space-y-4">
              {messages.length === 0 ? <div className="text-center py-12">
                  <Bot className="w-12 h-12 text-primary mx-auto mb-4" />
                  <p className="text-lg font-handwriting text-muted-foreground">
                    Start a conversation! Ask me anything...
                  </p>
                </div> : messages.map(message => <div key={message.id} className={`flex items-start gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.isUser ? 'bg-chat-user text-chat-user-foreground' : 'bg-chat-bot text-chat-bot-foreground border border-border'}`}>
                      {message.isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble */}
                    <div className={`max-w-[80%] rounded-lg px-4 py-3 shadow-message ${message.isUser ? 'bg-chat-user text-chat-user-foreground' : 'bg-chat-bot text-chat-bot-foreground border border-border'}`}>
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                      </p>
                    </div>
                  </div>)}
              
              {/* Loading indicator */}
              {isLoading && <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-chat-bot text-chat-bot-foreground border border-border flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-chat-bot text-chat-bot-foreground border border-border rounded-lg px-4 py-3 shadow-message">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                    animationDelay: '0.1s'
                  }}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{
                    animationDelay: '0.2s'
                  }}></div>
                    </div>
                  </div>
                </div>}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t border-border bg-card p-4 md:p-6">
            <div className="flex gap-3">
              <Input value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message here..." disabled={isLoading} className="flex-1 text-base border-2 border-border/50 focus:border-primary transition-colors" />
              <Button onClick={sendMessage} disabled={!inputValue.trim() || isLoading} size="lg" className="px-6 shadow-soft hover:shadow-lg transition-all duration-200 font-medium">
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Session ID: {sessionId.substring(0, 8)}...
            </p>
            <div className="mt-3 pt-3 border-t border-border/30 text-center">
              <a href="https://buymeacoffee.com/kavankfc4" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors">
                ☕ Buy me a coffee
              </a>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Thanks for your support! It motivates continuous improvements.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>;
};
export default ChatInterface;