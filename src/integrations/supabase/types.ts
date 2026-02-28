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
      club_locations: {
        Row: {
          club_id: string
          created_at: string
          id: string
          location: string
          name: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          location: string
          name: string
        }
        Update: {
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
        }
        Insert: {
          created_at?: string
          description?: string | null
          has_academy?: boolean
          id?: string
          logo_url?: string | null
          name: string
          offerings?: string[]
        }
        Update: {
          created_at?: string
          description?: string | null
          has_academy?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          offerings?: string[]
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
          created_at: string
          id: string
          level_id: string
          location_id: string | null
          rank: number
          sport_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level_id: string
          location_id?: string | null
          rank: number
          sport_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level_id?: string
          location_id?: string | null
          rank?: number
          sport_id?: string
          user_id?: string
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
            foreignKeyName: "player_selections_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "club_locations"
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
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
