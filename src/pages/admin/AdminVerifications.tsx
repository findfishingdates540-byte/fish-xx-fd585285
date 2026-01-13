import { useState } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Eye, MoreVertical, BadgeCheck, FileText, Camera, ClipboardList, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AdminVerifiedMembers } from '@/components/admin/AdminVerifiedMembers';

interface VerificationRequest {
  id: string;
  user_id: string;
  type: string;
  status: string;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  id_document_url: string | null;
  id_document_type: string | null;
  selfie_url: string | null;
  created_at: string;
  user: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
    email: string | null;
    id_verified: boolean;
    live_verified: boolean;
  } | null;
}

export default function AdminVerifications() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState('queue');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const queryClient = useQueryClient();

  // Helper to get signed URL for private bucket files
  const getSignedUrl = async (path: string): Promise<string | null> => {
    // Check if it's already a full URL (legacy data) or just a path
    if (path.startsWith('http')) {
      // Extract path from full URL if it's legacy format
      const match = path.match(/verification-documents\/(.+)$/);
      if (match) {
        path = match[1];
      } else {
        return path; // Return as-is if can't extract
      }
    }
    
    const { data, error } = await supabase.storage
      .from('verification-documents')
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error creating signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  const handleViewDocument = async (documentPath: string, title: string) => {
    setIsLoadingPreview(true);
    const signedUrl = await getSignedUrl(documentPath);
    setIsLoadingPreview(false);
    
    if (signedUrl) {
      setPreviewImage({ url: signedUrl, title });
    } else {
      toast.error('Failed to load document');
    }
  };

  const { data: requests, isLoading } = useQuery({
    queryKey: ['admin-verification-requests', statusFilter, typeFilter],
    queryFn: async () => {
      let query = supabase
        .from('verification_requests')
        .select(`
          *,
          user:profiles!verification_requests_user_id_fkey (
            id,
            display_name,
            photos,
            email,
            id_verified,
            live_verified
          )
        `)
        .order('submitted_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as VerificationRequest[];
    },
  });

  const sendVerificationEmail = async (
    email: string,
    displayName: string,
    verificationType: 'id' | 'live',
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke('send-verification-email', {
        body: {
          email,
          displayName,
          verificationType,
          status,
          rejectionReason,
        },
      });
      if (error) {
        console.error('Failed to send verification email:', error);
      }
    } catch (err) {
      console.error('Failed to send verification email:', err);
    }
  };

  const handleApprove = async (request: VerificationRequest) => {
    setIsProcessing(true);
    try {
      // Update the verification request
      const { error: requestError } = await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Update the user's profile
      const updateData = request.type === 'id'
        ? {
            id_verified: true,
            id_verified_at: new Date().toISOString(),
            id_verified_by: user?.id,
          }
        : {
            live_verified: true,
            live_verified_at: new Date().toISOString(),
            live_verified_by: user?.id,
          };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', request.user_id);

      if (profileError) throw profileError;

      // Log the audit action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'verification_granted',
        entity_type: 'profile',
        entity_id: request.user_id,
        details: {
          verification_type: request.type,
          request_id: request.id,
        },
      });

      // Send approval email
      if (request.user?.email) {
        await sendVerificationEmail(
          request.user.email,
          request.user.display_name || 'User',
          request.type as 'id' | 'live',
          'approved'
        );
      }

      toast.success(`${request.type === 'id' ? 'ID' : 'Live'} verification approved`);
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedRequest(null);
    } catch (error) {
      console.error('Failed to approve verification:', error);
      toast.error('Failed to approve verification');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: VerificationRequest) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('verification_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', request.id);

      if (error) throw error;

      // Log the audit action
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'verification_revoked',
        entity_type: 'profile',
        entity_id: request.user_id,
        details: {
          verification_type: request.type,
          request_id: request.id,
          reason: rejectionReason,
        },
      });

      // Send rejection email
      if (request.user?.email) {
        await sendVerificationEmail(
          request.user.email,
          request.user.display_name || 'User',
          request.type as 'id' | 'live',
          'rejected',
          rejectionReason
        );
      }

      toast.success('Verification request rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-verification-requests'] });
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject verification:', error);
      toast.error('Failed to reject verification');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-500/20 text-rose-400 border-0">Rejected</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    if (type === 'id') {
      return (
        <Badge className="bg-slate-500/20 text-slate-300 border-0">
          <FileText className="w-3 h-3 mr-1" />
          ID Verification
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-500/20 text-blue-400 border-0">
        <Camera className="w-3 h-3 mr-1" />
        Live Verification
      </Badge>
    );
  };

  const pendingCount = requests?.filter(r => r.status === 'pending').length || 0;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Verifications</h1>
          <p className="text-slate-400 mt-1">Manage verification requests and verified members</p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-amber-500/20 text-amber-400 border-0 text-lg px-4 py-2">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Main Tabs */}
      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="queue" className="data-[state=active]:bg-slate-700 flex items-center gap-2">
            <ClipboardList className="w-4 h-4" />
            Verification Queue
          </TabsTrigger>
          <TabsTrigger value="directory" className="data-[state=active]:bg-slate-700 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Verified Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-0">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
              Pending
            </TabsTrigger>
            <TabsTrigger value="approved" className="data-[state=active]:bg-slate-700">
              Approved
            </TabsTrigger>
            <TabsTrigger value="rejected" className="data-[state=active]:bg-slate-700">
              Rejected
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
              All
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Tabs value={typeFilter} onValueChange={setTypeFilter}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
              All Types
            </TabsTrigger>
            <TabsTrigger value="id" className="data-[state=active]:bg-slate-700">
              <FileText className="w-4 h-4 mr-2" />
              ID
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-slate-700">
              <Camera className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))
        ) : !requests || requests.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
            <ShieldCheck className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No verification requests</h3>
            <p className="text-slate-400">There are no requests matching your filters.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={request.user?.photos?.[0]} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {request.user?.display_name?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white">
                        {request.user?.display_name || 'Unknown User'}
                      </h3>
                      {request.user?.id_verified && (
                        <BadgeCheck className="w-4 h-4 text-slate-400" />
                      )}
                      {request.user?.live_verified && (
                        <BadgeCheck className="w-4 h-4 text-blue-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      {getTypeBadge(request.type)}
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <span>
                        Submitted: {format(new Date(request.submitted_at || request.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                      {request.id_document_type && (
                        <span className="capitalize">
                          Document: {request.id_document_type.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {request.rejection_reason && (
                      <p className="mt-2 text-sm text-rose-400">
                        Rejection reason: {request.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
                        onClick={() => handleApprove(request)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-rose-500/20 border-rose-500/50 text-rose-400 hover:bg-rose-500/30"
                        onClick={() => setSelectedRequest(request)}
                        disabled={isProcessing}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      {request.id_document_url && (
                        <DropdownMenuItem
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                          onClick={() => handleViewDocument(request.id_document_url!, 'ID Document')}
                          disabled={isLoadingPreview}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View ID Document
                        </DropdownMenuItem>
                      )}
                      {request.selfie_url && (
                        <DropdownMenuItem
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                          onClick={() => handleViewDocument(request.selfie_url!, 'Selfie')}
                          disabled={isLoadingPreview}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Selfie
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
        </TabsContent>

        <TabsContent value="directory" className="mt-0">
          <AdminVerifiedMembers />
        </TabsContent>
      </Tabs>

      {/* Rejection Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Verification Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-400">
              Please provide a reason for rejecting this {selectedRequest?.type === 'id' ? 'ID' : 'live'} verification request from{' '}
              <span className="text-white font-medium">{selectedRequest?.user?.display_name}</span>.
            </p>
            <div className="space-y-2">
              <Label htmlFor="rejection-reason" className="text-slate-300">
                Rejection Reason
              </Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Document is unclear, photo doesn't match, etc."
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                className="border-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedRequest && handleReject(selectedRequest)}
                disabled={isProcessing || !rejectionReason.trim()}
                className="bg-rose-600 hover:bg-rose-700"
              >
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage || isLoadingPreview} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">{previewImage?.title || 'Loading...'}</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center min-h-[200px] items-center">
            {isLoadingPreview ? (
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            ) : previewImage ? (
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
