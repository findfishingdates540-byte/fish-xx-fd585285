import { useState } from 'react';
import { Search, MoreVertical, MessageSquare, Heart, Eye, Trash2, EyeOff, Image } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface FeedPost {
  id: string;
  content: string | null;
  photos: string[] | null;
  likes_count: number | null;
  comments_count: number | null;
  location_name: string | null;
  created_at: string | null;
  user: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

export default function AdminPosts() {
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<FeedPost | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['admin-posts', search],
    queryFn: async (): Promise<FeedPost[]> => {
      let query = supabase
        .from('feed_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (search) {
        query = query.ilike('content', `%${search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch user profiles for each post
      const userIds = [...new Set(data?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', userIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return (data || []).map(post => ({
        ...post,
        user: profilesMap.get(post.user_id) || null
      })) as FeedPost[];
    },
    staleTime: 30000,
  });

  const { mutate: deletePost, isPending: deletePending } = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      toast.success('Post deleted successfully');
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Failed to delete post: ${error.message}`);
    },
  });

  const handleViewDetails = (post: FeedPost) => {
    setSelectedPost(post);
    setDetailsOpen(true);
  };

  const handleDeletePost = (post: FeedPost) => {
    setSelectedPost(post);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Feed Posts</h1>
          <p className="text-slate-400 mt-1">Moderate all feed posts on the platform</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search posts by content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs text-slate-400 uppercase">
              <th className="px-6 py-4">Post</th>
              <th className="px-6 py-4">Author</th>
              <th className="px-6 py-4">Engagement</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-16 w-full bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-10 w-32 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-8 bg-slate-700" /></td>
                </tr>
              ))
            ) : posts?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-500" />
                  No posts found
                </td>
              </tr>
            ) : (
              posts?.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3 max-w-md">
                      {post.photos?.[0] && (
                        <img 
                          src={post.photos[0]} 
                          alt="Post" 
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <p className="text-slate-300 text-sm line-clamp-3">
                        {post.content || <span className="text-slate-500 italic">No text content</span>}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {post.user && (
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={post.user.photos?.[0]} />
                          <AvatarFallback className="bg-slate-700 text-white text-xs">
                            {post.user.display_name?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-slate-300 text-sm">{post.user.display_name}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-rose-400">
                        <Heart className="w-4 h-4" />
                        {post.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MessageSquare className="w-4 h-4" />
                        {post.comments_count || 0}
                      </span>
                      {post.photos && post.photos.length > 0 && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Image className="w-4 h-4" />
                          {post.photos.length}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem 
                          onClick={() => handleViewDetails(post)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePost(post)}
                          className="text-rose-400 focus:text-rose-300 focus:bg-slate-700"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Details</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              {/* Author */}
              {selectedPost.user && (
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedPost.user.photos?.[0]} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {selectedPost.user.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{selectedPost.user.display_name}</p>
                    <p className="text-slate-400 text-xs">
                      {selectedPost.created_at ? format(new Date(selectedPost.created_at), 'PPP \'at\' p') : 'Unknown date'}
                    </p>
                  </div>
                </div>
              )}

              {/* Content */}
              {selectedPost.content && (
                <p className="text-slate-300">{selectedPost.content}</p>
              )}

              {/* Photos */}
              {selectedPost.photos && selectedPost.photos.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {selectedPost.photos.map((photo, i) => (
                    <img 
                      key={i}
                      src={photo} 
                      alt={`Photo ${i + 1}`}
                      className="rounded-lg object-cover w-full aspect-square"
                    />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-slate-700">
                <span className="flex items-center gap-1 text-rose-400">
                  <Heart className="w-4 h-4" />
                  {selectedPost.likes_count || 0} likes
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                  {selectedPost.comments_count || 0} comments
                </span>
              </div>

              {selectedPost.location_name && (
                <p className="text-slate-400 text-sm">📍 {selectedPost.location_name}</p>
              )}

              <p className="text-xs text-slate-500">Post ID: {selectedPost.id}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Post</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete this post? This will also delete all comments and likes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPost && deletePost(selectedPost.id)}
              disabled={deletePending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletePending ? 'Deleting...' : 'Delete Post'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
