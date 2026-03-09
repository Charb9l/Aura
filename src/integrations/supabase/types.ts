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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_pictures: {
        Row: {
          club_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          picture_type: string
        }
        Insert: {
          club_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          picture_type?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          picture_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_pictures_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json | null
          title: string
          type: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          title: string
          type: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      availability_periods: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      badge_point_assignments: {
        Row: {
          badge_level: number
          club_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_level: number
          club_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_level?: number
          club_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badge_point_assignments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_audit_log: {
        Row: {
          activity: string
          activity_name: string
          booking_date: string
          booking_id: string
          booking_time: string
          court_type: string | null
          created_at: string
          created_by: string | null
          deleted_at: string
          deleted_by: string
          discount_type: string | null
          email: string
          full_name: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          activity: string
          activity_name: string
          booking_date: string
          booking_id: string
          booking_time: string
          court_type?: string | null
          created_at: string
          created_by?: string | null
          deleted_at?: string
          deleted_by: string
          discount_type?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          activity?: string
          activity_name?: string
          booking_date?: string
          booking_id?: string
          booking_time?: string
          court_type?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string
          deleted_by?: string
          discount_type?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          activity: string
          activity_name: string
          attendance_status: string | null
          booking_date: string
          booking_time: string
          court_type: string | null
          created_at: string
          created_by: string | null
          discount_type: string | null
          email: string
          full_name: string
          id: string
          phone: string
          status: string
          user_id: string
        }
        Insert: {
          activity: string
          activity_name: string
          attendance_status?: string | null
          booking_date: string
          booking_time: string
          court_type?: string | null
          created_at?: string
          created_by?: string | null
          discount_type?: string | null
          email: string
          full_name: string
          id?: string
          phone: string
          status?: string
          user_id: string
        }
        Update: {
          activity?: string
          activity_name?: string
          attendance_status?: string | null
          booking_date?: string
          booking_time?: string
          court_type?: string | null
          created_at?: string
          created_by?: string | null
          discount_type?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      club_activity_prices: {
        Row: {
          activity_slug: string
          club_id: string
          created_at: string
          id: string
          location_id: string | null
          price: number
          price_label: string | null
        }
        Insert: {
          activity_slug: string
          club_id: string
          created_at?: string
          id?: string
          location_id?: string | null
          price?: number
          price_label?: string | null
        }
        Update: {
          activity_slug?: string
          club_id?: string
          created_at?: string
          id?: string
          location_id?: string | null
          price?: number
          price_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "club_activity_prices_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "club_activity_prices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "club_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      club_locations: {
        Row: {
          activity: string | null
          club_id: string
          created_at: string
          id: string
          location: string
          name: string
        }
        Insert: {
          activity?: string | null
          club_id: string
          created_at?: string
          id?: string
          location: string
          name: string
        }
        Update: {
          activity?: string | null
          club_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_locations_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      club_pictures: {
        Row: {
          club_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
        }
        Insert: {
          club_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
        }
        Update: {
          club_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "club_pictures_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          created_at: string
          description: string | null
          has_academy: boolean
          id: string
          logo_url: string | null
          name: string
          offerings: string[]
          published: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_academy?: boolean
          id?: string
          logo_url?: string | null
          name: string
          offerings?: string[]
          published?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          has_academy?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          offerings?: string[]
          published?: boolean
        }
        Relationships: []
      }
      customer_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "customer_notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          image_url: string | null
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          image_url?: string | null
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string
        }
        Relationships: []
      }
      former_users: {
        Row: {
          club_id: string | null
          club_name: string | null
          created_at: string
          email: string
          ended_at: string
          full_name: string | null
          id: string
          phone: string | null
          reason: string | null
          started_at: string | null
          user_id: string
          user_type: string
        }
        Insert: {
          club_id?: string | null
          club_name?: string | null
          created_at?: string
          email: string
          ended_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          reason?: string | null
          started_at?: string | null
          user_id: string
          user_type?: string
        }
        Update: {
          club_id?: string | null
          club_name?: string | null
          created_at?: string
          email?: string
          ended_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          reason?: string | null
          started_at?: string | null
          user_id?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "former_users_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      hero_pictures: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          page_slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          page_slug?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          page_slug?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      loyalty_point_adjustments: {
        Row: {
          adjusted_by: string | null
          club_id: string
          created_at: string
          id: string
          points: number
          reason: string | null
          user_id: string
        }
        Insert: {
          adjusted_by?: string | null
          club_id: string
          created_at?: string
          id?: string
          points?: number
          reason?: string | null
          user_id: string
        }
        Update: {
          adjusted_by?: string | null
          club_id?: string
          created_at?: string
          id?: string
          points?: number
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_point_adjustments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      nudges: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          responded_at: string | null
          sender_id: string
          sport_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          responded_at?: string | null
          sender_id: string
          sport_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          responded_at?: string | null
          sender_id?: string
          sport_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "nudges_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        Row: {
          brand_color: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          slug: string
        }
        Insert: {
          brand_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
        }
        Update: {
          brand_color?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          page_slug: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          page_slug: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          page_slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      player_levels: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
        }
        Relationships: []
      }
      player_selections: {
        Row: {
          availability: Json
          created_at: string
          goals: string[]
          id: string
          level_id: string
          location_ids: string[]
          playstyle: string | null
          rank: number
          sport_id: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: Json
          created_at?: string
          goals?: string[]
          id?: string
          level_id: string
          location_ids?: string[]
          playstyle?: string | null
          rank: number
          sport_id: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: Json
          created_at?: string
          goals?: string[]
          id?: string
          level_id?: string
          location_ids?: string[]
          playstyle?: string | null
          rank?: number
          sport_id?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "player_selections_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "player_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_selections_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
      playstyles: {
        Row: {
          created_at: string
          display_order: number
          id: string
          label: string
          value: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          label: string
          value: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          label?: string
          value?: string
        }
        Relationships: []
      }
      price_rule_clubs: {
        Row: {
          club_id: string
          created_at: string
          id: string
          price_rule_id: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          price_rule_id: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          price_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_rule_clubs_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_rule_clubs_price_rule_id_fkey"
            columns: ["price_rule_id"]
            isOneToOne: false
            referencedRelation: "price_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      price_rules: {
        Row: {
          active: boolean
          created_at: string
          discount_type: string
          discount_value: number
          end_date: string | null
          id: string
          max_total_uses: number | null
          name: string
          start_date: string | null
          uses_per_customer: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount_type: string
          discount_value?: number
          end_date?: string | null
          id?: string
          max_total_uses?: number | null
          name: string
          start_date?: string | null
          uses_per_customer?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          discount_type?: string
          discount_value?: number
          end_date?: string | null
          id?: string
          max_total_uses?: number | null
          name?: string
          start_date?: string | null
          uses_per_customer?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          suspended?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_promotions: {
        Row: {
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          id: string
          price_rule_id: string | null
          remaining_uses: number
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value?: number
          id?: string
          price_rule_id?: string | null
          remaining_uses?: number
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          price_rule_id?: string | null
          remaining_uses?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_promotions_price_rule_id_fkey"
            columns: ["price_rule_id"]
            isOneToOne: false
            referencedRelation: "price_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          club_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          club_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          club_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_buddies: {
        Row: {
          created_at: string
          id: string
          nudge_id: string | null
          sport_id: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          nudge_id?: string | null
          sport_id: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          nudge_id?: string | null
          sport_id?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_buddies_nudge_id_fkey"
            columns: ["nudge_id"]
            isOneToOne: false
            referencedRelation: "nudges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_buddies_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_booked_slots: {
        Args: { _activity: string; _booking_date: string }
        Returns: string[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
