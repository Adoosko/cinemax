'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Users, Send, Smile, X, Crown, Play, DoorOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Participant {
  id: string;
  nickname: string;
  joinedAt: number;
  isHost: boolean;
}

interface ChatMessage {
  id: string;
  nickname: string;
  message: string;
  timestamp: number;
}

interface WatchPartyOverlayProps {
  partyId: string;
  nickname: string;
  movieTitle: string;
  isHost: boolean;
  onLeaveParty: () => void;
  className?: string;
}

const EMOJI_REACTIONS = ['😀', '😂', '😢', '😮', '😍', '🤔', '😡', '👍', '👎', '❤️', '🔥', '🎉'];

export function WatchPartyOverlay({
  partyId,
  nickname,
  movieTitle,
  isHost,
  onLeaveParty,
  className = '',
}: WatchPartyOverlayProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [reactions, setReactions] = useState<
    Array<{ emoji: string; from: string; timestamp: number }>
  >([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';
    const newSocket = io(socketUrl, {
      query: {
        watchPartyId: partyId,
        nickname: nickname,
      },
    });

    newSocket.on('connect', () => {
      console.log('Connected to watch party');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from watch party');
      setIsConnected(false);
    });

    // Watch party events
    newSocket.on('watch-party-joined', (data) => {
      setParticipants(data.participants);
      setMessages(data.recentMessages || []);
    });

    newSocket.on('participant-joined', (data) => {
      setParticipants((prev) => [...prev, data.participant]);
    });

    newSocket.on('participant-left', (data) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
    });

    newSocket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on('new-reaction', (reaction) => {
      setReactions((prev) => [...prev, reaction]);
      // Remove reaction after 3 seconds
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r !== reaction));
      }, 3000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [partyId, nickname]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!socket || !newMessage.trim()) return;
    socket.emit('send-message', { message: newMessage.trim() });
    setNewMessage('');
  };

  const sendReaction = (emoji: string) => {
    if (!socket) return;
    socket.emit('send-reaction', { emoji });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Connection Status */}
      <div className={`absolute top-4 right-4 z-50 ${className} flex flex-col gap-2`}>
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
        
        {/* Host Status Debug */}
        <Badge
          variant="outline"
          className={isHost ? 'bg-green-600/80 text-white' : 'bg-gray-600/80 text-white'}
        >
          {isHost ? '👑 Host Mode' : '👤 Guest Mode'}
        </Badge>
      </div>

      {/* Main Controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowChat(!showChat)}
          className="bg-netflix-dark-gray/80 hover:bg-netflix-medium-gray text-netflix-white border-netflix-light-gray/50 backdrop-blur-sm"
        >
          <MessageCircle className="w-4 h-4 mr-1" />
          Chat ({messages.length})
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowParticipants(!showParticipants)}
          className="bg-netflix-dark-gray/80 hover:bg-netflix-medium-gray text-netflix-white border-netflix-light-gray/50 backdrop-blur-sm"
        >
          <Users className="w-4 h-4 mr-1" />
          {participants.length}
        </Button>
        {isHost && (
          <Badge
            variant="secondary"
            className="bg-netflix-red/20 text-netflix-red border-netflix-red/30"
          >
            <Crown className="w-3 h-3 mr-1" />
            Host
          </Badge>
        )}
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="absolute left-4 top-16 w-80 h-96 bg-netflix-dark-gray/95 backdrop-blur-lg rounded-lg border border-netflix-light-gray/50 z-40 shadow-2xl"
          >
            <div className="p-4 border-b border-netflix-medium-gray">
              <div className="flex items-center justify-between">
                <h3 className="text-netflix-white font-semibold">Watch Party Chat</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChat(false)}
                  className="text-netflix-text-gray hover:text-netflix-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 p-4 h-64">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
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
            <div className="p-4 border-t border-netflix-medium-gray">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="bg-netflix-medium-gray border-netflix-light-gray text-netflix-white placeholder:text-netflix-text-gray focus:border-netflix-red focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  maxLength={200}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  size="sm"
                  className="bg-netflix-red hover:bg-netflix-dark-red text-netflix-white"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants Panel */}
      <AnimatePresence>
        {showParticipants && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-4 top-16 w-64 bg-netflix-dark-gray/95 backdrop-blur-lg rounded-lg border border-netflix-light-gray/50 z-40 shadow-2xl"
          >
            <div className="p-4 border-b border-netflix-medium-gray">
              <div className="flex items-center justify-between">
                <h3 className="text-netflix-white font-semibold">
                  Participants ({participants.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowParticipants(false)}
                  className="text-netflix-text-gray hover:text-netflix-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <ScrollArea className="p-4 max-h-80">
              <div className="space-y-3">
                {participants.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-netflix-red/20 rounded-full flex items-center justify-center">
                      <span className="text-netflix-white font-semibold text-sm">
                        {participant.nickname[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-netflix-white text-sm font-medium">
                          {participant.nickname}
                        </span>
                        {participant.isHost && <Crown className="w-3 h-3 text-netflix-red" />}
                      </div>
                      <span className="text-netflix-text-gray text-xs">
                        Joined {formatTime(participant.joinedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Emoji Reactions */}
      <div className="absolute bottom-20 right-4 z-40">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="bg-netflix-dark-gray/80 hover:bg-netflix-medium-gray text-netflix-white border-netflix-light-gray/50 rounded-full w-10 h-10 p-0 backdrop-blur-sm"
            >
              <Smile className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 bg-netflix-dark-gray/95 border-netflix-light-gray/50 backdrop-blur-lg">
            <div className="grid grid-cols-6 gap-1">
              {EMOJI_REACTIONS.map((emoji) => (
                <Button
                  key={emoji}
                  variant="ghost"
                  size="sm"
                  onClick={() => sendReaction(emoji)}
                  className="w-8 h-8 p-0 text-lg hover:bg-netflix-medium-gray"
                >
                  {emoji}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Floating Reactions */}
      <div className="absolute bottom-32 right-4 z-30 pointer-events-none">
        <AnimatePresence>
          {reactions.map((reaction, index) => (
            <motion.div
              key={`${reaction.timestamp}-${reaction.from}`}
              initial={{ opacity: 0, scale: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1, 1, 0],
                y: [-20, -60, -100],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3, delay: index * 0.1 }}
              className="absolute text-2xl"
              style={{ right: `${index * 40}px` }}
            >
              {reaction.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-4 right-4 z-40 flex gap-2">
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
            className="bg-netflix-red hover:bg-netflix-red/80 text-white border-netflix-light-gray/50"
          >
            <Play className="w-4 h-4 mr-1" />
            {'Control Video'}
          </Button>
        )}
        {/* Leave Party Button */}
        <Button
          variant="destructive"
          size="sm"
          onClick={onLeaveParty}
          className="bg-netflix-medium-gray hover:bg-netflix-light-gray text-netflix-white border-netflix-light-gray/50"
        >
          Leave Party
        </Button>
      </div>
    </>
  );
}
