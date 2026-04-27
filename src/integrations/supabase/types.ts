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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      emissions: {
        Row: {
          confidence_score: number | null
          grid_id: string
          id: string
          industry_name: string | null
          pollutant: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at: string
          value_kg_per_day: number
        }
        Insert: {
          confidence_score?: number | null
          grid_id: string
          id?: string
          industry_name?: string | null
          pollutant?: string
          source_type: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          value_kg_per_day?: number
        }
        Update: {
          confidence_score?: number | null
          grid_id?: string
          id?: string
          industry_name?: string | null
          pollutant?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          updated_at?: string
          value_kg_per_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "emissions_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "grids"
            referencedColumns: ["id"]
          },
        ]
      }
      grids: {
        Row: {
          area_name: string | null
          created_at: string
          grid_code: string
          id: string
          lat: number
          lng: number
        }
        Insert: {
          area_name?: string | null
          created_at?: string
          grid_code: string
          id?: string
          lat: number
          lng: number
        }
        Update: {
          area_name?: string | null
          created_at?: string
          grid_code?: string
          id?: string
          lat?: number
          lng?: number
        }
        Relationships: []
      }
      industries: {
        Row: {
          category: string
          created_at: string
          grid_id: string | null
          id: string
          lat: number
          lng: number
          name: string
        }
        Insert: {
          category?: string
          created_at?: string
          grid_id?: string | null
          id?: string
          lat: number
          lng: number
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          grid_id?: string | null
          id?: string
          lat?: number
          lng?: number
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "industries_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "grids"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          organization: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          organization?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization?: string | null
        }
        Relationships: []
      }
      submissions: {
        Row: {
          confidence_score: number | null
          contributor_id: string
          created_at: string
          grid_id: string
          id: string
          industry_name: string | null
          notes: string | null
          parameters: Json | null
          pollutant: string
          review_comment: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          status: Database["public"]["Enums"]["submission_status"]
          value_kg_per_day: number
        }
        Insert: {
          confidence_score?: number | null
          contributor_id: string
          created_at?: string
          grid_id: string
          id?: string
          industry_name?: string | null
          notes?: string | null
          parameters?: Json | null
          pollutant?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_type: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["submission_status"]
          value_kg_per_day: number
        }
        Update: {
          confidence_score?: number | null
          contributor_id?: string
          created_at?: string
          grid_id?: string
          id?: string
          industry_name?: string | null
          notes?: string | null
          parameters?: Json | null
          pollutant?: string
          review_comment?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          source_type?: Database["public"]["Enums"]["source_type"]
          status?: Database["public"]["Enums"]["submission_status"]
          value_kg_per_day?: number
        }
        Relationships: [
          {
            foreignKeyName: "submissions_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "grids"
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
          role: Database["public"]["Enums"]["app_role"]
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
      verification_logs: {
        Row: {
          action: Database["public"]["Enums"]["submission_status"]
          comment: string | null
          confidence_score: number | null
          created_at: string
          id: string
          reviewer_id: string
          submission_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["submission_status"]
          comment?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          reviewer_id: string
          submission_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["submission_status"]
          comment?: string | null
          confidence_score?: number | null
          created_at?: string
          id?: string
          reviewer_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_logs_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      industries_public: {
        Row: {
          category: string | null
          grid_id: string | null
          id: string | null
          lat: number | null
          lng: number | null
        }
        Insert: {
          category?: string | null
          grid_id?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
        }
        Update: {
          category?: string | null
          grid_id?: string | null
          id?: string | null
          lat?: number | null
          lng?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "industries_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "grids"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "public_user" | "contributor" | "verifier"
      source_type: "industry" | "transport" | "domestic" | "road_dust" | "other"
      submission_status: "pending" | "approved" | "rejected"
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
      app_role: ["public_user", "contributor", "verifier"],
      source_type: ["industry", "transport", "domestic", "road_dust", "other"],
      submission_status: ["pending", "approved", "rejected"],
    },
  },
} as const
