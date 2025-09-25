'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

interface Comment {
  id: string;
  content: string;
  isSpoiler: boolean;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
  replies?: Comment[];
}

interface EpisodeCommentsProps {
  seriesSlug: string;
  seasonNumber: number;
  episodeNumber: number;
}

export function EpisodeComments({ seriesSlug, seasonNumber, episodeNumber }: EpisodeCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(false);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(
          `/api/series/${seriesSlug}/seasons/${seasonNumber}/episodes/${episodeNumber}/comments`
        );
        if (response.ok) {
          const data = await response.json();
          setComments(data);
        }
      } catch (error) {
        console.error('Failed to fetch episode comments:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [seriesSlug, seasonNumber, episodeNumber]);

  // Submit comment
  const handleSubmitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/series/${seriesSlug}/seasons/${seasonNumber}/episodes/${episodeNumber}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: newComment,
            isSpoiler,
          }),
        }
      );

      if (response.ok) {
        const newCommentData = await response.json();
        setComments((prev) => [newCommentData, ...prev]);
        setNewComment('');
        setIsSpoiler(false);
      }
    } catch (error) {
      console.error('Failed to submit episode comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 bg-gray-800 rounded animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-white" />
        <h3 className="text-xl font-bold text-white">Episode Discussion</h3>
      </div>

      {/* Comment Form */}
      {isAuthenticated ? (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4">
            <Textarea
              placeholder="Share your thoughts about this episode..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 mb-3"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSpoiler}
                    onChange={(e) => setIsSpoiler(e.target.checked)}
                    className="rounded border-gray-600"
                  />
                  <AlertTriangle className="h-4 w-4" />
                  Spoiler warning
                </label>
              </div>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-900/50 border-gray-700">
          <CardContent className="p-4 text-center">
            <p className="text-gray-300 mb-4">Sign in to join the discussion</p>
            <Button className="bg-red-600 hover:bg-red-700">Sign In</Button>
          </CardContent>
        </Card>
      )}

      {/* Spoiler Toggle */}
      {comments.some((comment) => comment.isSpoiler) && (
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showSpoilers}
              onChange={(e) => setShowSpoilers(e.target.checked)}
              className="rounded border-gray-600"
            />
            Show spoiler comments
          </label>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <Card className="bg-gray-900/50 border-gray-700">
            <CardContent className="p-6 text-center">
              <MessageSquare className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <h4 className="text-white font-medium mb-2">No comments yet</h4>
              <p className="text-gray-400 text-sm">
                Be the first to share your thoughts about this episode!
              </p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="bg-gray-900/50 border-gray-700">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                    {comment.user.avatar ? (
                      <img
                        src={comment.user.avatar}
                        alt={comment.user.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-xs font-medium">
                        {comment.user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-medium text-sm">{comment.user.name}</span>
                      <span className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</span>
                      {comment.isSpoiler && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Spoiler
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`text-gray-200 text-sm ${comment.isSpoiler && !showSpoilers ? 'blur-sm select-none' : ''}`}
                    >
                      {comment.isSpoiler && !showSpoilers ? (
                        <p className="italic text-gray-400 text-sm">
                          This comment contains spoilers. Toggle spoiler visibility to read.
                        </p>
                      ) : (
                        <p className="whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
