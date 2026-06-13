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
      admin_invite_codes: {
        Row: {
          code: string
          created_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      chats: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          seller_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          seller_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          brand: string | null
          category: string
          condition: Database["public"]["Enums"]["item_condition"] | null
          created_at: string
          description: string
          id: string
          images: string[]
          is_promoted: boolean
          location: string
          phone: string | null
          price: number | null
          rejection_reason: string | null
          service_mode: Database["public"]["Enums"]["service_mode"] | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          brand?: string | null
          category: string
          condition?: Database["public"]["Enums"]["item_condition"] | null
          created_at?: string
          description: string
          id?: string
          images?: string[]
          is_promoted?: boolean
          location: string
          phone?: string | null
          price?: number | null
          rejection_reason?: string | null
          service_mode?: Database["public"]["Enums"]["service_mode"] | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          condition?: Database["public"]["Enums"]["item_condition"] | null
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_promoted?: boolean
          location?: string
          phone?: string | null
          price?: number | null
          rejection_reason?: string | null
          service_mode?: Database["public"]["Enums"]["service_mode"] | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          avg_rating: number
          bank_account: string | null
          bank_account_name: string | null
          bank_name: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          response_minutes: number
          shop_slug: string | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: number
          bank_account?: string | null
          bank_account_name?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_merchant?: boolean
          is_verified?: boolean
          kyc_doc_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          lga?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          response_minutes?: number
          shop_slug?: string | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"]
          subscription_until?: string | null
          total_sales?: number
          updated_at?: string
          wallet_balance?: number
          whatsapp?: string | null
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: number
          bank_account?: string | null
          bank_account_name?: string | null
          bank_name?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_merchant?: boolean
          is_verified?: boolean
          kyc_doc_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          lga?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          response_minutes?: number
          shop_slug?: string | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"]
          subscription_until?: string | null
          total_sales?: number
          updated_at?: string
          wallet_balance?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          communication: number
          created_at: string
          id: string
          listing_id: string
          reviewer_id: string
          timeliness: number
          work_quality: number
        }
        Insert: {
          comment?: string | null
          communication: number
          created_at?: string
          id?: string
          listing_id: string
          reviewer_id: string
          timeliness: number
          work_quality: number
        }
        Update: {
          comment?: string | null
          communication?: number
          created_at?: string
          id?: string
          listing_id?: string
          reviewer_id?: string
          timeliness?: number
          work_quality?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          reference: string | null
          status: string
          tx_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          tx_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reference?: string | null
          status?: string
          tx_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          location: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
        }
        Relationships: []
      }
      shops: {
        Row: {
          avatar_url: string | null
          avg_rating: number | null
          bio: string | null
          business_name: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          lga: string | null
          location: string | null
          response_minutes: number | null
          shop_slug: string | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"] | null
          tier: string | null
          total_sales: number | null
        }
        Insert: {
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          lga?: string | null
          location?: string | null
          response_minutes?: number | null
          shop_slug?: string | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"] | null
          tier?: never
          total_sales?: number | null
        }
        Update: {
          avatar_url?: string | null
          avg_rating?: number | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          lga?: string | null
          location?: string | null
          response_minutes?: number | null
          shop_slug?: string | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"] | null
          tier?: never
          total_sales?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_subscription: {
        Args: { _tier: Database["public"]["Enums"]["sub_tier"] }
        Returns: {
          avatar_url: string | null
          avg_rating: number
          bank_account: string | null
          bank_account_name: string | null
          bank_name: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          response_minutes: number
          shop_slug: string | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_list_pending_kyc: {
        Args: never
        Returns: {
          avatar_url: string | null
          avg_rating: number
          bank_account: string | null
          bank_account_name: string | null
          bank_name: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          response_minutes: number
          shop_slug: string | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      compute_tier: {
        Args: {
          _age_days: number
          _kyc_verified: boolean
          _rating: number
          _response_min: number
          _sales: number
        }
        Returns: string
      }
      gen_shop_slug: { Args: { _name: string }; Returns: string }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          avg_rating: number
          bank_account: string | null
          bank_account_name: string | null
          bank_name: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          full_name: string | null
          id: string
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          response_minutes: number
          shop_slug: string | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_notifications_read: { Args: never; Returns: undefined }
      redeem_admin_code: { Args: { _code: string }; Returns: boolean }
      topup_wallet: {
        Args: { _amount: number; _reference: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "user"
      item_condition: "new" | "used_like_new" | "used_good" | "used_fair"
      kyc_status: "none" | "pending" | "verified" | "rejected"
      listing_status: "pending" | "approved" | "rejected" | "flagged"
      listing_type: "goods" | "service"
      service_mode: "remote" | "in_person" | "both"
      sub_tier: "free" | "lite" | "pro" | "vip"
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
      app_role: ["admin", "user"],
      item_condition: ["new", "used_like_new", "used_good", "used_fair"],
      kyc_status: ["none", "pending", "verified", "rejected"],
      listing_status: ["pending", "approved", "rejected", "flagged"],
      listing_type: ["goods", "service"],
      service_mode: ["remote", "in_person", "both"],
      sub_tier: ["free", "lite", "pro", "vip"],
    },
  },
} as const
