import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  updated_at: string;
  listing_title?: string;
  other_name?: string;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch conversations
  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (data) {
        // Enrich with listing titles and other user names
        const enriched = await Promise.all(data.map(async (conv: any) => {
          const otherId = conv.buyer_id === user.id ? conv.seller_id : conv.buyer_id;
          const [listingRes, profileRes] = await Promise.all([
            supabase.from('listings').select('title').eq('id', conv.listing_id).single(),
            supabase.from('profiles').select('full_name, dealer_name').eq('id', otherId).single(),
          ]);
          
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1);

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          return {
            ...conv,
            listing_title: listingRes.data?.title || 'Onbekend',
            other_name: profileRes.data?.dealer_name || profileRes.data?.full_name || 'Onbekend',
            last_message: lastMsg?.[0]?.content,
            unread_count: count || 0,
          };
        }));
        setConversations(enriched);
      }
      setLoading(false);
    };
    fetchConversations();
  }, [user]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConv) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConv)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);

      // Mark as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', selectedConv)
        .neq('sender_id', user?.id || '')
        .is('read_at', null);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${selectedConv}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${selectedConv}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConv, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv || !user) return;
    const { error } = await supabase.from('messages').insert({
      conversation_id: selectedConv,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    if (!error) {
      setNewMessage('');
      // Update conversation updated_at
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', selectedConv);
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const selectedConversation = conversations.find(c => c.id === selectedConv);

  if (loading) {
    return (
      <div className="container py-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Berichten</h1>

        {conversations.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">Geen berichten</h3>
              <p className="text-muted-foreground mt-2">Stuur een bericht via een autodetailpagina om een gesprek te starten.</p>
              <Button asChild className="mt-6">
                <Link to="/zoeken">Auto's bekijken</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversation List */}
            <Card className={cn("md:col-span-1 border-border/60 overflow-hidden", selectedConv && "hidden md:block")}>
              <ScrollArea className="h-full">
                {conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv.id)}
                    className={cn(
                      "w-full p-4 text-left border-b border-border/40 hover:bg-muted/50 transition-colors",
                      selectedConv === conv.id && "bg-muted/70"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{conv.other_name}</span>
                          {(conv.unread_count || 0) > 0 && (
                            <Badge className="bg-accent text-accent-foreground text-xs h-5 min-w-5 px-1.5">
                              {conv.unread_count}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.listing_title}</p>
                        {conv.last_message && (
                          <p className="text-xs text-muted-foreground truncate mt-1">{conv.last_message}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{formatDate(conv.updated_at)}</span>
                    </div>
                  </button>
                ))}
              </ScrollArea>
            </Card>

            {/* Chat Window */}
            <Card className={cn("md:col-span-2 border-border/60 flex flex-col overflow-hidden", !selectedConv && "hidden md:flex")}>
              {selectedConv && selectedConversation ? (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-border/40 flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConv(null)}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <p className="font-semibold text-sm">{selectedConversation.other_name}</p>
                      <Link to={`/auto/${selectedConversation.listing_id}`} className="text-xs text-muted-foreground hover:text-primary">
                        {selectedConversation.listing_title}
                      </Link>
                    </div>
                  </div>

                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {messages.map(msg => (
                        <div key={msg.id} className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
                          <div className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                            msg.sender_id === user?.id
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-muted rounded-bl-md"
                          )}>
                            <p>{msg.content}</p>
                            <p className={cn(
                              "text-[10px] mt-1",
                              msg.sender_id === user?.id ? "text-primary-foreground/60" : "text-muted-foreground"
                            )}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  {/* Input */}
                  <div className="p-4 border-t border-border/40">
                    <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Typ een bericht..."
                        className="flex-1"
                      />
                      <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Selecteer een gesprek</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
