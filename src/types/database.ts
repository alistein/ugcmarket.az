// Hand-written to match supabase/migrations. Replace with generated types:
//   npm run db:types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"] | null;
          locale: string;
          status: Database["public"]["Enums"]["account_status"];
          created_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["user_role"] | null;
          locale?: string;
          status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["user_role"] | null;
          locale?: string;
          status?: Database["public"]["Enums"]["account_status"];
          created_at?: string;
        };
        Relationships: [
        ];
      };
      creators: {
        Row: {
          id: string;
          profile_id: string;
          handle: string;
          display_name: string;
          avatar_url: string | null;
          city: string;
          country: string;
          categories: string[];
          languages: string[];
          bio: string | null;
          barter_open: boolean;
          review_status: Database["public"]["Enums"]["review_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          handle: string;
          display_name: string;
          avatar_url?: string | null;
          city: string;
          country?: string;
          categories?: string[];
          languages?: string[];
          bio?: string | null;
          barter_open?: boolean;
          review_status?: Database["public"]["Enums"]["review_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          handle?: string;
          display_name?: string;
          avatar_url?: string | null;
          city?: string;
          country?: string;
          categories?: string[];
          languages?: string[];
          bio?: string | null;
          barter_open?: boolean;
          review_status?: Database["public"]["Enums"]["review_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "creators_profile_id_fkey"; columns: ["profile_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      creator_contacts: {
        Row: {
          creator_id: string;
          instagram: string | null;
          phone: string | null;
        };
        Insert: {
          creator_id: string;
          instagram?: string | null;
          phone?: string | null;
        };
        Update: {
          creator_id?: string;
          instagram?: string | null;
          phone?: string | null;
        };
        Relationships: [
          { foreignKeyName: "creator_contacts_creator_id_fkey"; columns: ["creator_id"]; isOneToOne: true; referencedRelation: "creators"; referencedColumns: ["id"] },
        ];
      };
      creator_socials: {
        Row: {
          id: string;
          creator_id: string;
          network: Database["public"]["Enums"]["social_network"];
          handle: string;
          followers: number;
          avg_views: number | null;
          verified: boolean;
        };
        Insert: {
          id?: string;
          creator_id: string;
          network: Database["public"]["Enums"]["social_network"];
          handle: string;
          followers?: number;
          avg_views?: number | null;
          verified?: boolean;
        };
        Update: {
          id?: string;
          creator_id?: string;
          network?: Database["public"]["Enums"]["social_network"];
          handle?: string;
          followers?: number;
          avg_views?: number | null;
          verified?: boolean;
        };
        Relationships: [
          { foreignKeyName: "creator_socials_creator_id_fkey"; columns: ["creator_id"]; isOneToOne: false; referencedRelation: "creators"; referencedColumns: ["id"] },
        ];
      };
      creator_prices: {
        Row: {
          id: string;
          creator_id: string;
          format: Database["public"]["Enums"]["post_format"];
          amount: number;
          currency: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          format: Database["public"]["Enums"]["post_format"];
          amount: number;
          currency?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          format?: Database["public"]["Enums"]["post_format"];
          amount?: number;
          currency?: string;
        };
        Relationships: [
          { foreignKeyName: "creator_prices_creator_id_fkey"; columns: ["creator_id"]; isOneToOne: false; referencedRelation: "creators"; referencedColumns: ["id"] },
        ];
      };
      portfolio_items: {
        Row: {
          id: string;
          creator_id: string;
          url: string;
          network: Database["public"]["Enums"]["social_network"];
          title: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          url: string;
          network: Database["public"]["Enums"]["social_network"];
          title?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          url?: string;
          network?: Database["public"]["Enums"]["social_network"];
          title?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "portfolio_items_creator_id_fkey"; columns: ["creator_id"]; isOneToOne: false; referencedRelation: "creators"; referencedColumns: ["id"] },
        ];
      };
      brands: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          logo_url: string | null;
          category: string;
          website: string | null;
          review_status: Database["public"]["Enums"]["review_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          name: string;
          logo_url?: string | null;
          category: string;
          website?: string | null;
          review_status?: Database["public"]["Enums"]["review_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          name?: string;
          logo_url?: string | null;
          category?: string;
          website?: string | null;
          review_status?: Database["public"]["Enums"]["review_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "brands_profile_id_fkey"; columns: ["profile_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      brand_contacts: {
        Row: {
          brand_id: string;
          instagram: string | null;
          phone: string | null;
        };
        Insert: {
          brand_id: string;
          instagram?: string | null;
          phone?: string | null;
        };
        Update: {
          brand_id?: string;
          instagram?: string | null;
          phone?: string | null;
        };
        Relationships: [
          { foreignKeyName: "brand_contacts_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: true; referencedRelation: "brands"; referencedColumns: ["id"] },
        ];
      };
      campaigns: {
        Row: {
          id: string;
          brand_id: string;
          title: string;
          description: string;
          promoted_item: string | null;
          category: string;
          collaboration_model: Database["public"]["Enums"]["collaboration_model"];
          network: Database["public"]["Enums"]["social_network"];
          format: Database["public"]["Enums"]["post_format"];
          posts_count: number;
          compensation_type: Database["public"]["Enums"]["compensation_type"];
          compensation_value: number | null;
          compensation_details: string | null;
          currency: string;
          creators_needed: number;
          min_followers: number;
          city: string | null;
          deadline: string;
          requirements: string | null;
          usage_rights: string | null;
          status: Database["public"]["Enums"]["campaign_status"];
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          title: string;
          description: string;
          promoted_item?: string | null;
          category: string;
          collaboration_model?: Database["public"]["Enums"]["collaboration_model"];
          network: Database["public"]["Enums"]["social_network"];
          format: Database["public"]["Enums"]["post_format"];
          posts_count?: number;
          compensation_type: Database["public"]["Enums"]["compensation_type"];
          compensation_value?: number | null;
          compensation_details?: string | null;
          currency?: string;
          creators_needed?: number;
          min_followers?: number;
          city?: string | null;
          deadline: string;
          requirements?: string | null;
          usage_rights?: string | null;
          status?: Database["public"]["Enums"]["campaign_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          title?: string;
          description?: string;
          promoted_item?: string | null;
          category?: string;
          collaboration_model?: Database["public"]["Enums"]["collaboration_model"];
          network?: Database["public"]["Enums"]["social_network"];
          format?: Database["public"]["Enums"]["post_format"];
          posts_count?: number;
          compensation_type?: Database["public"]["Enums"]["compensation_type"];
          compensation_value?: number | null;
          compensation_details?: string | null;
          currency?: string;
          creators_needed?: number;
          min_followers?: number;
          city?: string | null;
          deadline?: string;
          requirements?: string | null;
          usage_rights?: string | null;
          status?: Database["public"]["Enums"]["campaign_status"];
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "campaigns_brand_id_fkey"; columns: ["brand_id"]; isOneToOne: false; referencedRelation: "brands"; referencedColumns: ["id"] },
        ];
      };
      applications: {
        Row: {
          id: string;
          campaign_id: string;
          creator_id: string;
          message: string | null;
          contact_revealed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          creator_id: string;
          message?: string | null;
          contact_revealed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          campaign_id?: string;
          creator_id?: string;
          message?: string | null;
          contact_revealed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "applications_campaign_id_fkey"; columns: ["campaign_id"]; isOneToOne: false; referencedRelation: "campaigns"; referencedColumns: ["id"] },
          { foreignKeyName: "applications_creator_id_fkey"; columns: ["creator_id"]; isOneToOne: false; referencedRelation: "creators"; referencedColumns: ["id"] },
        ];
      };
      post_submissions: {
        Row: {
          id: string;
          application_id: string;
          url: string;
          posted_at: string | null;
          views: number;
          likes: number | null;
          comments: number | null;
          shares: number | null;
          saves: number | null;
          screenshot_path: string | null;
          self_reported: boolean;
          confirmed_by_brand_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          url: string;
          posted_at?: string | null;
          views: number;
          likes?: number | null;
          comments?: number | null;
          shares?: number | null;
          saves?: number | null;
          screenshot_path?: string | null;
          self_reported?: boolean;
          confirmed_by_brand_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          url?: string;
          posted_at?: string | null;
          views?: number;
          likes?: number | null;
          comments?: number | null;
          shares?: number | null;
          saves?: number | null;
          screenshot_path?: string | null;
          self_reported?: boolean;
          confirmed_by_brand_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "post_submissions_application_id_fkey"; columns: ["application_id"]; isOneToOne: false; referencedRelation: "applications"; referencedColumns: ["id"] },
        ];
      };
      admin_actions: {
        Row: {
          id: string;
          admin_id: string;
          target_type: string;
          target_id: string;
          action: string;
          reason: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          target_type: string;
          target_id: string;
          action: string;
          reason?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          target_type?: string;
          target_id?: string;
          action?: string;
          reason?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "admin_actions_admin_id_fkey"; columns: ["admin_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      my_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["user_role"] };
    };
    Enums: {
      user_role: "brand" | "creator" | "admin";
      account_status: "active" | "blocked";
      review_status: "pending" | "approved" | "rejected";
      social_network: "instagram" | "tiktok" | "youtube";
      collaboration_model: "post" | "ugc";
      compensation_type: "money" | "product" | "service" | "barter" | "unpaid";
      post_format: "reels" | "stories" | "post" | "tiktok_video" | "youtube_short" | "ugc_video" | "other";
      campaign_status: "draft" | "pending_review" | "published" | "paused" | "closed" | "rejected";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
