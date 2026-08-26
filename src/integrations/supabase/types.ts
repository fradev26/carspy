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
    PostgrestVersion: "14.17"
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
      audit_logs: {
        Row: {
          action: string
          category: string
          company_id: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          role_at_time: Database["public"]["Enums"]["company_role"] | null
          target_id: string | null
          target_label: string | null
          target_table: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          role_at_time?: Database["public"]["Enums"]["company_role"] | null
          target_id?: string | null
          target_label?: string | null
          target_table?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          category?: string
          company_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          role_at_time?: Database["public"]["Enums"]["company_role"] | null
          target_id?: string | null
          target_label?: string | null
          target_table?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      autoscout_credentials: {
        Row: {
          auto_publish: boolean
          created_at: string
          customer_id: string
          draft_mode: boolean
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          password_secret_id: string | null
          publish_new_vehicles: boolean
          remove_on_sold: boolean
          sync_description: boolean
          sync_direction: string
          sync_photos: boolean
          sync_price: boolean
          sync_priority: string
          sync_schedule: string
          sync_specs: boolean
          sync_stock: boolean
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          auto_publish?: boolean
          created_at?: string
          customer_id: string
          draft_mode?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          password_secret_id?: string | null
          publish_new_vehicles?: boolean
          remove_on_sold?: boolean
          sync_description?: boolean
          sync_direction?: string
          sync_photos?: boolean
          sync_price?: boolean
          sync_priority?: string
          sync_schedule?: string
          sync_specs?: boolean
          sync_stock?: boolean
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          auto_publish?: boolean
          created_at?: string
          customer_id?: string
          draft_mode?: boolean
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          password_secret_id?: string | null
          publish_new_vehicles?: boolean
          remove_on_sold?: boolean
          sync_description?: boolean
          sync_direction?: string
          sync_photos?: boolean
          sync_price?: boolean
          sync_priority?: string
          sync_schedule?: string
          sync_specs?: boolean
          sync_stock?: boolean
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      autoscout_listings: {
        Row: {
          autoscout_listing_id: string
          content_hash: string
          created_at: string
          id: string
          internal_listing_id: string | null
          last_changed_at: string | null
          last_seen_at: string | null
          publication_status: string | null
          raw_data: Json | null
          sync_error: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          autoscout_listing_id: string
          content_hash?: string
          created_at?: string
          id?: string
          internal_listing_id?: string | null
          last_changed_at?: string | null
          last_seen_at?: string | null
          publication_status?: string | null
          raw_data?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          autoscout_listing_id?: string
          content_hash?: string
          created_at?: string
          id?: string
          internal_listing_id?: string | null
          last_changed_at?: string | null
          last_seen_at?: string | null
          publication_status?: string | null
          raw_data?: Json | null
          sync_error?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autoscout_listings_internal_listing_id_fkey"
            columns: ["internal_listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
      autoscout_sync_runs: {
        Row: {
          error_message: string | null
          finished_at: string | null
          id: string
          started_at: string
          status: string
          totals: Json | null
          trigger: string
          user_id: string
        }
        Insert: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status: string
          totals?: Json | null
          trigger: string
          user_id: string
        }
        Update: {
          error_message?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
          totals?: Json | null
          trigger?: string
          user_id?: string
        }
        Relationships: []
      }
      boost_packages: {
        Row: {
          code: string
          created_at: string
          duration_days: number
          id: string
          name: string
          price_cents: number
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          duration_days: number
          id?: string
          name: string
          price_cents: number
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          duration_days?: number
          id?: string
          name?: string
          price_cents?: number
          sort_order?: number
        }
        Relationships: []
      }
      boost_usage: {
        Row: {
          billing_period: string
          created_at: string
          duration_days: number
          ends_at: string
          id: string
          listing_id: string
          package_code: string
          price_cents: number
          source: string
          starts_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string
          created_at?: string
          duration_days: number
          ends_at: string
          id?: string
          listing_id: string
          package_code: string
          price_cents?: number
          source: string
          starts_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string
          created_at?: string
          duration_days?: number
          ends_at?: string
          id?: string
          listing_id?: string
          package_code?: string
          price_cents?: number
          source?: string
          starts_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boost_usage_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          company_id: string
          created_at: string
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string | null
          last_sent_at: string
          revoked_at: string | null
          role: Database["public"]["Enums"]["company_role"]
          send_count: number
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id: string
          created_at?: string
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          last_sent_at?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          send_count?: number
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          company_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          last_sent_at?: string
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          send_count?: number
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          deactivated_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string
          last_active_at: string | null
          role: Database["public"]["Enums"]["company_role"]
          status: Database["public"]["Enums"]["member_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          last_active_at?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string
          last_active_at?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          status?: Database["public"]["Enums"]["member_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      dealer_inventory_preferences: {
        Row: {
          allow_backorders: boolean
          allow_negative_stock: boolean
          archive_after_days: number
          auto_generate_vin_ref: boolean
          auto_mark_sold: boolean
          auto_relist_on_cancel: boolean
          auto_update_enabled: boolean
          created_at: string
          default_listing_status: string
          low_stock_email: boolean
          low_stock_push: boolean
          low_stock_threshold: number
          on_sold_action: string
          relist_delay_minutes: number
          reservation_enabled: boolean
          reservation_minutes: number
          sync_interval_minutes: number
          update_method: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_backorders?: boolean
          allow_negative_stock?: boolean
          archive_after_days?: number
          auto_generate_vin_ref?: boolean
          auto_mark_sold?: boolean
          auto_relist_on_cancel?: boolean
          auto_update_enabled?: boolean
          created_at?: string
          default_listing_status?: string
          low_stock_email?: boolean
          low_stock_push?: boolean
          low_stock_threshold?: number
          on_sold_action?: string
          relist_delay_minutes?: number
          reservation_enabled?: boolean
          reservation_minutes?: number
          sync_interval_minutes?: number
          update_method?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_backorders?: boolean
          allow_negative_stock?: boolean
          archive_after_days?: number
          auto_generate_vin_ref?: boolean
          auto_mark_sold?: boolean
          auto_relist_on_cancel?: boolean
          auto_update_enabled?: boolean
          created_at?: string
          default_listing_status?: string
          low_stock_email?: boolean
          low_stock_push?: boolean
          low_stock_threshold?: number
          on_sold_action?: string
          relist_delay_minutes?: number
          reservation_enabled?: boolean
          reservation_minutes?: number
          sync_interval_minutes?: number
          update_method?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dealer_leads: {
        Row: {
          company: string | null
          company_id: string | null
          created_at: string
          dealer_user_id: string | null
          email: string
          id: string
          listing_id: string | null
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
          company_id?: string | null
          created_at?: string
          dealer_user_id?: string | null
          email: string
          id?: string
          listing_id?: string | null
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
          company_id?: string | null
          created_at?: string
          dealer_user_id?: string | null
          email?: string
          id?: string
          listing_id?: string | null
          message?: string | null
          name?: string
          phone?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealer_leads_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_leads_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_opening_hours: {
        Row: {
          break_end: string | null
          break_start: string | null
          closed: boolean
          closes: string | null
          opens: string | null
          updated_at: string
          user_id: string
          weekday: number
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          closed?: boolean
          closes?: string | null
          opens?: string | null
          updated_at?: string
          user_id: string
          weekday: number
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          closed?: boolean
          closes?: string | null
          opens?: string | null
          updated_at?: string
          user_id?: string
          weekday?: number
        }
        Relationships: []
      }
      dealer_reviews: {
        Row: {
          author_id: string
          body: string | null
          created_at: string
          dealer_user_id: string
          id: string
          rating: number
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          created_at?: string
          dealer_user_id: string
          id?: string
          rating: number
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          created_at?: string
          dealer_user_id?: string
          id?: string
          rating?: number
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dealer_subscriptions: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
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
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          row_number: number
          status: string
        }
        Insert: {
          created_at?: string
          error?: Json | null
          id?: string
          job_id: string
          listing_id?: string | null
          payload?: Json
          row_number: number
          status: string
        }
        Update: {
          created_at?: string
          error?: Json | null
          id?: string
          job_id?: string
          listing_id?: string | null
          payload?: Json
          row_number?: number
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
      listing_view_events: {
        Row: {
          created_at: string
          day: string
          id: string
          listing_id: string
          session_hash: string
          source: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          listing_id: string
          session_hash: string
          source?: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          listing_id?: string
          session_hash?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_view_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          additional_fuel_types: string[] | null
          alloy_wheel_size: number | null
          alloy_wheel_size_unit: string | null
          as24_listing_id: string | null
          as24_publication_status: string | null
          auto_archive_at: string | null
          availability: Json | null
          body_type: string
          boost_until: string | null
          brand: string
          city: string | null
          co2_emissions: number | null
          co2_emissions_unit: string | null
          color: string | null
          combined_unit: string | null
          company_id: string | null
          condition: Json | null
          condition_type: string | null
          consumption_city: number | null
          consumption_combined: number | null
          consumption_country: number | null
          cost_price: number | null
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
          is_boosted: boolean
          is_premium: boolean
          leasing_offers: Json | null
          licence_plate: string | null
          margin: number | null
          marketing: Json | null
          mileage: number
          mileage_unit: string | null
          model: string
          model_version: string | null
          next_inspection_date: string | null
          offer_reference_id: string | null
          onboarded_by: string | null
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
          reserved_by: string | null
          reserved_until: string | null
          seat_count: number | null
          seats: number | null
          service_history: Json | null
          sold_at: string | null
          sold_price: number | null
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
          auto_archive_at?: string | null
          availability?: Json | null
          body_type: string
          boost_until?: string | null
          brand: string
          city?: string | null
          co2_emissions?: number | null
          co2_emissions_unit?: string | null
          color?: string | null
          combined_unit?: string | null
          company_id?: string | null
          condition?: Json | null
          condition_type?: string | null
          consumption_city?: number | null
          consumption_combined?: number | null
          consumption_country?: number | null
          cost_price?: number | null
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
          is_boosted?: boolean
          is_premium?: boolean
          leasing_offers?: Json | null
          licence_plate?: string | null
          margin?: number | null
          marketing?: Json | null
          mileage: number
          mileage_unit?: string | null
          model: string
          model_version?: string | null
          next_inspection_date?: string | null
          offer_reference_id?: string | null
          onboarded_by?: string | null
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
          reserved_by?: string | null
          reserved_until?: string | null
          seat_count?: number | null
          seats?: number | null
          service_history?: Json | null
          sold_at?: string | null
          sold_price?: number | null
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
          auto_archive_at?: string | null
          availability?: Json | null
          body_type?: string
          boost_until?: string | null
          brand?: string
          city?: string | null
          co2_emissions?: number | null
          co2_emissions_unit?: string | null
          color?: string | null
          combined_unit?: string | null
          company_id?: string | null
          condition?: Json | null
          condition_type?: string | null
          consumption_city?: number | null
          consumption_combined?: number | null
          consumption_country?: number | null
          cost_price?: number | null
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
          is_boosted?: boolean
          is_premium?: boolean
          leasing_offers?: Json | null
          licence_plate?: string | null
          margin?: number | null
          marketing?: Json | null
          mileage?: number
          mileage_unit?: string | null
          model?: string
          model_version?: string | null
          next_inspection_date?: string | null
          offer_reference_id?: string | null
          onboarded_by?: string | null
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
          reserved_by?: string | null
          reserved_until?: string | null
          seat_count?: number | null
          seats?: number | null
          service_history?: Json | null
          sold_at?: string | null
          sold_price?: number | null
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
            foreignKeyName: "listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          company_id: string | null
          company_website: string | null
          created_at: string
          dealer_name: string | null
          email: string | null
          full_name: string | null
          id: string
          is_dealer: boolean
          location: string | null
          phone: string | null
          theme_preference: string
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          avatar_url?: string | null
          company_id?: string | null
          company_website?: string | null
          created_at?: string
          dealer_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_dealer?: boolean
          location?: string | null
          phone?: string | null
          theme_preference?: string
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          avatar_url?: string | null
          company_id?: string | null
          company_website?: string | null
          created_at?: string
          dealer_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_dealer?: boolean
          location?: string | null
          phone?: string | null
          theme_preference?: string
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          id: string
          included_nitro: number
          included_turbo: number
          monthly_price_cents: number
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          included_nitro?: number
          included_turbo?: number
          monthly_price_cents: number
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          included_nitro?: number
          included_turbo?: number
          monthly_price_cents?: number
          name?: string
          sort_order?: number
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          dealer_name: string | null
          full_name: string | null
          id: string | null
          is_dealer: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          dealer_name?: string | null
          full_name?: string | null
          id?: string | null
          is_dealer?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          dealer_name?: string | null
          full_name?: string | null
          id?: string | null
          is_dealer?: boolean | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: Json }
      activate_boost: {
        Args: { _listing_id: string; _package_code: string }
        Returns: Json
      }
      autoscout_get_password: { Args: { _secret_id: string }; Returns: string }
      autoscout_save_password: {
        Args: { _password: string; _user_id: string }
        Returns: string
      }
      can_boost: { Args: { _user_id: string }; Returns: boolean }
      can_delete_listings: { Args: { _user_id: string }; Returns: boolean }
      can_edit_company: { Args: { _user_id: string }; Returns: boolean }
      can_edit_listings: { Args: { _user_id: string }; Returns: boolean }
      can_manage_billing: { Args: { _user_id: string }; Returns: boolean }
      can_manage_users: { Args: { _user_id: string }; Returns: boolean }
      can_view_leads: { Args: { _user_id: string }; Returns: boolean }
      change_member_role: {
        Args: {
          _role: Database["public"]["Enums"]["company_role"]
          _user_id: string
        }
        Returns: undefined
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      current_company_id: { Args: never; Returns: string }
      deactivate_member: { Args: { _user_id: string }; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      ensure_company_membership: { Args: never; Returns: string }
      get_current_billing: { Args: { _user_id: string }; Returns: Json }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string | null
          company_id: string | null
          company_website: string | null
          created_at: string
          dealer_name: string | null
          email: string | null
          full_name: string | null
          id: string
          is_dealer: boolean
          location: string | null
          phone: string | null
          theme_preference: string
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
      get_or_create_inventory_preferences: {
        Args: never
        Returns: {
          allow_backorders: boolean
          allow_negative_stock: boolean
          archive_after_days: number
          auto_generate_vin_ref: boolean
          auto_mark_sold: boolean
          auto_relist_on_cancel: boolean
          auto_update_enabled: boolean
          created_at: string
          default_listing_status: string
          low_stock_email: boolean
          low_stock_push: boolean
          low_stock_threshold: number
          on_sold_action: string
          relist_delay_minutes: number
          reservation_enabled: boolean
          reservation_minutes: number
          sync_interval_minutes: number
          update_method: string
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "dealer_inventory_preferences"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_company_role: {
        Args: {
          _role: Database["public"]["Enums"]["company_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      invite_member: {
        Args: {
          _email: string
          _full_name?: string
          _role: Database["public"]["Enums"]["company_role"]
        }
        Returns: Json
      }
      is_company_owner: { Args: { _user_id: string }; Returns: boolean }
      is_listing_owner: { Args: { listing_id: string }; Returns: boolean }
      list_company_members: {
        Args: never
        Returns: {
          avatar_url: string
          email: string
          full_name: string
          invited_at: string
          joined_at: string
          last_active_at: string
          role: Database["public"]["Enums"]["company_role"]
          status: Database["public"]["Enums"]["member_status"]
          user_id: string
        }[]
      }
      log_audit_event: {
        Args: {
          _action: string
          _category?: string
          _ip?: string
          _metadata?: Json
          _target_id?: string
          _target_label?: string
          _target_table?: string
          _user_agent?: string
        }
        Returns: string
      }
      mark_dealer_eligible_leads: { Args: never; Returns: number }
      member_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["company_role"]
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      peek_invitation: { Args: { _token: string }; Returns: Json }
      reactivate_member: { Args: { _user_id: string }; Returns: undefined }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      refresh_boosted_status: { Args: never; Returns: number }
      remove_member: { Args: { _user_id: string }; Returns: undefined }
      request_plan_change: { Args: { _plan_id: string }; Returns: Json }
      resend_invitation: { Args: { _invitation_id: string }; Returns: Json }
      revoke_invitation: {
        Args: { _invitation_id: string }
        Returns: undefined
      }
      search_facets: { Args: { _filters?: Json }; Returns: Json }
      search_filter_sql: {
        Args: { _exclude?: string; _filters: Json }
        Returns: string
      }
      set_listing_premium: {
        Args: { _enabled: boolean; _listing_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "stock_manager"
      company_role: "owner" | "manager" | "seller" | "marketing"
      member_status: "active" | "invited" | "blocked"
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
      app_role: ["admin", "moderator", "stock_manager"],
      company_role: ["owner", "manager", "seller", "marketing"],
      member_status: ["active", "invited", "blocked"],
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
