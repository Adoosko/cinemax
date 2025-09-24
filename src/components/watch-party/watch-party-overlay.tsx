'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  MessageCircle,
  Users,
  Send,
  Smile,
  Play,
  Crown,
  DoorOpen,
  Link as LinkIcon,
  Check,
  X,
} from 'lucide-react';

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const EMOJI_REACTIONS = ['😀', '😂', '😢', '😮', '😍', '🤔', '😡', '👍', '👎', '❤️', '🔥', '🎉'];

interface WatchPartyOverlayProps {
  partyId: string;
  userId: string;
  nickname: string;
  movieTitle?: string;
  isHost: boolean;
  onLeaveParty: () => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  timestamp: number;
}

export function WatchPartyOverlay({
  partyId,
  userId,
  nickname,
  movieTitle = 'Movie',
  isHost,
  onLeaveParty,
  className = '',
}: WatchPartyOverlayProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<
    Array<{
      id: string;
      nickname: string;
      joinedAt: number;
      isHost: boolean;
    }>
  >([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const [reactions, setReactions] = useState<
    Array<{ emoji: string; from: string; timestamp: number }>
  >([]);
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!partyId || !nickname || !userId) return;

    if (socket?.connected) {
      return;
    }

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      query: {
        partyId,
        nickname,
        isHost: isHost.toString(),
        userId,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-party', {
        partyId,
        nickname,
        isHost,
        userId,
      });
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    newSocket.on('watch-party-joined', (data) => {
      setParticipants(data.participants);
    });

    newSocket.on('participant-joined', (data) => {
      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === data.participant.id);
        if (exists) return prev;
        return [...prev, data.participant];
      });
    });

    newSocket.on('participant-left', (data) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
    });

    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('new-reaction', (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      setTimeout(() => {
        setReactions((prev) => prev.slice(1));
      }, 3000);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket.connected) {
        newSocket.emit('leave-party', { partyId, userId });
        newSocket.disconnect();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [partyId, nickname, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !isConnected || !newMessage.trim()) return;
    socket.emit('send-message', { message: newMessage.trim() });
    setNewMessage('');
  };

  const sendReaction = (emoji: string) => {
    if (!socket || !isConnected) return;
    socket.emit('send-reaction', { emoji });
  };

  const copyInviteLink = async () => {
    try {
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      url.searchParams.set('party', partyId);
      url.searchParams.delete('nickname');
      const inviteLink = url.toString();
      await navigator.clipboard.writeText(inviteLink);
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2000);
    } catch (error) {
      const currentUrl = window.location.href;
      const url = new URL(currentUrl);
      url.searchParams.set('party', partyId);
      url.searchParams.delete('nickname');
      alert(`Invite link: ${url.toString()}`);
    }
  };

  return (
    <div className={`w-full flex flex-col bg-black ${className}`}>
      {/* Watch Party Controls Panel - Positioned BELOW the video with proper z-index */}
      <div
        className="w-full bg-netflix-dark-gray border-t border-netflix-light-gray/20 rounded-md shadow-lg z-20"
        style={{ position: 'relative' }}
      >
        {/* Watch Party Header */}
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <h3 className="text-netflix-white font-semibold text-sm sm:text-base">
              Watch Party: {movieTitle}
            </h3>
            <Badge
              variant={isConnected ? 'default' : 'destructive'}
              className={
                isConnected
                  ? 'bg-netflix-red text-netflix-white border-netflix-red'
                  : 'bg-netflix-medium-gray text-netflix-text-gray'
              }
            >
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </Badge>
            {isHost ? (
              <Badge
                variant="outline"
                className="bg-green-600/20 text-green-400 border-green-500/30"
              >
                👑 Host Mode
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-600/20 text-gray-400 border-gray-500/30">
                👤 Viewer Mode
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Invite Link Button (Host Only) */}
            {isHost && (
              <Button
                variant="outline"
                size="sm"
                onClick={copyInviteLink}
                className="bg-netflix-dark-gray hover:bg-netflix-medium-gray text-netflix-white border-netflix-light-gray/50 text-xs px-2 sm:px-3"
              >
                {inviteLinkCopied ? (
                  <>
                    <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Invite
                  </>
                )}
              </Button>
            )}

            {/* Play/Pause Button (Host Only) */}
            {isHost && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const videoElement = document.querySelector('video');
                  if (videoElement) {
                    if (videoElement.paused) {
                      videoElement.play().catch(console.error);
                    } else {
                      videoElement.pause();
                    }
                  }
                }}
                className="bg-netflix-red hover:bg-netflix-red/80 text-white border-netflix-light-gray/50 text-xs px-2 sm:px-3"
              >
                <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {'Control Video'}
              </Button>
            )}

            <Button
              variant="destructive"
              size="sm"
              onClick={onLeaveParty}
              className="bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white border-netflix-light-gray/50 text-xs px-2 sm:px-3"
            >
              <DoorOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
              Leave
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-netflix-light-gray/20">
          <button
            onClick={() => {
              setShowChat(true);
              setShowParticipants(false);
            }}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
              showChat
                ? 'text-netflix-red border-b-2 border-netflix-red bg-netflix-medium-gray/20'
                : 'text-netflix-white/70 hover:text-netflix-white hover:bg-netflix-medium-gray/10'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              Chat ({messages.length})
            </div>
          </button>

          <button
            onClick={() => {
              setShowChat(false);
              setShowParticipants(true);
            }}
            className={`flex-1 px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium ${
              showParticipants
                ? 'text-netflix-red border-b-2 border-netflix-red bg-netflix-medium-gray/20'
                : 'text-netflix-white/70 hover:text-netflix-white hover:bg-netflix-medium-gray/10'
            }`}
          >
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              Participants ({participants.length})
            </div>
          </button>

          <div className="px-2 sm:px-4 py-2 sm:py-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-netflix-white/70 hover:text-netflix-white p-1 sm:p-2"
                >
                  <Smile className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2 bg-netflix-dark-gray border-netflix-light-gray/50">
                <div className="grid grid-cols-6 gap-1">
                  {EMOJI_REACTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant="ghost"
                      size="sm"
                      onClick={() => sendReaction(emoji)}
                      className="w-6 h-6 sm:w-8 sm:h-8 p-0 text-sm sm:text-lg hover:bg-netflix-medium-gray"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          {/* Chat Panel */}
          {showChat && (
            <div className="space-y-3 sm:space-y-4">
              <ScrollArea className="h-48 sm:h-64 w-full rounded-md border border-netflix-light-gray/20 p-3 sm:p-4">
                <div className="space-y-2 sm:space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="text-xs sm:text-sm">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1">
                        <span className="text-netflix-red font-medium">{message.nickname}</span>
                        <span className="text-netflix-text-gray text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <p className="text-netflix-white/90">{message.message}</p>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-netflix-medium-gray border-netflix-light-gray text-netflix-white placeholder:text-netflix-text-gray focus:border-netflix-red focus:outline-none text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  maxLength={200}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                  className="bg-netflix-red hover:bg-netflix-dark-red text-netflix-white px-3 sm:px-4"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Participants Panel */}
          {showParticipants && (
            <ScrollArea className="h-48 sm:h-64 w-full rounded-md border border-netflix-light-gray/20 p-3 sm:p-4">
              <div className="space-y-2 sm:space-y-3">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-netflix-medium-gray/20"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-netflix-red/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-netflix-white font-semibold text-xs sm:text-sm">
                        {participant.nickname[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span className="text-netflix-white text-xs sm:text-sm font-medium truncate">
                          {participant.nickname}
                        </span>
                        {participant.isHost && (
                          <Badge
                            variant="outline"
                            className="bg-netflix-red/20 text-netflix-red border-netflix-red/30 text-xs py-0 px-1 flex-shrink-0"
                          >
                            <Crown className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                            Host
                          </Badge>
                        )}
                      </div>
                      <span className="text-netflix-text-gray text-xs">
                        Joined {formatTime(participant.joinedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Floating Reactions */}
      <div className="fixed bottom-20 left-0 right-0 pointer-events-none z-50">
        <div className="flex justify-center">
          <div className="relative h-16 w-full max-w-md">
            {reactions.map((reaction, index) => (
              <div
                key={`${reaction.timestamp}-${reaction.from}`}
                className="absolute text-4xl animate-bounce"
                style={{
                  left: `${(index - reactions.length / 2) * 60 + 50}%`,
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {reaction.emoji}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
