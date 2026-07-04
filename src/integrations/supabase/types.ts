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
          expires_at: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: []
      }
      artisan_portfolio: {
        Row: {
          artisan_id: string
          created_at: string | null
          id: string
          image_url: string
        }
        Insert: {
          artisan_id: string
          created_at?: string | null
          id?: string
          image_url: string
        }
        Update: {
          artisan_id?: string
          created_at?: string | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisan_portfolio_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisan_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artisan_profiles: {
        Row: {
          average_rating: number | null
          bio: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          lga: string | null
          phone: string | null
          profession: string
          profile_photo: string | null
          slug: string | null
          state: string | null
          total_reviews: number | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
          years_experience: number | null
        }
        Insert: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          lga?: string | null
          phone?: string | null
          profession: string
          profile_photo?: string | null
          slug?: string | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
          years_experience?: number | null
        }
        Update: {
          average_rating?: number | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          lga?: string | null
          phone?: string | null
          profession?: string
          profile_photo?: string | null
          slug?: string | null
          state?: string | null
          total_reviews?: number | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      artisan_reviews: {
        Row: {
          artisan_id: string
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          reviewer_id: string | null
        }
        Insert: {
          artisan_id: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          reviewer_id?: string | null
        }
        Update: {
          artisan_id?: string
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          reviewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artisan_reviews_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisan_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artisan_skills: {
        Row: {
          artisan_id: string
          id: string
          skill: string
        }
        Insert: {
          artisan_id: string
          id?: string
          skill: string
        }
        Update: {
          artisan_id?: string
          id?: string
          skill?: string
        }
        Relationships: [
          {
            foreignKeyName: "artisan_skills_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisan_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      chat_pins: {
        Row: {
          chat_id: string
          pinned_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          pinned_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          pinned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_pins_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
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
      cities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          state_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          state_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
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
      lgas: {
        Row: {
          created_at: string | null
          id: string
          name: string
          state_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          state_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          state_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lgas_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          brand: string | null
          category: string
          clicks_count: number
          condition: Database["public"]["Enums"]["item_condition"] | null
          created_at: string
          description: string
          expires_at: string
          id: string
          images: string[]
          is_promoted: boolean
          location: string
          phone: string | null
          price: number | null
          promoted_until: string | null
          rejection_reason: string | null
          renewed_count: number
          service_mode: Database["public"]["Enums"]["service_mode"] | null
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at: string
          user_id: string
          views_count: number
          years_experience: number | null
        }
        Insert: {
          brand?: string | null
          category: string
          clicks_count?: number
          condition?: Database["public"]["Enums"]["item_condition"] | null
          created_at?: string
          description: string
          expires_at?: string
          id?: string
          images?: string[]
          is_promoted?: boolean
          location: string
          phone?: string | null
          price?: number | null
          promoted_until?: string | null
          rejection_reason?: string | null
          renewed_count?: number
          service_mode?: Database["public"]["Enums"]["service_mode"] | null
          status?: Database["public"]["Enums"]["listing_status"]
          title: string
          type: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id: string
          views_count?: number
          years_experience?: number | null
        }
        Update: {
          brand?: string | null
          category?: string
          clicks_count?: number
          condition?: Database["public"]["Enums"]["item_condition"] | null
          created_at?: string
          description?: string
          expires_at?: string
          id?: string
          images?: string[]
          is_promoted?: boolean
          location?: string
          phone?: string | null
          price?: number | null
          promoted_until?: string | null
          rejection_reason?: string | null
          renewed_count?: number
          service_mode?: Database["public"]["Enums"]["service_mode"] | null
          status?: Database["public"]["Enums"]["listing_status"]
          title?: string
          type?: Database["public"]["Enums"]["listing_type"]
          updated_at?: string
          user_id?: string
          views_count?: number
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
          read_at: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
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
      platform_settings: {
        Row: {
          disable_messaging: boolean
          disable_payments: boolean
          disable_posting: boolean
          disable_registration: boolean
          disable_withdrawals: boolean
          emergency_banner: string | null
          id: number
          maintenance_mode: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          disable_messaging?: boolean
          disable_payments?: boolean
          disable_posting?: boolean
          disable_registration?: boolean
          disable_withdrawals?: boolean
          emergency_banner?: string | null
          id?: number
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          disable_messaging?: boolean
          disable_payments?: boolean
          disable_posting?: boolean
          disable_registration?: boolean
          disable_withdrawals?: boolean
          emergency_banner?: string | null
          id?: number
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_type: string
          available_weekends: boolean | null
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
          is_artisan: boolean | null
          is_available: boolean | null
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          offers_emergency_service: boolean | null
          offers_home_service: boolean | null
          phone: string | null
          portfolio_images: string[]
          portfolio_url: string | null
          profession: string | null
          profile_photo: string | null
          promotion_credits: number
          response_minutes: number
          response_rate: number | null
          service_radius: number | null
          shop_slug: string | null
          starting_price: number | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          travels_outside_lga: boolean | null
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
          years_experience: number | null
        }
        Insert: {
          account_type?: string
          available_weekends?: boolean | null
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
          is_artisan?: boolean | null
          is_available?: boolean | null
          is_merchant?: boolean
          is_verified?: boolean
          kyc_doc_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          lga?: string | null
          location?: string | null
          offers_emergency_service?: boolean | null
          offers_home_service?: boolean | null
          phone?: string | null
          portfolio_images?: string[]
          portfolio_url?: string | null
          profession?: string | null
          profile_photo?: string | null
          promotion_credits?: number
          response_minutes?: number
          response_rate?: number | null
          service_radius?: number | null
          shop_slug?: string | null
          starting_price?: number | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"]
          subscription_until?: string | null
          total_sales?: number
          travels_outside_lga?: boolean | null
          updated_at?: string
          wallet_balance?: number
          whatsapp?: string | null
          years_experience?: number | null
        }
        Update: {
          account_type?: string
          available_weekends?: boolean | null
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
          is_artisan?: boolean | null
          is_available?: boolean | null
          is_merchant?: boolean
          is_verified?: boolean
          kyc_doc_url?: string | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          lga?: string | null
          location?: string | null
          offers_emergency_service?: boolean | null
          offers_home_service?: boolean | null
          phone?: string | null
          portfolio_images?: string[]
          portfolio_url?: string | null
          profession?: string | null
          profile_photo?: string | null
          promotion_credits?: number
          response_minutes?: number
          response_rate?: number | null
          service_radius?: number | null
          shop_slug?: string | null
          starting_price?: number | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"]
          subscription_until?: string | null
          total_sales?: number
          travels_outside_lga?: boolean | null
          updated_at?: string
          wallet_balance?: number
          whatsapp?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_id?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
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
      search_logs: {
        Row: {
          category: string | null
          created_at: string
          id: string
          location: string | null
          query: string
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          query: string
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          query?: string
          user_id?: string | null
        }
        Relationships: []
      }
      shop_follows: {
        Row: {
          created_at: string
          follower_id: string
          shop_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          shop_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          shop_id?: string
        }
        Relationships: []
      }
      shop_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          reviewer_id: string
          shop_user_id: string
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          reviewer_id: string
          shop_user_id: string
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          reviewer_id?: string
          shop_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          amount: number
          created_at: string
          expires_at: string
          id: string
          payment_reference: string | null
          started_at: string
          status: string
          tier: Database["public"]["Enums"]["sub_tier"]
          user_id: string
          wallet_after: number
          wallet_before: number
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at: string
          id?: string
          payment_reference?: string | null
          started_at?: string
          status?: string
          tier: Database["public"]["Enums"]["sub_tier"]
          user_id: string
          wallet_after: number
          wallet_before: number
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string
          id?: string
          payment_reference?: string | null
          started_at?: string
          status?: string
          tier?: Database["public"]["Enums"]["sub_tier"]
          user_id?: string
          wallet_after?: number
          wallet_before?: number
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          boost_credits: number
          can_ai_desc: boolean
          can_promote: boolean
          can_shop: boolean
          can_vanity_slug: boolean
          display_name: string
          features: string[]
          max_goods: number
          max_services: number
          price_ngn: number
          tier: Database["public"]["Enums"]["sub_tier"]
        }
        Insert: {
          boost_credits?: number
          can_ai_desc?: boolean
          can_promote?: boolean
          can_shop?: boolean
          can_vanity_slug?: boolean
          display_name: string
          features?: string[]
          max_goods?: number
          max_services?: number
          price_ngn?: number
          tier: Database["public"]["Enums"]["sub_tier"]
        }
        Update: {
          boost_credits?: number
          can_ai_desc?: boolean
          can_promote?: boolean
          can_shop?: boolean
          can_vanity_slug?: boolean
          display_name?: string
          features?: string[]
          max_goods?: number
          max_services?: number
          price_ngn?: number
          tier?: Database["public"]["Enums"]["sub_tier"]
        }
        Relationships: []
      }
      typing_indicators: {
        Row: {
          chat_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_indicators_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
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
          bio: string | null
          business_name: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          location: string | null
          shop_slug: string | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"] | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          shop_slug?: string | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"] | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          location?: string | null
          shop_slug?: string | null
          state?: string | null
          subscription_tier?: Database["public"]["Enums"]["sub_tier"] | null
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
          account_type: string
          available_weekends: boolean | null
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
          is_artisan: boolean | null
          is_available: boolean | null
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          offers_emergency_service: boolean | null
          offers_home_service: boolean | null
          phone: string | null
          portfolio_images: string[]
          portfolio_url: string | null
          profession: string | null
          profile_photo: string | null
          promotion_credits: number
          response_minutes: number
          response_rate: number | null
          service_radius: number | null
          shop_slug: string | null
          starting_price: number | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          travels_outside_lga: boolean | null
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
          years_experience: number | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_activity_feed: {
        Args: { _limit?: number }
        Returns: {
          at: string
          entity_id: string
          kind: string
          subtitle: string
          title: string
        }[]
      }
      admin_approve_listing: { Args: { _id: string }; Returns: undefined }
      admin_broadcast: {
        Args: {
          _audience: string
          _body: string
          _link?: string
          _title: string
        }
        Returns: number
      }
      admin_dashboard_stats: {
        Args: never
        Returns: {
          active_subscribers: number
          artisans_total: number
          chats_24h: number
          kyc_pending: number
          listings_pending: number
          listings_today: number
          listings_total: number
          lite: number
          pro: number
          reports_open: number
          revenue_month: number
          revenue_today: number
          revenue_total: number
          shops_total: number
          users_today: number
          users_total: number
          vip: number
        }[]
      }
      admin_flag_seller: { Args: { _listing_id: string }; Returns: undefined }
      admin_generate_invite_code: { Args: never; Returns: string }
      admin_list_invite_codes: {
        Args: never
        Returns: {
          code: string
          created_at: string
          expires_at: string
          status: string
          used_at: string
          used_by: string
        }[]
      }
      admin_list_pending_kyc: {
        Args: never
        Returns: {
          account_type: string
          available_weekends: boolean | null
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
          is_artisan: boolean | null
          is_available: boolean | null
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          offers_emergency_service: boolean | null
          offers_home_service: boolean | null
          phone: string | null
          portfolio_images: string[]
          portfolio_url: string | null
          profession: string | null
          profile_photo: string | null
          promotion_credits: number
          response_minutes: number
          response_rate: number | null
          service_radius: number | null
          shop_slug: string | null
          starting_price: number | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          travels_outside_lga: boolean | null
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
          years_experience: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_list_reports: {
        Args: { _status?: string }
        Returns: {
          created_at: string
          details: string
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string
          reporter_name: string
          status: string
        }[]
      }
      admin_list_users: {
        Args: never
        Returns: {
          active_ads: number
          created_at: string
          email: string
          full_name: string
          id: string
          is_verified: boolean
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
        }[]
      }
      admin_moderation_queue: {
        Args: never
        Returns: {
          account_age_days: number
          category: string
          created_at: string
          id: string
          images: string[]
          price: number
          risk_reasons: string[]
          risk_score: number
          seller_id: string
          seller_name: string
          seller_phone: string
          title: string
        }[]
      }
      admin_pending_listings: {
        Args: never
        Returns: {
          category: string
          created_at: string
          id: string
          images: string[]
          price: number
          seller_id: string
          seller_name: string
          seller_phone: string
          title: string
          type: Database["public"]["Enums"]["listing_type"]
        }[]
      }
      admin_reject_listing: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      admin_resolve_report: {
        Args: { _action: string; _note?: string; _report_id: string }
        Returns: undefined
      }
      admin_revenue_stats: {
        Args: never
        Returns: {
          active_subscribers: number
          expired_subscribers: number
          lite_active: number
          monthly_revenue: number
          pro_active: number
          total_revenue: number
          total_subscribers: number
          vip_active: number
          yearly_revenue: number
        }[]
      }
      admin_update_platform_settings: {
        Args: {
          _banner: string
          _disable_messaging: boolean
          _disable_payments: boolean
          _disable_posting: boolean
          _disable_registration: boolean
          _disable_withdrawals: boolean
          _maintenance: boolean
        }
        Returns: undefined
      }
      admin_user_inspector: {
        Args: { _uid: string }
        Returns: {
          active_listings: number
          chats_count: number
          created_at: string
          email: string
          full_name: string
          id: string
          is_artisan: boolean
          is_verified: boolean
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          listings_count: number
          phone: string
          reports_against: number
          shop_slug: string
          state: string
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string
          trust_score: number
          wallet_balance: number
          wallet_txns: number
        }[]
      }
      category_counts: {
        Args: never
        Returns: {
          category: string
          count: number
        }[]
      }
      check_post_quota: {
        Args: { _type: Database["public"]["Enums"]["listing_type"] }
        Returns: boolean
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
      dashboard_stats: {
        Args: never
        Returns: {
          approved_count: number
          chats_total: number
          clicks_total: number
          conversion_rate: number
          favorites_total: number
          listings_count: number
          pending_count: number
          promoted_active: number
          unread_messages: number
          views_total: number
          wallet_balance: number
        }[]
      }
      ensure_chat: { Args: { _listing_id: string }; Returns: string }
      expire_old_listings: { Args: never; Returns: number }
      gen_shop_slug: { Args: { _name: string }; Returns: string }
      get_my_profile: {
        Args: never
        Returns: {
          account_type: string
          available_weekends: boolean | null
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
          is_artisan: boolean | null
          is_available: boolean | null
          is_merchant: boolean
          is_verified: boolean
          kyc_doc_url: string | null
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          lga: string | null
          location: string | null
          offers_emergency_service: boolean | null
          offers_home_service: boolean | null
          phone: string | null
          portfolio_images: string[]
          portfolio_url: string | null
          profession: string | null
          profile_photo: string | null
          promotion_credits: number
          response_minutes: number
          response_rate: number | null
          service_radius: number | null
          shop_slug: string | null
          starting_price: number | null
          state: string | null
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
          subscription_until: string | null
          total_sales: number
          travels_outside_lga: boolean | null
          updated_at: string
          wallet_balance: number
          whatsapp: string | null
          years_experience: number | null
        }[]
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_plan_limits: {
        Args: never
        Returns: {
          active_until: string
          boost_credits: number
          can_ai_desc: boolean
          can_promote: boolean
          can_shop: boolean
          can_vanity_slug: boolean
          display_name: string
          features: string[]
          max_goods: number
          max_services: number
          price_ngn: number
          tier: Database["public"]["Enums"]["sub_tier"]
          used_goods: number
          used_services: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_following_shop: { Args: { _shop_id: string }; Returns: boolean }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      log_admin_action: {
        Args: {
          _action: string
          _entity?: string
          _entity_id?: string
          _metadata?: Json
        }
        Returns: undefined
      }
      log_search: {
        Args: { _cat?: string; _loc?: string; _q: string }
        Returns: undefined
      }
      mark_chat_read: { Args: { _chat_id: string }; Returns: undefined }
      mark_notifications_read: { Args: never; Returns: undefined }
      merchant_health_score: {
        Args: never
        Returns: {
          active_listings: number
          avg_rating: number
          has_avatar: boolean
          has_bio: boolean
          has_shop: boolean
          kyc_done: boolean
          profile_complete: boolean
          recommendations: string[]
          score: number
          verified: boolean
        }[]
      }
      my_chats: {
        Args: never
        Returns: {
          id: string
          last_message: string
          last_message_at: string
          listing_id: string
          listing_image: string
          listing_title: string
          other_id: string
          other_name: string
          unread_count: number
        }[]
      }
      owner_listing_stats: {
        Args: { _id: string }
        Returns: {
          clicks_count: number
          favorites_count: number
          views_count: number
        }[]
      }
      platform_stats: {
        Args: never
        Returns: {
          active_categories: number
          active_shops: number
          total_listings: number
          verified_vendors: number
        }[]
      }
      promote_listing: {
        Args: { _days?: number; _listing_id: string }
        Returns: string
      }
      redeem_admin_code: { Args: { _code: string }; Returns: boolean }
      renew_listing: { Args: { _listing_id: string }; Returns: string }
      set_vanity_slug: { Args: { _slug: string }; Returns: string }
      shop_contact: {
        Args: { _slug: string }
        Returns: {
          phone: string
          whatsapp: string
        }[]
      }
      shop_follower_count: { Args: { _shop_id: string }; Returns: number }
      submit_report: {
        Args: { _details?: string; _id: string; _reason: string; _type: string }
        Returns: string
      }
      toggle_follow_shop: { Args: { _shop_id: string }; Returns: boolean }
      top_vendors: {
        Args: { _limit?: number }
        Returns: {
          active_listings: number
          avatar_url: string
          business_name: string
          full_name: string
          id: string
          is_verified: boolean
          shop_slug: string
          subscription_tier: Database["public"]["Enums"]["sub_tier"]
        }[]
      }
      topup_wallet: {
        Args: { _amount: number; _reference: string }
        Returns: number
      }
      track_listing_click: { Args: { _id: string }; Returns: undefined }
      track_listing_view: { Args: { _id: string }; Returns: undefined }
      trending_searches: {
        Args: { _days?: number; _limit?: number }
        Returns: {
          hits: number
          query: string
        }[]
      }
      user_trust_score: { Args: { _uid: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "user" | "moderator" | "support"
      item_condition: "new" | "used_like_new" | "used_good" | "used_fair"
      kyc_status: "none" | "pending" | "verified" | "rejected"
      listing_status:
        | "pending"
        | "approved"
        | "rejected"
        | "flagged"
        | "expired"
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
      app_role: ["admin", "user", "moderator", "support"],
      item_condition: ["new", "used_like_new", "used_good", "used_fair"],
      kyc_status: ["none", "pending", "verified", "rejected"],
      listing_status: ["pending", "approved", "rejected", "flagged", "expired"],
      listing_type: ["goods", "service"],
      service_mode: ["remote", "in_person", "both"],
      sub_tier: ["free", "lite", "pro", "vip"],
    },
  },
} as const
