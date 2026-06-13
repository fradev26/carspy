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
      admin_actions: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      autoscout_sync_config: {
        Row: {
          api_key_secret_ref: string | null
          autoscout_dealer_id: string
          created_at: string
          dealer_user_id: string
          enabled: boolean
          frequency_minutes: number
          id: string
          last_error: string | null
          last_status: string | null
          last_sync_at: string | null
          updated_at: string
        }
        Insert: {
          api_key_secret_ref?: string | null
          autoscout_dealer_id: string
          created_at?: string
          dealer_user_id: string
          enabled?: boolean
          frequency_minutes?: number
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_sync_at?: string | null
          updated_at?: string
        }
        Update: {
          api_key_secret_ref?: string | null
          autoscout_dealer_id?: string
          created_at?: string
          dealer_user_id?: string
          enabled?: boolean
          frequency_minutes?: number
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_sync_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
          seller_id: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
          seller_id: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
          seller_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_leads: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          source: string
          status: string
          updated_at: string
          user_id: string | null
          vat_number: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          vat_number?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      import_job_rows: {
        Row: {
          created_at: string
          error: Json | null
          id: string
          job_id: string
          listing_id: string | null
          payload: Json
          row_index: number
          status: string
        }
        Insert: {
          created_at?: string
          error?: Json | null
          id?: string
          job_id: string
          listing_id?: string | null
          payload?: Json
          row_index: number
          status: string
        }
        Update: {
          created_at?: string
          error?: Json | null
          id?: string
          job_id?: string
          listing_id?: string | null
          payload?: Json
          row_index?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_job_rows_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          created_at: string
          error_log: Json
          failed: number
          id: string
          source: string
          status: string
          succeeded: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_log?: Json
          failed?: number
          id?: string
          source: string
          status?: string
          succeeded?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_log?: Json
          failed?: number
          id?: string
          source?: string
          status?: string
          succeeded?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      listings: {
        Row: {
          additional_fuel_types: string[] | null
          alloy_wheel_size: number | null
          alloy_wheel_size_unit: string | null
          as24_listing_id: string | null
          as24_publication_status: string | null
          availability: Json | null
          body_type: string
          boost_until: string | null
          brand: string
          city: string | null
          co2_emissions: number | null
          co2_emissions_unit: string | null
          color: string | null
          combined_unit: string | null
          condition: Json | null
          condition_type: string | null
          consumption_city: number | null
          consumption_combined: number | null
          consumption_country: number | null
          country_version: string | null
          created_at: string
          cross_reference_id: string | null
          cylinder_capacity: number | null
          cylinder_capacity_unit: string | null
          cylinder_count: number | null
          description: string | null
          door_count: number | null
          doors: number | null
          drivetrain: string | null
          efficiency_class: string | null
          emission_class: string | null
          emission_sticker: string | null
          empty_weight: number | null
          empty_weight_unit: string | null
          engine_size: number | null
          equipment: string[] | null
          external_id: string | null
          external_ref: string | null
          external_source: string | null
          features: string[] | null
          first_registration_date: string | null
          fuel_type: string
          gear_count: number | null
          highlights: string[] | null
          id: string
          images: string[] | null
          included_services: string[] | null
          inspection_date: string | null
          is_premium: boolean
          leasing_offers: Json | null
          licence_plate: string | null
          marketing: Json | null
          mileage: number
          mileage_unit: string | null
          model: string
          model_version: string | null
          next_inspection_date: string | null
          offer_reference_id: string | null
          particle_filter: boolean | null
          power: number | null
          power_unit: string | null
          previous_owner_count: number | null
          price: number
          price_dealer: number | null
          price_negotiable: boolean | null
          price_public: number | null
          province: string | null
          publication: Json | null
          publication_channels: string[] | null
          raw_autoscout: Json | null
          seat_count: number | null
          seats: number | null
          service_history: Json | null
          source: string | null
          specs: Json | null
          status: string
          title: string
          transmission: string
          updated_at: string
          user_id: string
          vat_deductible: boolean | null
          vat_rate: number | null
          vehicle_type: string | null
          views: number
          vin: string | null
          warranty_details: string | null
          warranty_months: number | null
          warranty_type: string | null
          warranty_unit: string | null
          year: number
        }
        Insert: {
          additional_fuel_types?: string[] | null
          alloy_wheel_size?: number | null
          alloy_wheel_size_unit?: string | null
          as24_listing_id?: string | null
          as24_publication_status?: string | null
          availability?: Json | null
          body_type: string
          boost_until?: string | null
          brand: string
          city?: string | null
          co2_emissions?: number | null
          co2_emissions_unit?: string | null
          color?: string | null
          combined_unit?: string | null
          condition?: Json | null
          condition_type?: string | null
          consumption_city?: number | null
          consumption_combined?: number | null
          consumption_country?: number | null
          country_version?: string | null
          created_at?: string
          cross_reference_id?: string | null
          cylinder_capacity?: number | null
          cylinder_capacity_unit?: string | null
          cylinder_count?: number | null
          description?: string | null
          door_count?: number | null
          doors?: number | null
          drivetrain?: string | null
          efficiency_class?: string | null
          emission_class?: string | null
          emission_sticker?: string | null
          empty_weight?: number | null
          empty_weight_unit?: string | null
          engine_size?: number | null
          equipment?: string[] | null
          external_id?: string | null
          external_ref?: string | null
          external_source?: string | null
          features?: string[] | null
          first_registration_date?: string | null
          fuel_type: string
          gear_count?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          included_services?: string[] | null
          inspection_date?: string | null
          is_premium?: boolean
          leasing_offers?: Json | null
          licence_plate?: string | null
          marketing?: Json | null
          mileage: number
          mileage_unit?: string | null
          model: string
          model_version?: string | null
          next_inspection_date?: string | null
          offer_reference_id?: string | null
          particle_filter?: boolean | null
          power?: number | null
          power_unit?: string | null
          previous_owner_count?: number | null
          price: number
          price_dealer?: number | null
          price_negotiable?: boolean | null
          price_public?: number | null
          province?: string | null
          publication?: Json | null
          publication_channels?: string[] | null
          raw_autoscout?: Json | null
          seat_count?: number | null
          seats?: number | null
          service_history?: Json | null
          source?: string | null
          specs?: Json | null
          status?: string
          title: string
          transmission: string
          updated_at?: string
          user_id: string
          vat_deductible?: boolean | null
          vat_rate?: number | null
          vehicle_type?: string | null
          views?: number
          vin?: string | null
          warranty_details?: string | null
          warranty_months?: number | null
          warranty_type?: string | null
          warranty_unit?: string | null
          year: number
        }
        Update: {
          additional_fuel_types?: string[] | null
          alloy_wheel_size?: number | null
          alloy_wheel_size_unit?: string | null
          as24_listing_id?: string | null
          as24_publication_status?: string | null
          availability?: Json | null
          body_type?: string
          boost_until?: string | null
          brand?: string
          city?: string | null
          co2_emissions?: number | null
          co2_emissions_unit?: string | null
          color?: string | null
          combined_unit?: string | null
          condition?: Json | null
          condition_type?: string | null
          consumption_city?: number | null
          consumption_combined?: number | null
          consumption_country?: number | null
          country_version?: string | null
          created_at?: string
          cross_reference_id?: string | null
          cylinder_capacity?: number | null
          cylinder_capacity_unit?: string | null
          cylinder_count?: number | null
          description?: string | null
          door_count?: number | null
          doors?: number | null
          drivetrain?: string | null
          efficiency_class?: string | null
          emission_class?: string | null
          emission_sticker?: string | null
          empty_weight?: number | null
          empty_weight_unit?: string | null
          engine_size?: number | null
          equipment?: string[] | null
          external_id?: string | null
          external_ref?: string | null
          external_source?: string | null
          features?: string[] | null
          first_registration_date?: string | null
          fuel_type?: string
          gear_count?: number | null
          highlights?: string[] | null
          id?: string
          images?: string[] | null
          included_services?: string[] | null
          inspection_date?: string | null
          is_premium?: boolean
          leasing_offers?: Json | null
          licence_plate?: string | null
          marketing?: Json | null
          mileage?: number
          mileage_unit?: string | null
          model?: string
          model_version?: string | null
          next_inspection_date?: string | null
          offer_reference_id?: string | null
          particle_filter?: boolean | null
          power?: number | null
          power_unit?: string | null
          previous_owner_count?: number | null
          price?: number
          price_dealer?: number | null
          price_negotiable?: boolean | null
          price_public?: number | null
          province?: string | null
          publication?: Json | null
          publication_channels?: string[] | null
          raw_autoscout?: Json | null
          seat_count?: number | null
          seats?: number | null
          service_history?: Json | null
          source?: string | null
          specs?: Json | null
          status?: string
          title?: string
          transmission?: string
          updated_at?: string
          user_id?: string
          vat_deductible?: boolean | null
          vat_rate?: number | null
          vehicle_type?: string | null
          views?: number
          vin?: string | null
          warranty_details?: string | null
          warranty_months?: number | null
          warranty_type?: string | null
          warranty_unit?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_events: {
        Row: {
          created_at: string
          email: string | null
          event_name: string
          id: string
          page: string | null
          payload: Json
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_name: string
          id?: string
          page?: string | null
          payload?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          event_name?: string
          id?: string
          page?: string | null
          payload?: Json
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          listing_status: boolean
          marketing: boolean
          new_messages: boolean
          search_alerts: boolean
          system: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          listing_status?: boolean
          marketing?: boolean
          new_messages?: boolean
          search_alerts?: boolean
          system?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          listing_status?: boolean
          marketing?: boolean
          new_messages?: boolean
          search_alerts?: boolean
          system?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      privacy_preferences: {
        Row: {
          marketing_consent: boolean
          profile_public: boolean
          show_contact: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          marketing_consent?: boolean
          profile_public?: boolean
          show_contact?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          marketing_consent?: boolean
          profile_public?: boolean
          show_contact?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_website: string | null
          created_at: string
          dealer_name: string | null
          email: string | null
          full_name: string | null
          id: string
          is_dealer: boolean
          location: string | null
          phone: string | null
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_website?: string | null
          created_at?: string
          dealer_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_dealer?: boolean
          location?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_website?: string | null
          created_at?: string
          dealer_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_dealer?: boolean
          location?: string | null
          phone?: string | null
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          key: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          key: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          key?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          frequency: string
          id: string
          last_notified_at: string | null
          name: string
          paused: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          frequency?: string
          id?: string
          last_notified_at?: string | null
          name: string
          paused?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          frequency?: string
          id?: string
          last_notified_at?: string | null
          name?: string
          paused?: boolean
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          subject: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          subject: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          subject?: string
          user_id?: string | null
        }
        Relationships: []
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
      vehicle_leads: {
        Row: {
          brand: string
          created_at: string
          email: string | null
          estimated_price: number | null
          fuel_type: string | null
          id: string
          listing_id: string | null
          mileage: number | null
          model: string | null
          offer_eligible_at: string | null
          price_max: number | null
          price_min: number | null
          session_id: string | null
          status: Database["public"]["Enums"]["vehicle_lead_status"]
          transmission: string | null
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          year: number | null
        }
        Insert: {
          brand: string
          created_at?: string
          email?: string | null
          estimated_price?: number | null
          fuel_type?: string | null
          id?: string
          listing_id?: string | null
          mileage?: number | null
          model?: string | null
          offer_eligible_at?: string | null
          price_max?: number | null
          price_min?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["vehicle_lead_status"]
          transmission?: string | null
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          year?: number | null
        }
        Update: {
          brand?: string
          created_at?: string
          email?: string | null
          estimated_price?: number | null
          fuel_type?: string | null
          id?: string
          listing_id?: string | null
          mileage?: number | null
          model?: string | null
          offer_eligible_at?: string | null
          price_max?: number | null
          price_min?: number | null
          session_id?: string | null
          status?: Database["public"]["Enums"]["vehicle_lead_status"]
          transmission?: string | null
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_rate_limits: { Args: never; Returns: undefined }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          company_website: string | null
          created_at: string
          dealer_name: string | null
          email: string | null
          full_name: string | null
          id: string
          is_dealer: boolean
          location: string | null
          phone: string | null
          updated_at: string
          vat_number: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_listing_owner: { Args: { listing_id: string }; Returns: boolean }
      mark_dealer_eligible_leads: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator"
      vehicle_lead_status:
        | "analyzed"
        | "account_created"
        | "listed"
        | "sold"
        | "offered_to_dealers"
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
      app_role: ["admin", "moderator"],
      vehicle_lead_status: [
        "analyzed",
        "account_created",
        "listed",
        "sold",
        "offered_to_dealers",
      ],
    },
  },
} as const
