import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MatchExpiration {
  matchId: string;
  expiresAt: Date | null;
  timeRemaining: number | null; // in milliseconds
  isExpiringSoon: boolean; // less than 6 hours
  isUrgent: boolean; // less than 1 hour
  formattedTime: string;
}

export function useMatchExpiration(matchIds: string[]) {
  const { user } = useAuth();
  const [now, setNow] = useState(Date.now());
  
  // Update "now" every minute for countdown updates
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);
  
  const { data: expirations } = useQuery({
    queryKey: ['match-expirations', matchIds, user?.id],
    queryFn: async () => {
      if (!user?.id || matchIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('matches')
        .select('id, expires_at')
        .in('id', matchIds)
        .not('expires_at', 'is', null);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && matchIds.length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
  
  // Calculate expiration status for each match
  const expirationMap = useMemo(() => {
    const map = new Map<string, MatchExpiration>();
    
    if (!expirations) return map;
    
    for (const match of expirations) {
      if (!match.expires_at) continue;
      
      const expiresAt = new Date(match.expires_at);
      const timeRemaining = expiresAt.getTime() - now;
      const isExpiringSoon = timeRemaining > 0 && timeRemaining < 6 * 60 * 60 * 1000; // 6 hours
      const isUrgent = timeRemaining > 0 && timeRemaining < 60 * 60 * 1000; // 1 hour
      
      let formattedTime = '';
      if (timeRemaining <= 0) {
        formattedTime = 'Expired';
      } else if (timeRemaining < 60 * 60 * 1000) {
        const minutes = Math.floor(timeRemaining / 60000);
        formattedTime = `${minutes}m left`;
      } else if (timeRemaining < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
        formattedTime = `${hours}h left`;
      } else {
        const days = Math.floor(timeRemaining / (24 * 60 * 60 * 1000));
        formattedTime = `${days}d left`;
      }
      
      map.set(match.id, {
        matchId: match.id,
        expiresAt,
        timeRemaining,
        isExpiringSoon,
        isUrgent,
        formattedTime,
      });
    }
    
    return map;
  }, [expirations, now]);
  
  const getExpiration = (matchId: string): MatchExpiration | null => {
    return expirationMap.get(matchId) || null;
  };
  
  return {
    expirationMap,
    getExpiration,
  };
}
