import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Search } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';

interface Conversation {
  rentalId: number;
  otherUserId: number;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedRental, setSelectedRental] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: rentalsData } = trpc.rentals.myRentals.useQuery();

  useEffect(() => {
    if (rentalsData) {
      // Convert rentals to conversations
      const convos: Conversation[] = rentalsData.map((rental: any) => ({
        rentalId: rental.id,
        otherUserId: rental.landlordId === user?.id ? rental.tenantId : rental.landlordId,
        otherUserName: rental.landlordId === user?.id ? 'Tenant' : 'Landlord',
        lastMessage: 'No messages yet',
        lastMessageTime: new Date(),
        unread: false,
      }));
      setConversations(convos);
    }
  }, [rentalsData, user?.id]);

  useEffect(() => {
    if (selectedRental) {
      loadMessages(selectedRental);
    }
  }, [selectedRental]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (rentalId: number) => {
    try {
      setLoading(true);
      // In a real app, we'd fetch the actual messages
      // For now, just set empty array
      setMessages([]);
    } catch (err) {
      console.error('Error loading messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedRental) return;

    try {
      const conversation = conversations.find(c => c.rentalId === selectedRental);
      if (!conversation) return;

      await trpc.messages.send.useMutation().mutateAsync({
        rentalId: selectedRental,
        recipientId: conversation.otherUserId,
        content: messageText,
      });

      setMessages(prev => [...prev, {
        id: Date.now(),
        senderId: user?.id,
        content: messageText,
        createdAt: new Date(),
      }]);

      setMessageText('');
      toast.success('Message sent');
    } catch (err: any) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  };

  const filteredConversations = conversations.filter(c =>
    c.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-slate-500">
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map(conversation => (
                  <button
                    key={conversation.rentalId}
                    onClick={() => setSelectedRental(conversation.rentalId)}
                    className={`w-full p-4 border-b border-slate-100 text-left hover:bg-slate-50 transition-colors ${
                      selectedRental === conversation.rentalId ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{conversation.otherUserName}</p>
                    <p className="text-sm text-slate-600 truncate">{conversation.lastMessage}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(conversation.lastMessageTime).toLocaleDateString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedRental ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      {conversations.find(c => c.rentalId === selectedRental)?.otherUserName}
                    </h2>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedRental(null)}
                  >
                    <ArrowLeft size={16} />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading ? (
                    <div className="text-center text-slate-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <p className="text-sm">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.senderId === user?.id
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-200 text-slate-900'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId === user?.id ? 'text-orange-100' : 'text-slate-600'
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-slate-200">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={messageText}
                      onChange={e => setMessageText(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim()}
                      size="sm"
                      className="gap-2"
                    >
                      <Send size={16} />
                      Send
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p className="text-center">
                  <p className="text-lg mb-2">💬</p>
                  <p>Select a conversation to start messaging</p>
                </p>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
