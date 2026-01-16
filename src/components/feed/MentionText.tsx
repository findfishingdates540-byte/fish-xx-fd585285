import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface MentionTextProps {
  content: string;
  className?: string;
}

/**
 * Renders text with clickable @mentions that link to user profiles.
 * Looks up usernames against display_name in public_profiles.
 */
export function MentionText({ content, className }: MentionTextProps) {
  // Extract all mentions from content
  const mentionRegex = /@(\w+)/g;
  const mentions = [...content.matchAll(mentionRegex)].map(m => m[1]);
  const uniqueMentions = [...new Set(mentions)];

  // Fetch user IDs for all mentioned usernames
  const { data: mentionMap = {} } = useQuery({
    queryKey: ['mention-users', uniqueMentions.join(',')],
    queryFn: async () => {
      if (uniqueMentions.length === 0) return {};
      
      // Build a map of username -> userId
      const map: Record<string, string> = {};
      
      for (const username of uniqueMentions) {
        const { data } = await supabase
          .from('public_profiles')
          .select('id, display_name')
          .ilike('display_name', username.replace(/_/g, ' '))
          .limit(1)
          .maybeSingle();
        
        if (data) {
          map[username.toLowerCase()] = data.id;
        }
      }
      
      return map;
    },
    enabled: uniqueMentions.length > 0,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Split content by mentions and render
  const parts = content.split(/(@\w+)/g);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          const username = part.slice(1).toLowerCase();
          const userId = mentionMap[username];
          
          if (userId) {
            return (
              <Link
                key={index}
                to={`/app/u/${userId}`}
                className="text-primary font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </Link>
            );
          }
          
          // Mention doesn't match a user, just highlight it
          return (
            <span key={index} className="text-primary font-medium">
              {part}
            </span>
          );
        }
        return part;
      })}
    </span>
  );
}
