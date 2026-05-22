import { useState } from 'react';
import { Search, MoreVertical, Shield, Ban, Crown, Eye, ShieldCheck, ShieldOff, BadgeCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useAdminUsers, useAdminUserCount } from '@/hooks/use-admin-users';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { UserDetailsModal } from '@/components/admin/UserDetailsModal';
import { BanUserDialog } from '@/components/admin/BanUserDialog';
import { ChangeRoleDialog } from '@/components/admin/ChangeRoleDialog';
import { ManagePremiumDialog } from '@/components/admin/ManagePremiumDialog';
import { ManageVerificationDialog } from '@/components/admin/ManageVerificationDialog';
import { VerificationBadge } from '@/components/ui/verification-badge';

type UserType = NonNullable<ReturnType<typeof useAdminUsers>['data']>[number];

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useAdminUsers(search);
  const { data: totalUsers, isLoading: countLoading } = useAdminUserCount();
  
  // Modal states
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [premiumDialogOpen, setPremiumDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);

  const handleViewDetails = (user: UserType) => {
    setSelectedUser(user);
    setDetailsOpen(true);
  };

  const handleBanUser = (user: UserType) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleChangeRole = (user: UserType) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleManagePremium = (user: UserType) => {
    setSelectedUser(user);
    setPremiumDialogOpen(true);
  };

  const handleManageVerification = (user: UserType) => {
    setSelectedUser(user);
    setVerificationDialogOpen(true);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-slate-400 mt-1">Manage and monitor all platform users</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{countLoading ? '—' : totalUsers?.toLocaleString()}</p>
          <p className="text-slate-400 text-sm">Total users</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs text-slate-400 uppercase">
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Verified</th>
              <th className="px-6 py-4">Account Mode</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Joined</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><Skeleton className="h-10 w-48 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-40 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-12 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-20 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-6 w-16 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-4 w-24 bg-slate-700" /></td>
                  <td className="px-6 py-4"><Skeleton className="h-8 w-8 bg-slate-700" /></td>
                </tr>
              ))
            ) : users?.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            ) : (
              users?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.photos?.[0]} />
                        <AvatarFallback className="bg-slate-700 text-white">
                          {user.display_name?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{user.display_name || 'Unknown'}</p>
                          {user.is_banned && (
                            <Badge variant="destructive" className="text-xs">Banned</Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {user.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {user.id_verified || user.live_verified ? (
                      <VerificationBadge 
                        idVerified={user.id_verified ?? false} 
                        liveVerified={user.live_verified ?? false} 
                        size="md"
                      />
                    ) : (
                      <span className="text-slate-500 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Badge 
                      variant="secondary" 
                      className={
                        user.account_mode === 'dating' 
                          ? 'bg-rose-500/20 text-rose-400 border-0'
                          : user.account_mode === 'fishing'
                          ? 'bg-emerald-500/20 text-emerald-400 border-0'
                          : 'bg-violet-500/20 text-violet-400 border-0'
                      }
                    >
                      {user.account_mode || 'N/A'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.is_premium && (
                        <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <Badge 
                        variant="secondary"
                        className={
                          user.is_active 
                            ? 'bg-emerald-500/20 text-emerald-400 border-0'
                            : 'bg-slate-500/20 text-slate-400 border-0'
                        }
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {format(new Date(user.created_at), 'MMM d, yyyy')}
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
                          onClick={() => handleViewDetails(user)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem 
                          onClick={() => handleManageVerification(user)}
                          className="text-blue-400 focus:text-blue-300 focus:bg-slate-700"
                        >
                          <BadgeCheck className="w-4 h-4 mr-2" />
                          Manage Verification
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleChangeRole(user)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleManagePremium(user)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Manage Premium
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-700" />
                        <DropdownMenuItem 
                          onClick={() => handleBanUser(user)}
                          className={user.is_banned 
                            ? "text-emerald-400 focus:text-emerald-300 focus:bg-slate-700"
                            : "text-rose-400 focus:text-rose-300 focus:bg-slate-700"
                          }
                        >
                          {user.is_banned ? (
                            <>
                              <ShieldCheck className="w-4 h-4 mr-2" />
                              Unban User
                            </>
                          ) : (
                            <>
                              <Ban className="w-4 h-4 mr-2" />
                              Ban User
                            </>
                          )}
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

      {/* Modals */}
      <UserDetailsModal 
        user={selectedUser} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
      <BanUserDialog 
        user={selectedUser} 
        open={banDialogOpen} 
        onOpenChange={setBanDialogOpen} 
      />
      <ChangeRoleDialog 
        user={selectedUser} 
        open={roleDialogOpen} 
        onOpenChange={setRoleDialogOpen} 
      />
      <ManagePremiumDialog 
        user={selectedUser} 
        open={premiumDialogOpen} 
        onOpenChange={setPremiumDialogOpen} 
      />
      <ManageVerificationDialog 
        user={selectedUser} 
        open={verificationDialogOpen} 
        onOpenChange={setVerificationDialogOpen} 
      />
    </div>
  );
}
