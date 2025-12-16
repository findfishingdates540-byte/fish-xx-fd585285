import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Settings, Edit, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationToggle } from '@/components/notifications/NotificationToggle';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const avatarUrl = profile?.photos?.[0] || '';
  const initials = profile?.display_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="p-4">
      <div className="flex flex-col items-center py-8">
        <Avatar className="h-24 w-24 border-2 border-border mb-4">
          <AvatarImage src={avatarUrl} alt={profile?.display_name || 'Profile'} />
          <AvatarFallback className="bg-muted text-muted-foreground text-2xl">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <h1 className="text-2xl font-bold">{profile?.display_name || 'User'}</h1>
        {profile?.bio && (
          <p className="text-muted-foreground text-center mt-2 max-w-xs">
            {profile.bio}
          </p>
        )}
      </div>

      <div className="space-y-2 max-w-md mx-auto">
        <Button variant="outline" className="w-full justify-start" asChild>
          <a href="/app/profile/edit">
            <Edit className="h-4 w-4 mr-3" />
            Edit Profile
          </a>
        </Button>
        
        <NotificationToggle />
        
        <Button variant="outline" className="w-full justify-start">
          <Settings className="h-4 w-4 mr-3" />
          Settings
        </Button>
        
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
