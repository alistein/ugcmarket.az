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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          id: string
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          id?: string
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          campaign_id: string
          contact_revealed_at: string | null
          created_at: string
          creator_id: string
          id: string
          message: string | null
        }
        Insert: {
          campaign_id: string
          contact_revealed_at?: string | null
          created_at?: string
          creator_id: string
          id?: string
          message?: string | null
        }
        Update: {
          campaign_id?: string
          contact_revealed_at?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_contacts: {
        Row: {
          brand_id: string
          instagram: string | null
          phone: string | null
        }
        Insert: {
          brand_id: string
          instagram?: string | null
          phone?: string | null
        }
        Update: {
          brand_id?: string
          instagram?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_contacts_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          category: string
          created_at: string
          id: string
          logo_url: string | null
          name: string
          profile_id: string
          review_status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          profile_id: string
          review_status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          profile_id?: string
          review_status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brands_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand_id: string
          category: string
          city: string | null
          collaboration_model: Database["public"]["Enums"]["collaboration_model"]
          compensation_details: string | null
          compensation_type: Database["public"]["Enums"]["compensation_type"]
          compensation_value: number | null
          created_at: string
          creators_needed: number
          currency: string
          deadline: string
          description: string
          format: Database["public"]["Enums"]["post_format"]
          id: string
          min_followers: number
          network: Database["public"]["Enums"]["social_network"]
          posts_count: number
          promoted_item: string | null
          published_at: string | null
          requirements: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at: string
          usage_rights: string | null
        }
        Insert: {
          brand_id: string
          category: string
          city?: string | null
          collaboration_model?: Database["public"]["Enums"]["collaboration_model"]
          compensation_details?: string | null
          compensation_type: Database["public"]["Enums"]["compensation_type"]
          compensation_value?: number | null
          created_at?: string
          creators_needed?: number
          currency?: string
          deadline: string
          description: string
          format: Database["public"]["Enums"]["post_format"]
          id?: string
          min_followers?: number
          network: Database["public"]["Enums"]["social_network"]
          posts_count?: number
          promoted_item?: string | null
          published_at?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at?: string
          usage_rights?: string | null
        }
        Update: {
          brand_id?: string
          category?: string
          city?: string | null
          collaboration_model?: Database["public"]["Enums"]["collaboration_model"]
          compensation_details?: string | null
          compensation_type?: Database["public"]["Enums"]["compensation_type"]
          compensation_value?: number | null
          created_at?: string
          creators_needed?: number
          currency?: string
          deadline?: string
          description?: string
          format?: Database["public"]["Enums"]["post_format"]
          id?: string
          min_followers?: number
          network?: Database["public"]["Enums"]["social_network"]
          posts_count?: number
          promoted_item?: string | null
          published_at?: string | null
          requirements?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          updated_at?: string
          usage_rights?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_contacts: {
        Row: {
          creator_id: string
          instagram: string | null
          phone: string | null
        }
        Insert: {
          creator_id: string
          instagram?: string | null
          phone?: string | null
        }
        Update: {
          creator_id?: string
          instagram?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_contacts_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: true
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_prices: {
        Row: {
          amount: number
          creator_id: string
          currency: string
          format: Database["public"]["Enums"]["post_format"]
          id: string
        }
        Insert: {
          amount: number
          creator_id: string
          currency?: string
          format: Database["public"]["Enums"]["post_format"]
          id?: string
        }
        Update: {
          amount?: number
          creator_id?: string
          currency?: string
          format?: Database["public"]["Enums"]["post_format"]
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_prices_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_socials: {
        Row: {
          avg_views: number | null
          creator_id: string
          followers: number
          handle: string
          id: string
          network: Database["public"]["Enums"]["social_network"]
          verified: boolean
        }
        Insert: {
          avg_views?: number | null
          creator_id: string
          followers?: number
          handle: string
          id?: string
          network: Database["public"]["Enums"]["social_network"]
          verified?: boolean
        }
        Update: {
          avg_views?: number | null
          creator_id?: string
          followers?: number
          handle?: string
          id?: string
          network?: Database["public"]["Enums"]["social_network"]
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "creator_socials_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          avatar_url: string | null
          barter_open: boolean
          bio: string | null
          categories: string[]
          city: string
          country: string
          created_at: string
          display_name: string
          handle: string
          id: string
          languages: string[]
          profile_id: string
          review_status: Database["public"]["Enums"]["review_status"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          barter_open?: boolean
          bio?: string | null
          categories?: string[]
          city: string
          country?: string
          created_at?: string
          display_name: string
          handle: string
          id?: string
          languages?: string[]
          profile_id: string
          review_status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          barter_open?: boolean
          bio?: string | null
          categories?: string[]
          city?: string
          country?: string
          created_at?: string
          display_name?: string
          handle?: string
          id?: string
          languages?: string[]
          profile_id?: string
          review_status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "creators_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string
          creator_id: string
          id: string
          network: Database["public"]["Enums"]["social_network"]
          position: number
          title: string | null
          url: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          id?: string
          network: Database["public"]["Enums"]["social_network"]
          position?: number
          title?: string | null
          url: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          id?: string
          network?: Database["public"]["Enums"]["social_network"]
          position?: number
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      post_submissions: {
        Row: {
          application_id: string
          comments: number | null
          confirmed_by_brand_at: string | null
          created_at: string
          id: string
          likes: number | null
          posted_at: string | null
          saves: number | null
          screenshot_path: string | null
          self_reported: boolean
          shares: number | null
          url: string
          views: number
        }
        Insert: {
          application_id: string
          comments?: number | null
          confirmed_by_brand_at?: string | null
          created_at?: string
          id?: string
          likes?: number | null
          posted_at?: string | null
          saves?: number | null
          screenshot_path?: string | null
          self_reported?: boolean
          shares?: number | null
          url: string
          views: number
        }
        Update: {
          application_id?: string
          comments?: number | null
          confirmed_by_brand_at?: string | null
          created_at?: string
          id?: string
          likes?: number | null
          posted_at?: string | null
          saves?: number | null
          screenshot_path?: string | null
          self_reported?: boolean
          shares?: number | null
          url?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "post_submissions_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          locale: string
          role: Database["public"]["Enums"]["user_role"] | null
          status: Database["public"]["Enums"]["account_status"]
        }
        Insert: {
          created_at?: string
          id: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["account_status"]
        }
        Update: {
          created_at?: string
          id?: string
          locale?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          status?: Database["public"]["Enums"]["account_status"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      set_my_role: {
        Args: { new_role: Database["public"]["Enums"]["user_role"] }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "blocked"
      campaign_status:
        | "draft"
        | "pending_review"
        | "published"
        | "paused"
        | "closed"
        | "rejected"
      collaboration_model: "post" | "ugc"
      compensation_type: "money" | "product" | "service" | "barter" | "unpaid"
      post_format:
        | "reels"
        | "stories"
        | "post"
        | "tiktok_video"
        | "youtube_short"
        | "ugc_video"
        | "other"
      review_status: "pending" | "approved" | "rejected"
      social_network: "instagram" | "tiktok" | "youtube"
      user_role: "brand" | "creator" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_status: ["active", "blocked"],
      campaign_status: [
        "draft",
        "pending_review",
        "published",
        "paused",
        "closed",
        "rejected",
      ],
      collaboration_model: ["post", "ugc"],
      compensation_type: ["money", "product", "service", "barter", "unpaid"],
      post_format: [
        "reels",
        "stories",
        "post",
        "tiktok_video",
        "youtube_short",
        "ugc_video",
        "other",
      ],
      review_status: ["pending", "approved", "rejected"],
      social_network: ["instagram", "tiktok", "youtube"],
      user_role: ["brand", "creator", "admin"],
    },
  },
} as const
