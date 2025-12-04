import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAdminChats, fetchAdminChat, sendAdminMessage, updateChatStatus, type AdminChat, type AdminChatMessage } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { MessageCircle, Clock, User, Package, Send, CheckCircle, XCircle } from 'lucide-react';

const formatDate = (value: string) => {
  return new Date(value).toLocaleString();
};

const formatOrderStatus = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'failed':
      return 'Failed';
    case 'pending':
      return 'Pending';
    default:
      return status;
  }
};

const AdminChatManager = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const { data: chatsData, isLoading } = useQuery({
    queryKey: ['admin-chats'],
    enabled: Boolean(token),
    queryFn: () => fetchAdminChats(token ?? ''),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { data: selectedChatData } = useQuery({
    queryKey: ['admin-chat', selectedChatId],
    enabled: Boolean(token && selectedChatId),
    queryFn: () => fetchAdminChat(token ?? '', selectedChatId!),
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ chatId, message }: { chatId: string; message: string }) =>
      sendAdminMessage(token ?? '', chatId, message),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['admin-chats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-chat', selectedChatId] });
      toast.success('Message sent');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to send message');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ chatId, status }: { chatId: string; status: 'open' | 'closed' }) =>
      updateChatStatus(token ?? '', chatId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-chats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-chat', selectedChatId] });
      toast.success('Chat status updated');
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : 'Failed to update chat status');
    },
  });

  const handleSendMessage = () => {
    if (!selectedChatId || !newMessage.trim()) return;
    sendMessageMutation.mutate({ chatId: selectedChatId, message: newMessage.trim() });
  };

  const handleStatusChange = (chatId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'open' ? 'closed' : 'open';
    updateStatusMutation.mutate({ chatId, status: newStatus });
  };

  const chats = chatsData?.chats ?? [];
  const selectedChat = selectedChatData?.chat;

  // Sort chats by last activity (most recent first)
  const sortedChats = [...chats].sort((a, b) => 
    new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime()
  );

  const openChats = sortedChats.filter(chat => chat.status === 'open');
  const closedChats = sortedChats.filter(chat => chat.status === 'closed');

  if (isLoading) {
    return (
      <div className="glass-card rounded-2xl border border-border/60 p-6">
        <div className="animate-pulse text-sm uppercase tracking-[0.3em] text-muted-foreground">
          Loading chats...
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl border border-border/60 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold">Chat Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage all customer chats and provide support
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{openChats.length} Open</Badge>
          <Badge variant="outline">{closedChats.length} Closed</Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_2fr] gap-6 h-[600px]">
        {/* Chat List */}
        <div className="border border-border/60 rounded-xl bg-background/70">
          <div className="p-4 border-b border-border/60">
            <h3 className="font-semibold">All Chats</h3>
          </div>
          <ScrollArea className="h-[520px]">
            <div className="p-2 space-y-2">
              {/* Open Chats */}
              {openChats.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-[0.3em]">
                    Open Chats ({openChats.length})
                  </div>
                  {openChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChatId === chat.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-background/80 border border-transparent'
                      }`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-primary" />
                          <span className="font-medium text-sm">{chat.username}</span>
                        </div>
                        <Badge variant="default" className="text-xs">
                          Open
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Order {chat.orderId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {chat.responseMinutes ? (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Responded in {chat.responseMinutes}min
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-orange-500">
                            <Clock className="h-3 w-3" />
                            Awaiting response
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(chat.lastActivityAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Closed Chats */}
              {closedChats.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-[0.3em] mt-4">
                    Closed Chats ({closedChats.length})
                  </div>
                  {closedChats.map((chat) => (
                    <div
                      key={chat.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedChatId === chat.id
                          ? 'bg-primary/10 border border-primary/20'
                          : 'hover:bg-background/80 border border-transparent'
                      }`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{chat.username}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Closed
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Order {chat.orderId}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {chat.responseMinutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Responded in {chat.responseMinutes}min
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(chat.lastActivityAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {chats.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No chats available</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Details */}
        <div className="border border-border/60 rounded-xl bg-background/70">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold">{selectedChat.username}</h3>
                      <p className="text-sm text-muted-foreground">
                        Order {selectedChat.orderId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={selectedChat.status === 'open' ? 'default' : 'secondary'}>
                      {selectedChat.status}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedChat.id, selectedChat.status)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {selectedChat.status === 'open' ? (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          Close
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Reopen
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {selectedChat.order && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      {selectedChat.order.product}
                    </div>
                    <div>
                      ${selectedChat.order.amount.toFixed(2)} {selectedChat.order.currency}
                    </div>
                    <div>
                      Status: {formatOrderStatus(selectedChat.order.status)}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <ScrollArea className="h-[400px] p-4">
                <div className="space-y-4">
                  {selectedChat.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.author === 'admin' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.author === 'admin'
                            ? 'bg-primary text-primary-foreground'
                            : message.author === 'system'
                            ? 'bg-muted text-muted-foreground'
                            : 'bg-background border border-border/60'
                        }`}
                      >
                        <div className="text-sm">{message.body}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {formatDate(message.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              {selectedChat.status === 'open' && (
                <div className="p-4 border-t border-border/60">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="min-h-[60px] resize-none"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a chat to view messages</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminChatManager;
