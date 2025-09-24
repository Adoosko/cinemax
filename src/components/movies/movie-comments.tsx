'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Trash2, Send } from 'lucide-react';

// Helper function to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
}

export interface MovieComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  isSpoiler: boolean;
  parentId?: string;
  createdAt: string;
  replies?: MovieComment[];
}

interface MovieCommentsProps {
  movieSlug: string;
}

export function MovieComments({ movieSlug }: MovieCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<MovieComment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [isSpoiler, setIsSpoiler] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<Set<string>>(new Set());
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replySpoiler, setReplySpoiler] = useState(false);

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [movieSlug]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/movies/${movieSlug}/comments`);
      const data = await response.json();

      if (data.success) {
        setComments(data.comments);
        setTotalCount(data.totalCount);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || !isAuthenticated || submitting) return;

    setSubmitting(true);

    // Optimistically add the comment
    const optimisticComment: MovieComment = {
      id: `temp-${Date.now()}`,
      userId: user!.id,
      userName: user!.name || 'Anonymous',
      userAvatar: user!.image || undefined,
      content: content.trim(),
      isSpoiler,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setTotalCount((prev) => prev + 1);
    const currentContent = content;
    const currentIsSpoiler = isSpoiler;

    setContent('');
    setIsSpoiler(false);

    try {
      const response = await fetch(`/api/movies/${movieSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentContent.trim(),
          isSpoiler: currentIsSpoiler,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Replace optimistic comment with real one
        setComments((prev) =>
          prev.map((comment) => (comment.id === optimisticComment.id ? data.comment : comment))
        );
      } else {
        // Remove optimistic comment and show error
        setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
        setTotalCount((prev) => prev - 1);
        setContent(currentContent);
        setIsSpoiler(currentIsSpoiler);
        alert(data.error || 'Failed to post comment');
      }
    } catch (error) {
      // Remove optimistic comment and show error
      setComments((prev) => prev.filter((comment) => comment.id !== optimisticComment.id));
      setTotalCount((prev) => prev - 1);
      setContent(currentContent);
      setIsSpoiler(currentIsSpoiler);
      console.error('Failed to post comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSpoiler = (commentId: string) => {
    setRevealedSpoilers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleReply = async (parentId: string, e: React.FormEvent) => {
    e.preventDefault();

    if (!replyContent.trim() || !isAuthenticated || submitting) return;

    setSubmitting(true);

    const optimisticReply: MovieComment = {
      id: `temp-reply-${Date.now()}`,
      userId: user!.id,
      userName: user!.name || 'Anonymous',
      userAvatar: user!.image || undefined,
      content: replyContent.trim(),
      isSpoiler: replySpoiler,
      parentId,
      createdAt: new Date().toISOString(),
    };

    // Add reply optimistically
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), optimisticReply],
          };
        }
        return comment;
      })
    );
    setTotalCount((prev) => prev + 1);

    const currentReplyContent = replyContent;
    const currentReplySpoiler = replySpoiler;

    setReplyContent('');
    setReplySpoiler(false);
    setReplyingTo(null);

    try {
      const response = await fetch(`/api/movies/${movieSlug}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: currentReplyContent.trim(),
          isSpoiler: currentReplySpoiler,
          parentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Replace optimistic reply with real one
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: (comment.replies || []).map((reply) =>
                  reply.id === optimisticReply.id ? data.comment : reply
                ),
              };
            }
            return comment;
          })
        );
      } else {
        // Remove optimistic reply and show error
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: (comment.replies || []).filter((reply) => reply.id !== optimisticReply.id),
              };
            }
            return comment;
          })
        );
        setTotalCount((prev) => prev - 1);
        setReplyContent(currentReplyContent);
        setReplySpoiler(currentReplySpoiler);
        setReplyingTo(parentId);
        alert(data.error || 'Failed to post reply');
      }
    } catch (error) {
      // Remove optimistic reply and show error
      setComments((prev) =>
        prev.map((comment) => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: (comment.replies || []).filter((reply) => reply.id !== optimisticReply.id),
            };
          }
          return comment;
        })
      );
      setTotalCount((prev) => prev - 1);
      setReplyContent(currentReplyContent);
      setReplySpoiler(currentReplySpoiler);
      setReplyingTo(parentId);
      console.error('Failed to post reply:', error);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const response = await fetch(`/api/movies/${movieSlug}/comments?commentId=${commentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        setTotalCount((prev) => prev - 1);
      } else {
        alert(data.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/10 animate-pulse rounded-lg" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-white/10 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form */}
      {isAuthenticated ? (
        <Card className="bg-netflix-black/50 p-6 border-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-start space-x-3">
              <Avatar className="w-10 h-10">
                {user?.image ? (
                  <AvatarImage src={user.image} alt={user.name || 'User'} />
                ) : (
                  <AvatarFallback className="bg-netflix-red text-white">
                    {(user?.name || user?.email || 'U')[0].toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share your thoughts about this movie..."
                  className="min-h-[100px] bg-netflix-black/30 border-0 ring-0 focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-0 text-white placeholder:text-netflix-text-gray resize-none"
                  maxLength={1000}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="spoiler"
                      checked={isSpoiler}
                      onCheckedChange={(checked) => setIsSpoiler(checked as boolean)}
                      className="data-[state=checked]:bg-netflix-red data-[state=checked]:border-netflix-red"
                    />
                    <label
                      htmlFor="spoiler"
                      className="text-sm text-netflix-text-gray cursor-pointer"
                    >
                      Mark as spoiler
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-netflix-text-gray">{content.length}/1000</span>
                    <Button
                      type="submit"
                      disabled={!content.trim() || submitting}
                      className="bg-netflix-red hover:bg-netflix-red/80 disabled:opacity-50"
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </Card>
      ) : (
        <Card className="bg-netflix-black/50 p-6">
          <div className="text-center py-4">
            <MessageSquare className="w-12 h-12 mx-auto text-netflix-text-gray mb-4" />
            <p className="text-netflix-text-gray mb-4">
              Sign in to share your thoughts about this movie
            </p>
            <Button asChild className="bg-netflix-red hover:bg-netflix-red/80">
              <a href="/signin">Sign In</a>
            </Button>
          </div>
        </Card>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Comments ({totalCount})</h3>
        </div>

        {comments.length === 0 ? (
          <Card className="bg-netflix-black/50 p-8">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-netflix-text-gray mb-4" />
              <p className="text-netflix-text-gray text-lg mb-2">No comments yet</p>
              <p className="text-netflix-text-gray/70">Be the first to share your thoughts!</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card key={comment.id} className="bg-transparent p-4 border-0">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-8 h-8">
                    {comment.userAvatar ? (
                      <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                    ) : (
                      <AvatarFallback className="bg-netflix-red/70 text-white text-xs">
                        {comment.userName[0].toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-white text-sm">{comment.userName}</span>
                        {comment.isSpoiler && (
                          <span className="text-netflix-red text-xs italic ml-2">[spoiler]</span>
                        )}
                        <span className="text-netflix-text-gray text-xs">
                          {formatRelativeTime(comment.createdAt)}
                        </span>
                      </div>

                      {isAuthenticated && user?.id === comment.userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteComment(comment.id)}
                          className="text-netflix-text-gray hover:text-red-400 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    {comment.isSpoiler ? (
                      <div className="relative">
                        {revealedSpoilers.has(comment.id) ? (
                          <div>
                            <p className="text-white text-sm leading-relaxed mb-1">
                              {comment.content}
                            </p>
                            <button
                              onClick={() => toggleSpoiler(comment.id)}
                              className="text-netflix-text-gray hover:text-white text-xs underline"
                            >
                              Hide
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleSpoiler(comment.id)}
                            className="text-netflix-red hover:text-netflix-red/80 text-sm italic underline"
                          >
                            Spoiler - Click to reveal
                          </button>
                        )}
                      </div>
                    ) : (
                      <p className="text-white text-sm leading-relaxed">{comment.content}</p>
                    )}

                    <div className="flex items-center space-x-2 mt-2">
                      {isAuthenticated && (
                        <button
                          onClick={() =>
                            setReplyingTo(replyingTo === comment.id ? null : comment.id)
                          }
                          className="text-netflix-text-gray hover:text-white text-xs underline"
                        >
                          Reply
                        </button>
                      )}

                      {/* Reply Form */}
                      {replyingTo === comment.id && isAuthenticated && (
                        <div className="mt-3 pt-3 border-t border-netflix-gray/30">
                          <form onSubmit={(e) => handleReply(comment.id, e)} className="space-y-3">
                            <div className="flex items-start space-x-2">
                              <Avatar className="w-6 h-6">
                                {user?.image ? (
                                  <AvatarImage src={user.image} alt={user.name || 'User'} />
                                ) : (
                                  <AvatarFallback className="bg-netflix-red text-white text-xs">
                                    {(user?.name || user?.email || 'U')[0].toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <Textarea
                                  value={replyContent}
                                  onChange={(e) => setReplyContent(e.target.value)}
                                  placeholder={`Reply to ${comment.userName}...`}
                                  className="min-h-[60px] bg-netflix-black/30 border-0 ring-0 focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:border-0 text-white placeholder:text-netflix-text-gray resize-none text-sm"
                                  maxLength={1000}
                                />
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`reply-spoiler-${comment.id}`}
                                      checked={replySpoiler}
                                      onCheckedChange={(checked) =>
                                        setReplySpoiler(checked as boolean)
                                      }
                                      className="data-[state=checked]:bg-netflix-red data-[state=checked]:border-netflix-red scale-75"
                                    />
                                    <label
                                      htmlFor={`reply-spoiler-${comment.id}`}
                                      className="text-xs text-netflix-text-gray cursor-pointer"
                                    >
                                      Spoiler
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-netflix-text-gray">
                                      {replyContent.length}/1000
                                    </span>
                                    <Button
                                      type="submit"
                                      disabled={!replyContent.trim() || submitting}
                                      className="bg-netflix-red hover:bg-netflix-red/80 disabled:opacity-50 h-7 px-3"
                                      size="sm"
                                    >
                                      <Send className="w-3 h-3 mr-1" />
                                      {submitting ? '...' : 'Reply'}
                                    </Button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                        setReplySpoiler(false);
                                      }}
                                      className="text-netflix-text-gray hover:text-white text-xs underline"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-4 space-y-3 pl-6 border-l border-netflix-gray/30">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex items-start space-x-2">
                              <Avatar className="w-6 h-6">
                                {reply.userAvatar ? (
                                  <AvatarImage src={reply.userAvatar} alt={reply.userName} />
                                ) : (
                                  <AvatarFallback className="bg-netflix-red/70 text-white text-xs">
                                    {reply.userName[0].toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <span className="font-semibold text-white text-xs">
                                    {reply.userName}
                                  </span>
                                  {reply.isSpoiler && (
                                    <span className="text-netflix-red text-xs italic">
                                      [spoiler]
                                    </span>
                                  )}
                                  <span className="text-netflix-text-gray text-xs">
                                    {formatRelativeTime(reply.createdAt)}
                                  </span>
                                  {isAuthenticated && user?.id === reply.userId && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteComment(reply.id)}
                                      className="text-netflix-text-gray hover:text-red-400 h-4 w-4 p-0"
                                    >
                                      <Trash2 className="w-2 h-2" />
                                    </Button>
                                  )}
                                </div>

                                {reply.isSpoiler ? (
                                  <div className="relative">
                                    {revealedSpoilers.has(reply.id) ? (
                                      <div>
                                        <p className="text-white text-xs leading-relaxed mb-1">
                                          {reply.content}
                                        </p>
                                        <button
                                          onClick={() => toggleSpoiler(reply.id)}
                                          className="text-netflix-text-gray hover:text-white text-xs underline"
                                        >
                                          Hide
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => toggleSpoiler(reply.id)}
                                        className="text-netflix-red hover:text-netflix-red/80 text-xs italic underline"
                                      >
                                        Spoiler - Click to reveal
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-white text-xs leading-relaxed">
                                    {reply.content}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
