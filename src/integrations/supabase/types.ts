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
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          id: string
          image_url: string | null
          is_read: boolean | null
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
          id?: string
          image_url?: string | null
          is_read?: boolean | null
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
          id?: string
          image_url?: string | null
          is_read?: boolean | null
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
        ]
      }
      catches: {
        Row: {
          bait_used: string | null
          caught_at: string | null
          created_at: string
          fishing_spot_id: string | null
          gear_used: string[] | null
          id: string
          length_in: number | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          photos: string[] | null
          species_id: string | null
          species_name: string | null
          user_id: string
          weight_lbs: number | null
        }
        Insert: {
          bait_used?: string | null
          caught_at?: string | null
          created_at?: string
          fishing_spot_id?: string | null
          gear_used?: string[] | null
          id?: string
          length_in?: number | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photos?: string[] | null
          species_id?: string | null
          species_name?: string | null
          user_id: string
          weight_lbs?: number | null
        }
        Update: {
          bait_used?: string | null
          caught_at?: string | null
          created_at?: string
          fishing_spot_id?: string | null
          gear_used?: string[] | null
          id?: string
          length_in?: number | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photos?: string[] | null
          species_id?: string | null
          species_name?: string | null
          user_id?: string
          weight_lbs?: number | null
        }
        Relationships: [
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
            foreignKeyName: "catches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          scientific_name: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          scientific_name?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          scientific_name?: string | null
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
      fishing_spots: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          location_lat: number
          location_lng: number
          location_name: string | null
          name: string
          photos: string[] | null
          rating_avg: number | null
          rating_count: number | null
          species_available: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          location_lat: number
          location_lng: number
          location_name?: string | null
          name: string
          photos?: string[] | null
          rating_avg?: number | null
          rating_count?: number | null
          species_available?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          location_lat?: number
          location_lng?: number
          location_name?: string | null
          name?: string
          photos?: string[] | null
          rating_avg?: number | null
          rating_count?: number | null
          species_available?: string[] | null
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
        ]
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
            foreignKeyName: "fishing_trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
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
            foreignKeyName: "matches_user2_id_fkey"
            columns: ["user2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string
          created_at: string
          deleted_at: string | null
          deleted_for_everyone: boolean | null
          id: string
          image_url: string | null
          is_read: boolean | null
          match_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          deleted_at?: string | null
          deleted_for_everyone?: boolean | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id?: string
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
        ]
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
          gender: Database["public"]["Enums"]["gender_type"] | null
          height_cm: number | null
          id: string
          id_verified: boolean | null
          id_verified_at: string | null
          id_verified_by: string | null
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
          smoking: Database["public"]["Enums"]["smoking_habit"] | null
          state: string | null
          stripe_customer_id: string | null
          updated_at: string
          verification_notes: string | null
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
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id: string
          id_verified?: boolean | null
          id_verified_at?: string | null
          id_verified_by?: string | null
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
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          verification_notes?: string | null
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
          gender?: Database["public"]["Enums"]["gender_type"] | null
          height_cm?: number | null
          id?: string
          id_verified?: boolean | null
          id_verified_at?: string | null
          id_verified_by?: string | null
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
          smoking?: Database["public"]["Enums"]["smoking_habit"] | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          verification_notes?: string | null
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
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      get_dating_conversations: {
        Args: { p_user_id: string }
        Returns: {
          display_name: string
          last_message: string
          last_message_time: string
          match_id: string
          matched_at: string
          matched_user_id: string
          photo: string
          unread_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
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
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      account_mode: "dating" | "fishing" | "both"
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
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
    },
  },
} as const
