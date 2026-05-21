export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          ad_type: string
          clicks: number
          created_at: string
          created_by: string | null
          cta_text: string | null
          cta_url: string | null
          description: string | null
          end_date: string | null
          fishing_spot_id: string | null
          id: string
          impressions: number
          is_active: boolean
          photos: string[] | null
          sponsor_logo: string | null
          sponsor_name: string
          start_date: string
          target_age_max: number | null
          target_age_min: number | null
          target_experience_levels: string[] | null
          target_genders: string[] | null
          target_interests: string[] | null
          target_location_lat: number | null
          target_location_lng: number | null
          target_location_radius_miles: number | null
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          ad_type?: string
          clicks?: number
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          end_date?: string | null
          fishing_spot_id?: string | null
          id?: string
          impressions?: number
          is_active?: boolean
          photos?: string[] | null
          sponsor_logo?: string | null
          sponsor_name: string
          start_date?: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_experience_levels?: string[] | null
          target_genders?: string[] | null
          target_interests?: string[] | null
          target_location_lat?: number | null
          target_location_lng?: number | null
          target_location_radius_miles?: number | null
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          ad_type?: string
          clicks?: number
          created_at?: string
          created_by?: string | null
          cta_text?: string | null
          cta_url?: string | null
          description?: string | null
          end_date?: string | null
          fishing_spot_id?: string | null
          id?: string
          impressions?: number
          is_active?: boolean
          photos?: string[] | null
          sponsor_logo?: string | null
          sponsor_name?: string
          start_date?: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_experience_levels?: string[] | null
          target_genders?: string[] | null
          target_interests?: string[] | null
          target_location_lat?: number | null
          target_location_lng?: number | null
          target_location_radius_miles?: number | null
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_fishing_spot_id_fkey"
            columns: ["fishing_spot_id"]
            isOneToOne: false
            referencedRelation: "fishing_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      angler_badges: {
        Row: {
          badge_description: string | null
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          metadata: Json | null
          species_id: string | null
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          species_id?: string | null
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          metadata?: Json | null
          species_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "angler_badges_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "buddy_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      buddy_messages: {
        Row: {
          audio_url: string | null
          buddy_id: string
          content: string
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean | null
          delivered_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          buddy_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          delivered_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          buddy_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          delivered_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "buddy_messages_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "fishing_buddies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "buddy_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buddy_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      call_sessions: {
        Row: {
          answered_at: string | null
          call_type: string
          callee_id: string
          caller_id: string
          channel_name: string
          created_at: string
          ended_at: string | null
          id: string
          room_url: string | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          answered_at?: string | null
          call_type: string
          callee_id: string
          caller_id: string
          channel_name: string
          created_at?: string
          ended_at?: string | null
          id?: string
          room_url?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          answered_at?: string | null
          call_type?: string
          callee_id?: string
          caller_id?: string
          channel_name?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          room_url?: string | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_callee_id_fkey"
            columns: ["callee_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "call_sessions_caller_id_fkey"
            columns: ["caller_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      catch_comments: {
        Row: {
          body: string
          catch_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          catch_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          catch_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catch_comments_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
        ]
      }
      catch_photos: {
        Row: {
          catch_id: string
          created_at: string
          id: string
          photo_type: Database["public"]["Enums"]["catch_photo_type"]
          photo_url: string
        }
        Insert: {
          catch_id: string
          created_at?: string
          id?: string
          photo_type?: Database["public"]["Enums"]["catch_photo_type"]
          photo_url: string
        }
        Update: {
          catch_id?: string
          created_at?: string
          id?: string
          photo_type?: Database["public"]["Enums"]["catch_photo_type"]
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "catch_photos_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
        ]
      }
      catches: {
        Row: {
          approval_notes: string | null
          approval_status: Database["public"]["Enums"]["catch_approval_status"]
          approved_at: string | null
          approved_by: string | null
          bait_used: string | null
          catch_method: string | null
          catch_status: string
          caught_at: string | null
          challenge_id: string | null
          computed_score: number | null
          cover_photo_url: string | null
          created_at: string
          fishing_spot_id: string | null
          gear_used: string[] | null
          general_location: string | null
          id: string
          is_estimated_size: boolean
          is_private: boolean
          is_verified: boolean
          length_in: number | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          measurement_photo_url: string | null
          notes: string | null
          photos: string[] | null
          share_location: boolean | null
          species_id: string | null
          species_name: string | null
          tournament_id: string | null
          trophy_level: string | null
          user_id: string
          video_url: string | null
          weight_lbs: number | null
        }
        Insert: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["catch_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          bait_used?: string | null
          catch_method?: string | null
          catch_status?: string
          caught_at?: string | null
          challenge_id?: string | null
          computed_score?: number | null
          cover_photo_url?: string | null
          created_at?: string
          fishing_spot_id?: string | null
          gear_used?: string[] | null
          general_location?: string | null
          id?: string
          is_estimated_size?: boolean
          is_private?: boolean
          is_verified?: boolean
          length_in?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          measurement_photo_url?: string | null
          notes?: string | null
          photos?: string[] | null
          share_location?: boolean | null
          species_id?: string | null
          species_name?: string | null
          tournament_id?: string | null
          trophy_level?: string | null
          user_id: string
          video_url?: string | null
          weight_lbs?: number | null
        }
        Update: {
          approval_notes?: string | null
          approval_status?: Database["public"]["Enums"]["catch_approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          bait_used?: string | null
          catch_method?: string | null
          catch_status?: string
          caught_at?: string | null
          challenge_id?: string | null
          computed_score?: number | null
          cover_photo_url?: string | null
          created_at?: string
          fishing_spot_id?: string | null
          gear_used?: string[] | null
          general_location?: string | null
          id?: string
          is_estimated_size?: boolean
          is_private?: boolean
          is_verified?: boolean
          length_in?: number | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          measurement_photo_url?: string | null
          notes?: string | null
          photos?: string[] | null
          share_location?: boolean | null
          species_id?: string | null
          species_name?: string | null
          tournament_id?: string | null
          trophy_level?: string | null
          user_id?: string
          video_url?: string | null
          weight_lbs?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "catches_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "fishing_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_fishing_spot_id_fkey"
            columns: ["fishing_spot_id"]
            isOneToOne: false
            referencedRelation: "fishing_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          best_catch_id: string | null
          challenge_id: string
          id: string
          joined_at: string
          rank: number | null
          score: number
          team_id: string | null
          user_id: string
        }
        Insert: {
          best_catch_id?: string | null
          challenge_id: string
          id?: string
          joined_at?: string
          rank?: number | null
          score?: number
          team_id?: string | null
          user_id: string
        }
        Update: {
          best_catch_id?: string | null
          challenge_id?: string
          id?: string
          joined_at?: string
          rank?: number | null
          score?: number
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_best_catch_id_fkey"
            columns: ["best_catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "fishing_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      challenge_reminders: {
        Row: {
          challenge_id: string
          created_at: string
          id: string
          remind_at: string
          sent: boolean
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          id?: string
          remind_at: string
          sent?: boolean
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          id?: string
          remind_at?: string
          sent?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_reminders_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "fishing_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          challenge_id: string | null
          created_at: string
          currency: string
          entry_id: string | null
          fishing_challenge_id: string | null
          id: string
          refunded_at: string | null
          released_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          tournament_id: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          challenge_id?: string | null
          created_at?: string
          currency?: string
          entry_id?: string | null
          fishing_challenge_id?: string | null
          id?: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tournament_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          challenge_id?: string | null
          created_at?: string
          currency?: string
          entry_id?: string | null
          fishing_challenge_id?: string | null
          id?: string
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          tournament_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_fishing_challenge_id_fkey"
            columns: ["fishing_challenge_id"]
            isOneToOne: false
            referencedRelation: "fishing_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          parent_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          parent_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "feed_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          catch_id: string | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          location_name: string | null
          photos: string[] | null
          updated_at: string | null
          user_id: string
          video_url: string | null
        }
        Insert: {
          catch_id?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          location_name?: string | null
          photos?: string[] | null
          updated_at?: string | null
          user_id: string
          video_url?: string | null
        }
        Update: {
          catch_id?: string | null
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          location_name?: string | null
          photos?: string[] | null
          updated_at?: string | null
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
        ]
      }
      fish_species: {
        Row: {
          base_score: number | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          measurement_type: string | null
          name: string
          safe_release: boolean
          scientific_name: string | null
          trophy_exceptional: number | null
          trophy_quality: number | null
          trophy_trophy: number | null
          trophy_unit: string | null
          water_type: string | null
          world_record_angler: string | null
          world_record_country: string | null
          world_record_date: string | null
          world_record_location: string | null
          world_record_source: string | null
          world_record_weight_lbs: number | null
          world_record_weight_text: string | null
        }
        Insert: {
          base_score?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          measurement_type?: string | null
          name: string
          safe_release?: boolean
          scientific_name?: string | null
          trophy_exceptional?: number | null
          trophy_quality?: number | null
          trophy_trophy?: number | null
          trophy_unit?: string | null
          water_type?: string | null
          world_record_angler?: string | null
          world_record_country?: string | null
          world_record_date?: string | null
          world_record_location?: string | null
          world_record_source?: string | null
          world_record_weight_lbs?: number | null
          world_record_weight_text?: string | null
        }
        Update: {
          base_score?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          measurement_type?: string | null
          name?: string
          safe_release?: boolean
          scientific_name?: string | null
          trophy_exceptional?: number | null
          trophy_quality?: number | null
          trophy_trophy?: number | null
          trophy_unit?: string | null
          water_type?: string | null
          world_record_angler?: string | null
          world_record_country?: string | null
          world_record_date?: string | null
          world_record_location?: string | null
          world_record_source?: string | null
          world_record_weight_lbs?: number | null
          world_record_weight_text?: string | null
        }
        Relationships: []
      }
      fishing_buddies: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string
        }
        Relationships: []
      }
      fishing_challenge_entries: {
        Row: {
          challenge_id: string
          created_at: string
          has_paid: boolean
          id: string
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          has_paid?: boolean
          id?: string
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          has_paid?: boolean
          id?: string
          stripe_session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fishing_challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "fishing_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      fishing_challenges: {
        Row: {
          challenge_type: Database["public"]["Enums"]["challenge_type"]
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          entry_fee: number
          entry_fee_enabled: boolean
          id: string
          is_admin_funded: boolean
          is_official: boolean
          platform_fee_percent: number
          prize_description: string | null
          prize_type: string
          prizes: Json | null
          rules: Json | null
          species_id: string | null
          start_date: string
          status: string
          target_species_name: string | null
          title: string
          winner_id: string | null
        }
        Insert: {
          challenge_type?: Database["public"]["Enums"]["challenge_type"]
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          entry_fee?: number
          entry_fee_enabled?: boolean
          id?: string
          is_admin_funded?: boolean
          is_official?: boolean
          platform_fee_percent?: number
          prize_description?: string | null
          prize_type?: string
          prizes?: Json | null
          rules?: Json | null
          species_id?: string | null
          start_date: string
          status?: string
          target_species_name?: string | null
          title: string
          winner_id?: string | null
        }
        Update: {
          challenge_type?: Database["public"]["Enums"]["challenge_type"]
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          entry_fee?: number
          entry_fee_enabled?: boolean
          id?: string
          is_admin_funded?: boolean
          is_official?: boolean
          platform_fee_percent?: number
          prize_description?: string | null
          prize_type?: string
          prizes?: Json | null
          rules?: Json | null
          species_id?: string | null
          start_date?: string
          status?: string
          target_species_name?: string | null
          title?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishing_challenges_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
        ]
      }
      fishing_spots: {
        Row: {
          area_type: string | null
          coast: string | null
          county: string | null
          created_at: string
          created_by: string | null
          deploy_date: string | null
          deploy_id: string | null
          depth_ft: number | null
          description: string | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          jurisdiction: string | null
          location_accuracy: string | null
          location_lat: number
          location_lng: number
          location_name: string | null
          name: string
          photos: string[] | null
          primary_material: string | null
          rating_avg: number | null
          rating_count: number | null
          relief_ft: number | null
          source: string | null
          species_available: string[] | null
          tons: number | null
          updated_at: string
        }
        Insert: {
          area_type?: string | null
          coast?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          deploy_date?: string | null
          deploy_id?: string | null
          depth_ft?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          jurisdiction?: string | null
          location_accuracy?: string | null
          location_lat: number
          location_lng: number
          location_name?: string | null
          name: string
          photos?: string[] | null
          primary_material?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          relief_ft?: number | null
          source?: string | null
          species_available?: string[] | null
          tons?: number | null
          updated_at?: string
        }
        Update: {
          area_type?: string | null
          coast?: string | null
          county?: string | null
          created_at?: string
          created_by?: string | null
          deploy_date?: string | null
          deploy_id?: string | null
          depth_ft?: number | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          jurisdiction?: string | null
          location_accuracy?: string | null
          location_lat?: number
          location_lng?: number
          location_name?: string | null
          name?: string
          photos?: string[] | null
          primary_material?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          relief_ft?: number | null
          source?: string | null
          species_available?: string[] | null
          tons?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fishing_spots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_spots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_spots_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fishing_teams: {
        Row: {
          captain_id: string
          category: string
          cover_url: string | null
          created_at: string
          description: string | null
          followers_count: number
          group_description: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          page_description: string | null
          phone: string | null
          rules: string | null
          skill_level: Database["public"]["Enums"]["fishing_experience"]
          team_type: string
          website: string | null
        }
        Insert: {
          captain_id: string
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          followers_count?: number
          group_description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          page_description?: string | null
          phone?: string | null
          rules?: string | null
          skill_level?: Database["public"]["Enums"]["fishing_experience"]
          team_type?: string
          website?: string | null
        }
        Update: {
          captain_id?: string
          category?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          followers_count?: number
          group_description?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          page_description?: string | null
          phone?: string | null
          rules?: string | null
          skill_level?: Database["public"]["Enums"]["fishing_experience"]
          team_type?: string
          website?: string | null
        }
        Relationships: []
      }
      fishing_trips: {
        Row: {
          bait_details: string | null
          coordinates_notes: string | null
          created_at: string
          departure_reminder: boolean | null
          end_time: string | null
          fishing_spot_id: string | null
          gear_checklist: Json | null
          id: string
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          notes: string | null
          parent_trip_id: string | null
          recurrence_end_date: string | null
          recurrence_type: string | null
          start_time: string | null
          status: string
          target_species: string[] | null
          title: string
          trip_date: string
          trip_type: string
          updated_at: string
          user_id: string
          weather_alert: boolean | null
          weather_notes: string | null
        }
        Insert: {
          bait_details?: string | null
          coordinates_notes?: string | null
          created_at?: string
          departure_reminder?: boolean | null
          end_time?: string | null
          fishing_spot_id?: string | null
          gear_checklist?: Json | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          parent_trip_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          start_time?: string | null
          status?: string
          target_species?: string[] | null
          title: string
          trip_date: string
          trip_type?: string
          updated_at?: string
          user_id: string
          weather_alert?: boolean | null
          weather_notes?: string | null
        }
        Update: {
          bait_details?: string | null
          coordinates_notes?: string | null
          created_at?: string
          departure_reminder?: boolean | null
          end_time?: string | null
          fishing_spot_id?: string | null
          gear_checklist?: Json | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          notes?: string | null
          parent_trip_id?: string | null
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          start_time?: string | null
          status?: string
          target_species?: string[] | null
          title?: string
          trip_date?: string
          trip_type?: string
          updated_at?: string
          user_id?: string
          weather_alert?: boolean | null
          weather_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fishing_trips_fishing_spot_id_fkey"
            columns: ["fishing_spot_id"]
            isOneToOne: false
            referencedRelation: "fishing_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_trips_parent_trip_id_fkey"
            columns: ["parent_trip_id"]
            isOneToOne: false
            referencedRelation: "fishing_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishing_trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leaderboard_entries: {
        Row: {
          id: string
          largest_catch_id: string | null
          largest_length_in: number | null
          largest_weight_lbs: number | null
          rank_by_count: number | null
          rank_by_weight: number | null
          species_id: string | null
          species_name: string
          total_caught: number
          total_harvested: number
          total_released: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          largest_catch_id?: string | null
          largest_length_in?: number | null
          largest_weight_lbs?: number | null
          rank_by_count?: number | null
          rank_by_weight?: number | null
          species_id?: string | null
          species_name: string
          total_caught?: number
          total_harvested?: number
          total_released?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          largest_catch_id?: string | null
          largest_length_in?: number | null
          largest_weight_lbs?: number | null
          rank_by_count?: number | null
          rank_by_weight?: number | null
          species_id?: string | null
          species_name?: string
          total_caught?: number
          total_harvested?: number
          total_released?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leaderboard_entries_largest_catch_id_fkey"
            columns: ["largest_catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboard_entries_species_id_fkey"
            columns: ["species_id"]
            isOneToOne: false
            referencedRelation: "fish_species"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_match: boolean | null
          matched_at: string | null
          user1_id: string
          user1_liked: boolean | null
          user1_viewed_at: string | null
          user2_id: string
          user2_liked: boolean | null
          user2_viewed_at: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_match?: boolean | null
          matched_at?: string | null
          user1_id: string
          user1_liked?: boolean | null
          user1_viewed_at?: string | null
          user2_id: string
          user2_liked?: boolean | null
          user2_viewed_at?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_match?: boolean | null
          matched_at?: string | null
          user1_id?: string
          user1_liked?: boolean | null
          user1_viewed_at?: string | null
          user2_id?: string
          user2_liked?: boolean | null
          user2_viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user1_id_fkey"
            columns: ["user1_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean | null
          delivered_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          match_id: string
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          delivered_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id: string
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          delivered_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id?: string
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_email_prefs: {
        Row: {
          buddy_message: boolean
          buddy_request: boolean
          challenge_new: boolean
          comment_mention: boolean
          created_at: string
          feed_comment: boolean
          feed_like: boolean
          master_enabled: boolean
          match: boolean
          message: boolean
          new_follower: boolean
          prize_won: boolean
          trip_invite: boolean
          trip_reminder: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          buddy_message?: boolean
          buddy_request?: boolean
          challenge_new?: boolean
          comment_mention?: boolean
          created_at?: string
          feed_comment?: boolean
          feed_like?: boolean
          master_enabled?: boolean
          match?: boolean
          message?: boolean
          new_follower?: boolean
          prize_won?: boolean
          trip_invite?: boolean
          trip_reminder?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          buddy_message?: boolean
          buddy_request?: boolean
          challenge_new?: boolean
          comment_mention?: boolean
          created_at?: string
          feed_comment?: boolean
          feed_like?: boolean
          master_enabled?: boolean
          match?: boolean
          message?: boolean
          new_follower?: boolean
          prize_won?: boolean
          trip_invite?: boolean
          trip_reminder?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      photo_challenge_entries: {
        Row: {
          caption: string | null
          captured_at: string | null
          challenge_id: string
          created_at: string
          has_paid: boolean
          id: string
          location_lat: number | null
          location_lng: number | null
          photo_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          captured_at?: string | null
          challenge_id: string
          created_at?: string
          has_paid?: boolean
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          photo_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          captured_at?: string | null
          challenge_id?: string
          created_at?: string
          has_paid?: boolean
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          photo_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_challenge_entries_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges_public"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_challenge_votes: {
        Row: {
          challenge_id: string
          created_at: string
          entry_id: string
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          entry_id: string
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          entry_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_challenge_votes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_challenge_votes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_challenge_votes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "photo_challenge_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_challenges: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string
          description: string | null
          end_date: string
          entry_fee: number
          entry_fee_enabled: boolean
          gift_card_code: string | null
          id: string
          is_admin_funded: boolean
          platform_fee_percent: number
          prize_description: string | null
          prize_type: string
          start_date: string
          status: string
          title: string
          voting_end_date: string
          winner_id: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_date: string
          entry_fee?: number
          entry_fee_enabled?: boolean
          gift_card_code?: string | null
          id?: string
          is_admin_funded?: boolean
          platform_fee_percent?: number
          prize_description?: string | null
          prize_type?: string
          start_date: string
          status?: string
          title: string
          voting_end_date: string
          winner_id?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_date?: string
          entry_fee?: number
          entry_fee_enabled?: boolean
          gift_card_code?: string | null
          id?: string
          is_admin_funded?: boolean
          platform_fee_percent?: number
          prize_description?: string | null
          prize_type?: string
          start_date?: string
          status?: string
          title?: string
          voting_end_date?: string
          winner_id?: string | null
        }
        Relationships: []
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reposts: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reposts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      prize_payouts: {
        Row: {
          admin_notes: string | null
          challenge_id: string | null
          created_at: string
          fishing_challenge_id: string | null
          gift_card_code: string | null
          gross_pool: number | null
          id: string
          notified_at: string | null
          platform_fee_amount: number | null
          prize_amount: number | null
          prize_description: string | null
          prize_type: string
          sent_at: string | null
          status: string
          tournament_id: string | null
          winner_id: string
        }
        Insert: {
          admin_notes?: string | null
          challenge_id?: string | null
          created_at?: string
          fishing_challenge_id?: string | null
          gift_card_code?: string | null
          gross_pool?: number | null
          id?: string
          notified_at?: string | null
          platform_fee_amount?: number | null
          prize_amount?: number | null
          prize_description?: string | null
          prize_type?: string
          sent_at?: string | null
          status?: string
          tournament_id?: string | null
          winner_id: string
        }
        Update: {
          admin_notes?: string | null
          challenge_id?: string | null
          created_at?: string
          fishing_challenge_id?: string | null
          gift_card_code?: string | null
          gross_pool?: number | null
          id?: string
          notified_at?: string | null
          platform_fee_amount?: number | null
          prize_amount?: number | null
          prize_description?: string | null
          prize_type?: string
          sent_at?: string | null
          status?: string
          tournament_id?: string | null
          winner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prize_payouts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_payouts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "photo_challenges_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_payouts_fishing_challenge_id_fkey"
            columns: ["fishing_challenge_id"]
            isOneToOne: false
            referencedRelation: "fishing_challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_payouts_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_payouts_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_payouts_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prize_payouts_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_mode: Database["public"]["Enums"]["account_mode"] | null
          bio: string | null
          city: string | null
          cover_photo: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          drinking: Database["public"]["Enums"]["drinking_habit"] | null
          education: string | null
          email: string | null
          fishing_experience:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear: string[] | null
          fishing_styles: string[] | null
          followers_count: number | null
          following_count: number | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string
          id_verified: boolean | null
          id_verified_at: string | null
          id_verified_by: string | null
          id_verified_expires_at: string | null
          interested_in: Database["public"]["Enums"]["gender_type"][] | null
          interests: string[] | null
          is_active: boolean | null
          is_banned: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          live_verified: boolean | null
          live_verified_at: string | null
          live_verified_by: string | null
          live_verified_expires_at: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          looking_for: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference: number | null
          max_distance_miles: number | null
          min_age_preference: number | null
          occupation: string | null
          onboarding_completed: boolean | null
          personality_type:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos: string[] | null
          preferred_species: string[] | null
          premium_expires_at: string | null
          prompt_responses: Json | null
          referred_by: string | null
          signup_source: string | null
          smoking: Database["public"]["Enums"]["smoking_habit"] | null
          state: string | null
          stripe_customer_id: string | null
          total_likes_received: number | null
          updated_at: string
          verification_notes: string | null
          verification_reminder_sent_at: string | null
          zip_code: string | null
          zodiac_sign: string | null
        }
        Insert: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          bio?: string | null
          city?: string | null
          cover_photo?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          drinking?: Database["public"]["Enums"]["drinking_habit"] | null
          education?: string | null
          email?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          fishing_styles?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id: string
          id_verified?: boolean | null
          id_verified_at?: string | null
          id_verified_by?: string | null
          id_verified_expires_at?: string | null
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          live_verified?: boolean | null
          live_verified_at?: string | null
          live_verified_by?: string | null
          live_verified_expires_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_miles?: number | null
          min_age_preference?: number | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos?: string[] | null
          preferred_species?: string[] | null
          premium_expires_at?: string | null
          prompt_responses?: Json | null
          referred_by?: string | null
          signup_source?: string | null
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          stripe_customer_id?: string | null
          total_likes_received?: number | null
          updated_at?: string
          verification_notes?: string | null
          verification_reminder_sent_at?: string | null
          zip_code?: string | null
          zodiac_sign?: string | null
        }
        Update: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          bio?: string | null
          city?: string | null
          cover_photo?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          drinking?: Database["public"]["Enums"]["drinking_habit"] | null
          education?: string | null
          email?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          fishing_styles?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          id_verified?: boolean | null
          id_verified_at?: string | null
          id_verified_by?: string | null
          id_verified_expires_at?: string | null
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          live_verified?: boolean | null
          live_verified_at?: string | null
          live_verified_by?: string | null
          live_verified_expires_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_miles?: number | null
          min_age_preference?: number | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos?: string[] | null
          preferred_species?: string[] | null
          premium_expires_at?: string | null
          prompt_responses?: Json | null
          referred_by?: string | null
          signup_source?: string | null
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          stripe_customer_id?: string | null
          total_likes_received?: number | null
          updated_at?: string
          verification_notes?: string | null
          verification_reminder_sent_at?: string | null
          zip_code?: string | null
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          apns_token: string | null
          auth: string | null
          created_at: string
          device_type: string | null
          endpoint: string | null
          fcm_token: string | null
          id: string
          p256dh: string | null
          user_id: string
        }
        Insert: {
          apns_token?: string | null
          auth?: string | null
          created_at?: string
          device_type?: string | null
          endpoint?: string | null
          fcm_token?: string | null
          id?: string
          p256dh?: string | null
          user_id: string
        }
        Update: {
          apns_token?: string | null
          auth?: string | null
          created_at?: string
          device_type?: string | null
          endpoint?: string | null
          fcm_token?: string | null
          id?: string
          p256dh?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          key: string
          request_count: number
          window_start: string
        }
        Insert: {
          key: string
          request_count?: number
          window_start?: string
        }
        Update: {
          key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_catch_id: string | null
          reported_spot_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_catch_id?: string | null
          reported_spot_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_catch_id?: string | null
          reported_spot_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_catch_id_fkey"
            columns: ["reported_catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_spot_id_fkey"
            columns: ["reported_spot_id"]
            isOneToOne: false
            referencedRelation: "fishing_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      scoring_catch_methods: {
        Row: {
          key: string
          label: string
          multiplier: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          key: string
          label: string
          multiplier: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          key?: string
          label?: string
          multiplier?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      scoring_streak_bonuses: {
        Row: {
          bonus: number
          label: string
          streak_type: string
        }
        Insert: {
          bonus: number
          label: string
          streak_type: string
        }
        Update: {
          bonus?: number
          label?: string
          streak_type?: string
        }
        Relationships: []
      }
      scoring_tournament_multipliers: {
        Row: {
          key: string
          label: string
          multiplier_text: string
          sort_order: number
        }
        Insert: {
          key: string
          label: string
          multiplier_text: string
          sort_order?: number
        }
        Update: {
          key?: string
          label?: string
          multiplier_text?: string
          sort_order?: number
        }
        Relationships: []
      }
      scoring_trophy_bonuses: {
        Row: {
          bonus: number
          label: string
          level: string
          sort_order: number
        }
        Insert: {
          bonus: number
          label: string
          level: string
          sort_order?: number
        }
        Update: {
          bonus?: number
          label?: string
          level?: string
          sort_order?: number
        }
        Relationships: []
      }
      scoring_variety_milestones: {
        Row: {
          bonus: number
          species_count: number
        }
        Insert: {
          bonus: number
          species_count: number
        }
        Update: {
          bonus?: number
          species_count?: number
        }
        Relationships: []
      }
      spot_ratings: {
        Row: {
          created_at: string
          id: string
          photos: string[] | null
          rating: number
          review: string | null
          spot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photos?: string[] | null
          rating: number
          review?: string | null
          spot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photos?: string[] | null
          rating?: number
          review?: string | null
          spot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spot_ratings_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "fishing_spots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spot_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          background_color: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string | null
          media_url: string | null
          text_overlay: string | null
          user_id: string
        }
        Insert: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          text_overlay?: string | null
          user_id: string
        }
        Update: {
          background_color?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          text_overlay?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          id: string
          story_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          story_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          story_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_views_viewer_id_fkey"
            columns: ["viewer_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      support_ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_internal: boolean
          message: string
          responder_id: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          responder_id?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          responder_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          email: string
          id: string
          message: string
          name: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_followers: {
        Row: {
          created_at: string
          id: string
          notifications_muted: boolean
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notifications_muted?: boolean
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notifications_muted?: boolean
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_followers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_followers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_page_views: {
        Row: {
          created_at: string
          id: string
          team_id: string
          viewer_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          team_id: string
          viewer_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          team_id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_page_views_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_page_views_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      team_post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_hidden: boolean
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "team_post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_post_media_reviews: {
        Row: {
          created_at: string
          id: string
          kind: string
          media_index: number
          notes: string | null
          post_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          media_index: number
          notes?: string | null
          post_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          media_index?: number
          notes?: string | null
          post_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_post_media_reviews_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["team_report_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["team_report_status"]
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["team_report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "team_post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "team_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_posts: {
        Row: {
          author_id: string
          comments_count: number
          content: string | null
          created_at: string
          cross_posted_feed_id: string | null
          id: string
          is_hidden: boolean
          likes_count: number
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          media: Json
          pinned: boolean
          pinned_order: number
          post_type: Database["public"]["Enums"]["team_post_type"]
          report_count: number
          surface: Database["public"]["Enums"]["team_post_surface"]
          team_id: string
          updated_at: string
          visibility: Database["public"]["Enums"]["team_post_visibility"]
        }
        Insert: {
          author_id: string
          comments_count?: number
          content?: string | null
          created_at?: string
          cross_posted_feed_id?: string | null
          id?: string
          is_hidden?: boolean
          likes_count?: number
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          media?: Json
          pinned?: boolean
          pinned_order?: number
          post_type?: Database["public"]["Enums"]["team_post_type"]
          report_count?: number
          surface: Database["public"]["Enums"]["team_post_surface"]
          team_id: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["team_post_visibility"]
        }
        Update: {
          author_id?: string
          comments_count?: number
          content?: string | null
          created_at?: string
          cross_posted_feed_id?: string | null
          id?: string
          is_hidden?: boolean
          likes_count?: number
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          media?: Json
          pinned?: boolean
          pinned_order?: number
          post_type?: Database["public"]["Enums"]["team_post_type"]
          report_count?: number
          surface?: Database["public"]["Enums"]["team_post_surface"]
          team_id?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["team_post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "team_posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_posts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      tournament_matchups: {
        Row: {
          created_at: string
          id: string
          matchup_number: number
          next_matchup_id: string | null
          player1_catch_id: string | null
          player1_id: string | null
          player1_score: number | null
          player2_catch_id: string | null
          player2_id: string | null
          player2_score: number | null
          round_id: string
          status: string
          team1_id: string | null
          team1_score: number
          team2_id: string | null
          team2_score: number
          tournament_id: string
          updated_at: string
          winner_id: string | null
          winner_team_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          matchup_number: number
          next_matchup_id?: string | null
          player1_catch_id?: string | null
          player1_id?: string | null
          player1_score?: number | null
          player2_catch_id?: string | null
          player2_id?: string | null
          player2_score?: number | null
          round_id: string
          status?: string
          team1_id?: string | null
          team1_score?: number
          team2_id?: string | null
          team2_score?: number
          tournament_id: string
          updated_at?: string
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          matchup_number?: number
          next_matchup_id?: string | null
          player1_catch_id?: string | null
          player1_id?: string | null
          player1_score?: number | null
          player2_catch_id?: string | null
          player2_id?: string | null
          player2_score?: number | null
          round_id?: string
          status?: string
          team1_id?: string | null
          team1_score?: number
          team2_id?: string | null
          team2_score?: number
          tournament_id?: string
          updated_at?: string
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matchups_next_matchup_id_fkey"
            columns: ["next_matchup_id"]
            isOneToOne: false
            referencedRelation: "tournament_matchup_mvps"
            referencedColumns: ["matchup_id"]
          },
          {
            foreignKeyName: "tournament_matchups_next_matchup_id_fkey"
            columns: ["next_matchup_id"]
            isOneToOne: false
            referencedRelation: "tournament_matchups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_next_matchup_id_fkey"
            columns: ["next_matchup_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["matchup_id"]
          },
          {
            foreignKeyName: "tournament_matchups_player1_catch_id_fkey"
            columns: ["player1_catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_player2_catch_id_fkey"
            columns: ["player2_catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "tournament_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_team1_id_fkey"
            columns: ["team1_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournament_matchups_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_team2_id_fkey"
            columns: ["team2_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournament_matchups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      tournament_participants: {
        Row: {
          eliminated: boolean
          eliminated_in_round: number | null
          final_placement: number | null
          has_paid: boolean
          id: string
          joined_at: string
          seed_number: number | null
          team_id: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          eliminated?: boolean
          eliminated_in_round?: number | null
          final_placement?: number | null
          has_paid?: boolean
          id?: string
          joined_at?: string
          seed_number?: number | null
          team_id?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          eliminated?: boolean
          eliminated_in_round?: number | null
          final_placement?: number | null
          has_paid?: boolean
          id?: string
          joined_at?: string
          seed_number?: number | null
          team_id?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_participants_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_rounds: {
        Row: {
          bracket_type: string
          created_at: string
          end_date: string | null
          id: string
          round_name: string
          round_number: number
          start_date: string | null
          status: string
          tournament_id: string
        }
        Insert: {
          bracket_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          round_name: string
          round_number: number
          start_date?: string | null
          status?: string
          tournament_id: string
        }
        Update: {
          bracket_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          round_name?: string
          round_number?: number
          start_date?: string | null
          status?: string
          tournament_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_rounds_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string
          creator_team_id: string | null
          current_round: number
          description: string | null
          end_date: string | null
          entry_fee: number
          entry_fee_enabled: boolean
          format: Database["public"]["Enums"]["tournament_format"]
          gift_card_code: string | null
          id: string
          is_admin_funded: boolean
          max_participants: number
          prize_description: string | null
          prize_type: string
          registration_end: string
          registration_start: string
          scoring_method: Database["public"]["Enums"]["tournament_scoring"]
          seeding_method: Database["public"]["Enums"]["tournament_seeding"]
          start_date: string
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          total_rounds: number
          updated_at: string
          winner_id: string | null
          winner_team_id: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by: string
          creator_team_id?: string | null
          current_round?: number
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          entry_fee_enabled?: boolean
          format?: Database["public"]["Enums"]["tournament_format"]
          gift_card_code?: string | null
          id?: string
          is_admin_funded?: boolean
          max_participants?: number
          prize_description?: string | null
          prize_type?: string
          registration_end: string
          registration_start?: string
          scoring_method?: Database["public"]["Enums"]["tournament_scoring"]
          seeding_method?: Database["public"]["Enums"]["tournament_seeding"]
          start_date: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          total_rounds?: number
          updated_at?: string
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string
          creator_team_id?: string | null
          current_round?: number
          description?: string | null
          end_date?: string | null
          entry_fee?: number
          entry_fee_enabled?: boolean
          format?: Database["public"]["Enums"]["tournament_format"]
          gift_card_code?: string | null
          id?: string
          is_admin_funded?: boolean
          max_participants?: number
          prize_description?: string | null
          prize_type?: string
          registration_end?: string
          registration_start?: string
          scoring_method?: Database["public"]["Enums"]["tournament_scoring"]
          seeding_method?: Database["public"]["Enums"]["tournament_seeding"]
          start_date?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          total_rounds?: number
          updated_at?: string
          winner_id?: string | null
          winner_team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournaments_creator_team_id_fkey"
            columns: ["creator_team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_creator_team_id_fkey"
            columns: ["creator_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "tournaments_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournaments_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      trip_participants: {
        Row: {
          created_at: string
          id: string
          seen_at: string | null
          status: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          seen_at?: string | null
          status?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          seen_at?: string | null
          status?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_participants_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "fishing_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_saved_spots: {
        Row: {
          created_at: string
          id: string
          spot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          spot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          spot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_spots_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "fishing_spots"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_requests: {
        Row: {
          created_at: string | null
          id: string
          id_document_type: string | null
          id_document_url: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          submitted_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          submitted_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_safe"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      photo_challenges_public: {
        Row: {
          banner_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          entry_fee: number | null
          id: string | null
          prize_description: string | null
          prize_type: string | null
          start_date: string | null
          status: string | null
          title: string | null
          voting_end_date: string | null
          winner_id: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          entry_fee?: number | null
          id?: string | null
          prize_description?: string | null
          prize_type?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          voting_end_date?: string | null
          winner_id?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          entry_fee?: number | null
          id?: string | null
          prize_description?: string | null
          prize_type?: string | null
          start_date?: string | null
          status?: string | null
          title?: string | null
          voting_end_date?: string | null
          winner_id?: string | null
        }
        Relationships: []
      }
      profiles_safe: {
        Row: {
          account_mode: Database["public"]["Enums"]["account_mode"] | null
          age: number | null
          bio: string | null
          city: string | null
          cover_photo: string | null
          created_at: string | null
          display_name: string | null
          drinking: Database["public"]["Enums"]["drinking_habit"] | null
          education: string | null
          fishing_experience:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear: string[] | null
          fishing_styles: string[] | null
          followers_count: number | null
          following_count: number | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string | null
          id_verified: boolean | null
          interested_in: Database["public"]["Enums"]["gender_type"][] | null
          interests: string[] | null
          is_active: boolean | null
          is_banned: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          live_verified: boolean | null
          location_name: string | null
          looking_for: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference: number | null
          max_distance_miles: number | null
          min_age_preference: number | null
          occupation: string | null
          onboarding_completed: boolean | null
          personality_type:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos: string[] | null
          preferred_species: string[] | null
          prompt_responses: Json | null
          smoking: Database["public"]["Enums"]["smoking_habit"] | null
          state: string | null
          total_likes_received: number | null
          updated_at: string | null
          zodiac_sign: string | null
        }
        Insert: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          age?: never
          bio?: string | null
          city?: string | null
          cover_photo?: string | null
          created_at?: string | null
          display_name?: string | null
          drinking?: Database["public"]["Enums"]["drinking_habit"] | null
          education?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          fishing_styles?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string | null
          id_verified?: boolean | null
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          live_verified?: boolean | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_miles?: number | null
          min_age_preference?: number | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos?: string[] | null
          preferred_species?: string[] | null
          prompt_responses?: Json | null
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          total_likes_received?: number | null
          updated_at?: string | null
          zodiac_sign?: string | null
        }
        Update: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          age?: never
          bio?: string | null
          city?: string | null
          cover_photo?: string | null
          created_at?: string | null
          display_name?: string | null
          drinking?: Database["public"]["Enums"]["drinking_habit"] | null
          education?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          fishing_styles?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string | null
          id_verified?: boolean | null
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          live_verified?: boolean | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_miles?: number | null
          min_age_preference?: number | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos?: string[] | null
          preferred_species?: string[] | null
          prompt_responses?: Json | null
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          total_likes_received?: number | null
          updated_at?: string | null
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          account_mode: Database["public"]["Enums"]["account_mode"] | null
          age: number | null
          bio: string | null
          city: string | null
          cover_photo: string | null
          created_at: string | null
          display_name: string | null
          drinking: Database["public"]["Enums"]["drinking_habit"] | null
          education: string | null
          fishing_experience:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear: string[] | null
          fishing_styles: string[] | null
          followers_count: number | null
          following_count: number | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string | null
          id_verified: boolean | null
          interested_in: Database["public"]["Enums"]["gender_type"][] | null
          interests: string[] | null
          is_active: boolean | null
          is_banned: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          live_verified: boolean | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          looking_for: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference: number | null
          max_distance_miles: number | null
          min_age_preference: number | null
          occupation: string | null
          onboarding_completed: boolean | null
          personality_type:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos: string[] | null
          preferred_species: string[] | null
          prompt_responses: Json | null
          smoking: Database["public"]["Enums"]["smoking_habit"] | null
          state: string | null
          total_likes_received: number | null
          zodiac_sign: string | null
        }
        Insert: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          age?: never
          bio?: string | null
          city?: string | null
          cover_photo?: string | null
          created_at?: string | null
          display_name?: string | null
          drinking?: Database["public"]["Enums"]["drinking_habit"] | null
          education?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          fishing_styles?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string | null
          id_verified?: boolean | null
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          live_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_miles?: number | null
          min_age_preference?: number | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos?: string[] | null
          preferred_species?: string[] | null
          prompt_responses?: Json | null
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          total_likes_received?: number | null
          zodiac_sign?: string | null
        }
        Update: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          age?: never
          bio?: string | null
          city?: string | null
          cover_photo?: string | null
          created_at?: string | null
          display_name?: string | null
          drinking?: Database["public"]["Enums"]["drinking_habit"] | null
          education?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          fishing_styles?: string[] | null
          followers_count?: number | null
          following_count?: number | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string | null
          id_verified?: boolean | null
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          interests?: string[] | null
          is_active?: boolean | null
          is_banned?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          live_verified?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_miles?: number | null
          min_age_preference?: number | null
          occupation?: string | null
          onboarding_completed?: boolean | null
          personality_type?:
            | Database["public"]["Enums"]["personality_type"]
            | null
          photos?: string[] | null
          preferred_species?: string[] | null
          prompt_responses?: Json | null
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          total_likes_received?: number | null
          zodiac_sign?: string | null
        }
        Relationships: []
      }
      tournament_matchup_mvps: {
        Row: {
          biggest_catch: number | null
          catches_count: number | null
          display_name: string | null
          matchup_id: string | null
          matchup_number: number | null
          photos: string[] | null
          round_id: string | null
          round_name: string | null
          round_number: number | null
          score: number | null
          team_logo: string | null
          team_name: string | null
          total_weight: number | null
          tournament_id: string | null
          user_id: string | null
          winner_team_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matchups_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "tournament_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "fishing_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_winner_team_id_fkey"
            columns: ["winner_team_id"]
            isOneToOne: false
            referencedRelation: "tournament_team_round_scores"
            referencedColumns: ["team_id"]
          },
        ]
      }
      tournament_member_contributions: {
        Row: {
          biggest_catch: number | null
          catches: number | null
          display_name: string | null
          photos: string[] | null
          score_contribution: number | null
          team_id: string | null
          total_weight: number | null
          tournament_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      tournament_mvp_leaderboard: {
        Row: {
          biggest_catch: number | null
          catches: number | null
          display_name: string | null
          photos: string[] | null
          team_id: string | null
          team_logo: string | null
          team_name: string | null
          total_score: number | null
          total_weight: number | null
          tournament_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      tournament_team_leaderboard: {
        Row: {
          biggest_catch: number | null
          captain_id: string | null
          catches_count: number | null
          eliminated: boolean | null
          logo_url: string | null
          rounds_won: number | null
          team_id: string | null
          team_name: string | null
          total_score: number | null
          total_weight: number | null
          tournament_id: string | null
        }
        Relationships: []
      }
      tournament_team_roster: {
        Row: {
          team_id: string | null
          tournament_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      tournament_team_round_scores: {
        Row: {
          bracket_type: string | null
          matchup_id: string | null
          matchup_number: number | null
          matchup_status: string | null
          opponent_team_id: string | null
          result: string | null
          round_id: string | null
          round_name: string | null
          round_number: number | null
          score: number | null
          team_id: string | null
          tournament_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_matchups_round_id_fkey"
            columns: ["round_id"]
            isOneToOne: false
            referencedRelation: "tournament_rounds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_matchups_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_search_spots: {
        Args: { p_limit?: number; p_offset?: number; p_search?: string }
        Returns: {
          area_type: string
          created_at: string
          created_by: string
          creator: Json
          description: string
          id: string
          is_public: boolean
          is_verified: boolean
          location_lat: number
          location_lng: number
          location_name: string
          name: string
          photos: string[]
          rating_avg: number
          rating_count: number
          species_available: string[]
          total_count: number
        }[]
      }
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          p_key: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: boolean
      }
      create_audit_log: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id?: string
          p_entity_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      fanout_challenge_new: {
        Args: { _body: string; _data: Json; _title: string }
        Returns: undefined
      }
      get_birthday_buddies: {
        Args: { p_user_id: string }
        Returns: {
          display_name: string
          id: string
          photos: string[]
        }[]
      }
      get_buddy_conversations: {
        Args: { p_user_id: string }
        Returns: {
          buddy_id: string
          buddy_user_id: string
          display_name: string
          last_message: string
          last_message_sender_id: string
          last_message_time: string
          photo: string
          unread_count: number
        }[]
      }
      get_buddy_page_data: { Args: { p_user_id: string }; Returns: Json }
      get_chat_data: {
        Args: { p_match_id: string; p_user_id: string }
        Returns: {
          bio: string
          display_name: string
          id_verified: boolean
          live_verified: boolean
          location_name: string
          match_id: string
          messages: Json
          other_user_id: string
          photos: string[]
          preferred_species: string[]
        }[]
      }
      get_dating_conversations: {
        Args: { p_user_id: string }
        Returns: {
          display_name: string
          last_message: string
          last_message_time: string
          last_sender_id: string
          match_id: string
          matched_at: string
          matched_user_id: string
          photo: string
          unread_count: number
        }[]
      }
      get_photo_challenges_safe: {
        Args: never
        Returns: {
          banner_url: string
          created_at: string
          created_by: string
          description: string
          end_date: string
          entry_fee: number
          id: string
          prize_description: string
          prize_type: string
          start_date: string
          status: string
          title: string
          voting_end_date: string
          winner_id: string
        }[]
      }
      get_species_leaderboard: {
        Args: { p_limit?: number; p_sort_by?: string; p_species_id: string }
        Returns: {
          caught_at: string
          display_name: string
          general_location: string
          largest_catch_id: string
          largest_length_in: number
          largest_weight_lbs: number
          photo: string
          rank: number
          total_caught: number
          total_harvested: number
          total_released: number
          user_id: string
        }[]
      }
      get_team_page_insights: { Args: { p_team_id: string }; Returns: Json }
      get_team_scores:
        | {
            Args: { p_category?: string }
            Returns: {
              captain_id: string
              catch_count: number
              category: string
              logo_url: string
              member_count: number
              skill_level: Database["public"]["Enums"]["fishing_experience"]
              team_id: string
              team_name: string
              total_score: number
            }[]
          }
        | {
            Args: {
              p_skill_level: Database["public"]["Enums"]["fishing_experience"]
            }
            Returns: {
              captain_id: string
              last_7_days_catches: number
              logo_url: string
              member_count: number
              season_points: number
              team_id: string
              team_name: string
            }[]
          }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_challenge_participant: {
        Args: { _challenge: string; _user: string }
        Returns: boolean
      }
      is_team_captain: {
        Args: { _team: string; _user: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team: string; _user: string }
        Returns: boolean
      }
      is_team_poster: {
        Args: { _team: string; _user: string }
        Returns: boolean
      }
      is_tournament_participant: {
        Args: { _tournament: string; _user: string }
        Returns: boolean
      }
      is_trip_owner: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
      is_trip_participant_or_owner: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
      refresh_leaderboard_entries: {
        Args: { p_species_id?: string }
        Returns: undefined
      }
      search_users: {
        Args: { p_limit?: number; p_query: string }
        Returns: {
          display_name: string
          fishing_experience: Database["public"]["Enums"]["fishing_experience"]
          id: string
          id_verified: boolean
          live_verified: boolean
          location_name: string
          photos: string[]
        }[]
      }
      tally_photo_challenge_votes: {
        Args: { p_challenge_id: string }
        Returns: {
          caption: string
          entry_id: string
          photo_url: string
          rank: number
          user_id: string
          vote_count: number
        }[]
      }
    }
    Enums: {
      account_mode: "dating" | "fishing" | "both"
      app_role: "admin" | "moderator" | "user" | "data_entry"
      catch_approval_status: "pending" | "approved" | "rejected"
      catch_photo_type: "cover" | "measurement" | "general"
      challenge_type:
        | "largest_fish"
        | "most_caught"
        | "species_specific"
        | "team"
      drinking_habit: "never" | "socially" | "regularly"
      fishing_experience: "beginner" | "intermediate" | "advanced" | "expert"
      gender_type:
        | "male"
        | "female"
        | "non_binary"
        | "other"
        | "prefer_not_to_say"
      looking_for_type: "relationship" | "casual" | "friends" | "fishing_buddy"
      matching_style: "mutual" | "women_first"
      personality_type: "introvert" | "extrovert" | "ambivert"
      smoking_habit: "never" | "sometimes" | "regularly"
      team_post_surface: "page" | "group"
      team_post_type:
        | "announcement"
        | "matchup"
        | "winning"
        | "teaser"
        | "update"
        | "catch"
        | "general"
      team_post_visibility: "public" | "pending_review" | "hidden"
      team_report_status: "pending" | "reviewed" | "actioned" | "dismissed"
      tournament_format: "single_elimination" | "double_elimination"
      tournament_scoring: "biggest_catch" | "total_weight" | "most_catches"
      tournament_seeding: "random" | "ranked" | "manual"
      tournament_status:
        | "draft"
        | "registration"
        | "seeding"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_mode: ["dating", "fishing", "both"],
      app_role: ["admin", "moderator", "user", "data_entry"],
      catch_approval_status: ["pending", "approved", "rejected"],
      catch_photo_type: ["cover", "measurement", "general"],
      challenge_type: [
        "largest_fish",
        "most_caught",
        "species_specific",
        "team",
      ],
      drinking_habit: ["never", "socially", "regularly"],
      fishing_experience: ["beginner", "intermediate", "advanced", "expert"],
      gender_type: [
        "male",
        "female",
        "non_binary",
        "other",
        "prefer_not_to_say",
      ],
      looking_for_type: ["relationship", "casual", "friends", "fishing_buddy"],
      matching_style: ["mutual", "women_first"],
      personality_type: ["introvert", "extrovert", "ambivert"],
      smoking_habit: ["never", "sometimes", "regularly"],
      team_post_surface: ["page", "group"],
      team_post_type: [
        "announcement",
        "matchup",
        "winning",
        "teaser",
        "update",
        "catch",
        "general",
      ],
      team_post_visibility: ["public", "pending_review", "hidden"],
      team_report_status: ["pending", "reviewed", "actioned", "dismissed"],
      tournament_format: ["single_elimination", "double_elimination"],
      tournament_scoring: ["biggest_catch", "total_weight", "most_catches"],
      tournament_seeding: ["random", "ranked", "manual"],
      tournament_status: [
        "draft",
        "registration",
        "seeding",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
