import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MoreVertical, Eye, Trash2, MessageSquare, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface FeedComment {
  id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  profile: {
    display_name: string | null;
    photos: string[] | null;
  } | null;
  post: {
    id: string;
    content: string | null;
    user_id: string;
  } | null;
}

export default function AdminComments() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'replies' | 'top-level'>('all');
  const [selectedComment, setSelectedComment] = useState<FeedComment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['admin-comments', searchQuery, filterType],
    queryFn: async () => {
      let query = supabase
        .from('feed_comments')
        .select(`
          id,
          content,
          created_at,
          updated_at,
          post_id,
          user_id,
          parent_id,
          post:feed_posts(id, content, user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchQuery) {
        query = query.ilike('content', `%${searchQuery}%`);
      }

      if (filterType === 'replies') {
        query = query.not('parent_id', 'is', null);
      } else if (filterType === 'top-level') {
        query = query.is('parent_id', null);
      }

      const { data: commentsData, error } = await query;
      if (error) throw error;

      // Get unique user IDs and fetch profiles
      const userIds = [...new Set(commentsData?.map(c => c.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Merge profiles with comments
      return (commentsData || []).map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null
      })) as FeedComment[];
    }
  });

  const { mutate: deleteComment, isPending: deletePending } = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('feed_comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Comment deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      setShowDeleteDialog(false);
      setSelectedComment(null);
    },
    onError: (error) => {
      toast.error('Failed to delete comment: ' + error.message);
    }
  });

  const handleViewDetails = (comment: FeedComment) => {
    setSelectedComment(comment);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (comment: FeedComment) => {
    setSelectedComment(comment);
    setShowDeleteDialog(true);
  };

  const truncateText = (text: string | null, length: number = 60) => {
    if (!text) return 'No content';
    return text.length > length ? text.substring(0, length) + '...' : text;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Comments Management</h1>
        <p className="text-slate-400 mt-1">Moderate and manage feed post comments</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
          <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-white">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="all" className="text-white hover:bg-slate-700">All Comments</SelectItem>
            <SelectItem value="top-level" className="text-white hover:bg-slate-700">Top-level Only</SelectItem>
            <SelectItem value="replies" className="text-white hover:bg-slate-700">Replies Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300 px-4 py-2">
          <MessageSquare className="w-4 h-4 mr-2" />
          {comments?.length || 0} Comments
        </Badge>
      </div>

      {/* Comments Table */}
      <div className="rounded-lg border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800 hover:bg-slate-900">
                <TableHead className="text-slate-400">Comment</TableHead>
                <TableHead className="text-slate-400">Author</TableHead>
                <TableHead className="text-slate-400">Post</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-slate-800">
                    <TableCell><Skeleton className="h-4 w-48 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20 bg-slate-700" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8 bg-slate-700 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : comments?.length === 0 ? (
                <TableRow className="border-slate-800">
                  <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                    No comments found
                  </TableCell>
                </TableRow>
              ) : (
                comments?.map((comment) => (
                  <TableRow key={comment.id} className="border-slate-800 hover:bg-slate-800/50">
                    <TableCell className="text-white max-w-[200px]">
                      <p className="truncate">{truncateText(comment.content, 50)}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {comment.profile?.photos?.[0] && (
                          <img
                            src={comment.profile.photos[0]}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        )}
                        <span className="text-white text-sm">
                          {comment.profile?.display_name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400 max-w-[150px]">
                      <p className="truncate text-sm">
                        {truncateText(comment.post?.content, 30)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={comment.parent_id 
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                        }
                      >
                        {comment.parent_id ? 'Reply' : 'Comment'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400 text-sm">
                      {format(new Date(comment.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-700">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem
                            className="text-white hover:bg-slate-700 cursor-pointer"
                            onClick={() => handleViewDetails(comment)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-400 hover:bg-slate-700 cursor-pointer"
                            onClick={() => handleDeleteClick(comment)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Comment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Comment Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Comment Details</DialogTitle>
          </DialogHeader>
          {selectedComment && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400">Author</label>
                <div className="flex items-center gap-3 mt-1">
                  {selectedComment.profile?.photos?.[0] && (
                    <img
                      src={selectedComment.profile.photos[0]}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium">
                    {selectedComment.profile?.display_name || 'Unknown User'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">Comment Content</label>
                <p className="mt-1 p-3 bg-slate-800 rounded-lg text-sm">
                  {selectedComment.content}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-400">On Post</label>
                <p className="mt-1 p-3 bg-slate-800 rounded-lg text-sm text-slate-300">
                  {selectedComment.post?.content || 'Post not available'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-400">Type</label>
                  <p className="mt-1">
                    <Badge
                      variant="outline"
                      className={selectedComment.parent_id 
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      }
                    >
                      {selectedComment.parent_id ? 'Reply' : 'Top-level Comment'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-slate-400">Created</label>
                  <p className="mt-1 text-sm">
                    {format(new Date(selectedComment.created_at), 'PPpp')}
                  </p>
                </div>
              </div>

              {selectedComment.updated_at && selectedComment.updated_at !== selectedComment.created_at && (
                <div>
                  <label className="text-sm text-slate-400">Last Edited</label>
                  <p className="mt-1 text-sm text-slate-300">
                    {format(new Date(selectedComment.updated_at), 'PPpp')}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-400">Comment ID</label>
                <p className="mt-1 font-mono text-xs text-slate-500">{selectedComment.id}</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => setShowDetailsModal(false)}
                >
                  Close
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-slate-900 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Comment
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this comment? This action cannot be undone.
              {selectedComment?.parent_id === null && (
                <span className="block mt-2 text-amber-400">
                  Note: This is a top-level comment. Any replies to it may become orphaned.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="p-3 bg-slate-800 rounded-lg my-2">
            <p className="text-sm text-slate-300 line-clamp-3">
              "{selectedComment?.content}"
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => selectedComment && deleteComment(selectedComment.id)}
              disabled={deletePending}
            >
              {deletePending ? 'Deleting...' : 'Delete Comment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
