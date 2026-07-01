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
      profiles: {
        Row: {
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
      admin_approve_listing: { Args: { _id: string }; Returns: undefined }
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
      ensure_chat: { Args: { _listing_id: string }; Returns: string }
      expire_old_listings: { Args: never; Returns: number }
      gen_shop_slug: { Args: { _name: string }; Returns: string }
      get_my_profile: {
        Args: never
        Returns: {
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_chat_read: { Args: { _chat_id: string }; Returns: undefined }
      mark_notifications_read: { Args: never; Returns: undefined }
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
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
      item_condition: ["new", "used_like_new", "used_good", "used_fair"],
      kyc_status: ["none", "pending", "verified", "rejected"],
      listing_status: ["pending", "approved", "rejected", "flagged", "expired"],
      listing_type: ["goods", "service"],
      service_mode: ["remote", "in_person", "both"],
      sub_tier: ["free", "lite", "pro", "vip"],
    },
  },
} as const
