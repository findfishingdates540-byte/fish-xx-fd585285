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
      buddy_messages: {
        Row: {
          audio_url: string | null
          buddy_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_read: boolean | null
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          buddy_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          buddy_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
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
          length_cm: number | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          photos: string[] | null
          species_id: string | null
          species_name: string | null
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          bait_used?: string | null
          caught_at?: string | null
          created_at?: string
          fishing_spot_id?: string | null
          gear_used?: string[] | null
          id?: string
          length_cm?: number | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photos?: string[] | null
          species_id?: string | null
          species_name?: string | null
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          bait_used?: string | null
          caught_at?: string | null
          created_at?: string
          fishing_spot_id?: string | null
          gear_used?: string[] | null
          id?: string
          length_cm?: number | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          photos?: string[] | null
          species_id?: string | null
          species_name?: string | null
          user_id?: string
          weight_kg?: number | null
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
          user2_id: string
          user2_liked: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_match?: boolean | null
          matched_at?: string | null
          user1_id: string
          user1_liked?: boolean | null
          user2_id: string
          user2_liked?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_match?: boolean | null
          matched_at?: string | null
          user1_id?: string
          user1_liked?: boolean | null
          user2_id?: string
          user2_liked?: boolean | null
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
          id: string
          image_url: string | null
          is_read: boolean | null
          match_id: string
          sender_id: string
        }
        Insert: {
          audio_url?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id: string
          sender_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          match_id?: string
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
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_mode: Database["public"]["Enums"]["account_mode"] | null
          bio: string | null
          cover_photo: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          email: string | null
          fishing_experience:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear: string[] | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          interested_in: Database["public"]["Enums"]["gender_type"][] | null
          is_active: boolean | null
          is_premium: boolean | null
          is_verified: boolean | null
          last_active_at: string | null
          location_lat: number | null
          location_lng: number | null
          location_name: string | null
          looking_for: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference: number | null
          max_distance_km: number | null
          min_age_preference: number | null
          onboarding_completed: boolean | null
          photos: string[] | null
          preferred_species: string[] | null
          premium_expires_at: string | null
          updated_at: string
        }
        Insert: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          bio?: string | null
          cover_photo?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_km?: number | null
          min_age_preference?: number | null
          onboarding_completed?: boolean | null
          photos?: string[] | null
          preferred_species?: string[] | null
          premium_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          account_mode?: Database["public"]["Enums"]["account_mode"] | null
          bio?: string | null
          cover_photo?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          email?: string | null
          fishing_experience?:
            | Database["public"]["Enums"]["fishing_experience"]
            | null
          fishing_gear?: string[] | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          interested_in?: Database["public"]["Enums"]["gender_type"][] | null
          is_active?: boolean | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          last_active_at?: string | null
          location_lat?: number | null
          location_lng?: number | null
          location_name?: string | null
          looking_for?: Database["public"]["Enums"]["looking_for_type"][] | null
          matching_style?: Database["public"]["Enums"]["matching_style"] | null
          max_age_preference?: number | null
          max_distance_km?: number | null
          min_age_preference?: number | null
          onboarding_completed?: boolean | null
          photos?: string[] | null
          preferred_species?: string[] | null
          premium_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
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
          rating: number
          review: string | null
          spot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          spot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
          status: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      account_mode: "dating" | "fishing" | "both"
      app_role: "admin" | "moderator" | "user"
      fishing_experience: "beginner" | "intermediate" | "advanced" | "expert"
      gender_type:
        | "male"
        | "female"
        | "non_binary"
        | "other"
        | "prefer_not_to_say"
      looking_for_type: "relationship" | "casual" | "friends" | "fishing_buddy"
      matching_style: "mutual" | "women_first"
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
    },
  },
} as const
