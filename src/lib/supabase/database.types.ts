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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          broker_id: string | null
          budget_amount: number | null
          client_name: string | null
          company_id: string
          created_at: string
          development_id: string | null
          farol: string | null
          happened_at: string
          id: string
          metadata: Json
          motivation: string | null
          notes: string | null
          opportunity_id: string | null
          partner_id: string | null
          portfolio_id: string | null
          quantity: number
          secondary_development_id: string | null
          user_id: string | null
          visit_qualified: boolean | null
          visit_summary: string | null
        }
        Insert: {
          activity_type: string
          broker_id?: string | null
          budget_amount?: number | null
          client_name?: string | null
          company_id: string
          created_at?: string
          development_id?: string | null
          farol?: string | null
          happened_at?: string
          id?: string
          metadata?: Json
          motivation?: string | null
          notes?: string | null
          opportunity_id?: string | null
          partner_id?: string | null
          portfolio_id?: string | null
          quantity?: number
          secondary_development_id?: string | null
          user_id?: string | null
          visit_qualified?: boolean | null
          visit_summary?: string | null
        }
        Update: {
          activity_type?: string
          broker_id?: string | null
          budget_amount?: number | null
          client_name?: string | null
          company_id?: string
          created_at?: string
          development_id?: string | null
          farol?: string | null
          happened_at?: string
          id?: string
          metadata?: Json
          motivation?: string | null
          notes?: string | null
          opportunity_id?: string | null
          partner_id?: string | null
          portfolio_id?: string | null
          quantity?: number
          secondary_development_id?: string | null
          user_id?: string | null
          visit_qualified?: boolean | null
          visit_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "activities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_secondary_development_id_fkey"
            columns: ["secondary_development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_brokers: {
        Row: {
          activity_id: string
          broker_id: string
          company_id: string
          created_at: string
          id: string
          is_primary: boolean
          source_label: string | null
        }
        Insert: {
          activity_id: string
          broker_id: string
          company_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
          source_label?: string | null
        }
        Update: {
          activity_id?: string
          broker_id?: string
          company_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
          source_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_brokers_activity_company_fkey"
            columns: ["activity_id", "company_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "activity_brokers_broker_company_fkey"
            columns: ["broker_id", "company_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id", "company_id"]
          },
          {
            foreignKeyName: "activity_brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          actor_user_id: string | null
          company_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          event_type: string
          id: number
          payload: Json
        }
        Insert: {
          actor_user_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type: string
          id?: never
          payload?: Json
        }
        Update: {
          actor_user_id?: string | null
          company_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          event_type?: string
          id?: never
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "audit_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      broker_partner_memberships: {
        Row: {
          broker_id: string
          company_id: string
          created_at: string
          ended_at: string | null
          id: string
          is_primary: boolean
          partner_id: string
          partner_unit_id: string | null
          started_at: string | null
        }
        Insert: {
          broker_id: string
          company_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_primary?: boolean
          partner_id: string
          partner_unit_id?: string | null
          started_at?: string | null
        }
        Update: {
          broker_id?: string
          company_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_primary?: boolean
          partner_id?: string
          partner_unit_id?: string | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "broker_partner_memberships_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_partner_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_partner_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_partner_memberships_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "broker_partner_memberships_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broker_partner_memberships_partner_unit_id_fkey"
            columns: ["partner_unit_id"]
            isOneToOne: false
            referencedRelation: "partner_units"
            referencedColumns: ["id"]
          },
        ]
      }
      brokers: {
        Row: {
          company_id: string
          created_at: string
          creci: string | null
          email: string | null
          full_name: string
          id: string
          metadata: Json
          normalized_name: string | null
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          creci?: string | null
          email?: string | null
          full_name: string
          id?: string
          metadata?: Json
          normalized_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          creci?: string | null
          email?: string | null
          full_name?: string
          id?: string
          metadata?: Json
          normalized_name?: string | null
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brokers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_goals: {
        Row: {
          company_id: string
          created_at: string
          id: string
          indicator_key: string
          indicator_name: string
          metadata: Json
          period_start: string
          portfolio_id: string | null
          target_value: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          indicator_key: string
          indicator_name: string
          metadata?: Json
          period_start: string
          portfolio_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          indicator_key?: string
          indicator_name?: string
          metadata?: Json
          period_start?: string
          portfolio_id?: string | null
          target_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_goals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_goals_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          activated_at: string | null
          contract_status: string
          created_at: string
          document: string | null
          id: string
          is_active: boolean
          legal_name: string | null
          name: string
          notes: string | null
          plan_name: string | null
          slug: string
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          contract_status?: string
          created_at?: string
          document?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name: string
          notes?: string | null
          plan_name?: string | null
          slug: string
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          contract_status?: string
          created_at?: string
          document?: string | null
          id?: string
          is_active?: boolean
          legal_name?: string | null
          name?: string
          notes?: string | null
          plan_name?: string | null
          slug?: string
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_member_permissions: {
        Row: {
          allowed: boolean
          company_id: string
          created_at: string
          granted_by: string | null
          permission: Database["public"]["Enums"]["company_permission"]
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed?: boolean
          company_id: string
          created_at?: string
          granted_by?: string | null
          permission: Database["public"]["Enums"]["company_permission"]
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed?: boolean
          company_id?: string
          created_at?: string
          granted_by?: string | null
          permission?: Database["public"]["Enums"]["company_permission"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_member_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_member_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_member_permissions_company_id_user_id_fkey"
            columns: ["company_id", "user_id"]
            isOneToOne: false
            referencedRelation: "company_memberships"
            referencedColumns: ["company_id", "user_id"]
          },
          {
            foreignKeyName: "company_member_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_member_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_memberships: {
        Row: {
          company_id: string
          created_at: string
          is_active: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_memberships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          company_id: string
          created_at: string
          currency_code: string
          locale: string
          settings: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          currency_code?: string
          locale?: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          currency_code?: string
          locale?: string
          settings?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_settings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      developments: {
        Row: {
          code: string | null
          company_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          company_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          company_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "developments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          company_id: string
          created_at: string
          error_code: string | null
          error_message: string | null
          id: number
          import_id: string
          normalized_data: Json | null
          processed_at: string | null
          raw_data: Json
          row_number: number
          status: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: never
          import_id: string
          normalized_data?: Json | null
          processed_at?: string | null
          raw_data: Json
          row_number: number
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: never
          import_id?: string
          normalized_data?: Json | null
          processed_at?: string | null
          raw_data?: Json
          row_number?: number
          status?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "imports"
            referencedColumns: ["id"]
          },
        ]
      }
      imports: {
        Row: {
          company_id: string
          created_at: string
          error_rows: number
          file_name: string | null
          id: string
          imported_by: string | null
          metadata: Json
          processed_rows: number
          source: string | null
          status: string
          total_rows: number
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          error_rows?: number
          file_name?: string | null
          id?: string
          imported_by?: string | null
          metadata?: Json
          processed_rows?: number
          source?: string | null
          status?: string
          total_rows?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          error_rows?: number
          file_name?: string | null
          id?: string
          imported_by?: string | null
          metadata?: Json
          processed_rows?: number
          source?: string | null
          status?: string
          total_rows?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "imports_imported_by_fkey"
            columns: ["imported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          assigned_to: string | null
          broker_id: string | null
          closed_at: string | null
          company_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_value: number | null
          created_at: string
          deal_type: string | null
          development_id: string | null
          estimated_value: number | null
          farol: string | null
          id: string
          lost_reason: string | null
          metadata: Json
          motivation: string | null
          partner_id: string | null
          partner_unit_id: string | null
          portfolio_id: string | null
          proposal_value: number | null
          source: string | null
          source_date: string | null
          stage: string
          stage_id: string | null
          table_value: number | null
          unit_code: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          broker_id?: string | null
          closed_at?: string | null
          company_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_value?: number | null
          created_at?: string
          deal_type?: string | null
          development_id?: string | null
          estimated_value?: number | null
          farol?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json
          motivation?: string | null
          partner_id?: string | null
          partner_unit_id?: string | null
          portfolio_id?: string | null
          proposal_value?: number | null
          source?: string | null
          source_date?: string | null
          stage?: string
          stage_id?: string | null
          table_value?: number | null
          unit_code?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          broker_id?: string | null
          closed_at?: string | null
          company_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_value?: number | null
          created_at?: string
          deal_type?: string | null
          development_id?: string | null
          estimated_value?: number | null
          farol?: string | null
          id?: string
          lost_reason?: string | null
          metadata?: Json
          motivation?: string | null
          partner_id?: string | null
          partner_unit_id?: string | null
          portfolio_id?: string | null
          proposal_value?: number | null
          source?: string | null
          source_date?: string | null
          stage?: string
          stage_id?: string | null
          table_value?: number | null
          unit_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "opportunities_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_partner_unit_id_fkey"
            columns: ["partner_unit_id"]
            isOneToOne: false
            referencedRelation: "partner_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_aliases: {
        Row: {
          alias: string
          company_id: string
          created_at: string
          id: string
          normalized_alias: string
          partner_id: string
        }
        Insert: {
          alias: string
          company_id: string
          created_at?: string
          id?: string
          normalized_alias: string
          partner_id: string
        }
        Update: {
          alias?: string
          company_id?: string
          created_at?: string
          id?: string
          normalized_alias?: string
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_aliases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_aliases_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_aliases_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_metrics_daily: {
        Row: {
          active_brokers_count: number
          activities_count: number
          company_id: string
          gross_sales_value: number
          metric_date: string
          opportunities_count: number
          partner_id: string
          sales_count: number
          updated_at: string
          won_opportunities_count: number
        }
        Insert: {
          active_brokers_count?: number
          activities_count?: number
          company_id: string
          gross_sales_value?: number
          metric_date: string
          opportunities_count?: number
          partner_id: string
          sales_count?: number
          updated_at?: string
          won_opportunities_count?: number
        }
        Update: {
          active_brokers_count?: number
          activities_count?: number
          company_id?: string
          gross_sales_value?: number
          metric_date?: string
          opportunities_count?: number
          partner_id?: string
          sales_count?: number
          updated_at?: string
          won_opportunities_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_metrics_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_metrics_daily_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_metrics_daily_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_metrics_daily_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_relationship_snapshots: {
        Row: {
          client_visit_count: number
          company_id: string
          created_at: string
          declared_brokers: number
          duty_participation_count: number
          id: string
          legacy_activity_score: number | null
          legacy_weights: Json
          metadata: Json
          partner_id: string
          partner_service_count: number
          portfolio_id: string | null
          proposal_count: number
          sale_count: number
          snapshot_date: string
          training_count: number
        }
        Insert: {
          client_visit_count?: number
          company_id: string
          created_at?: string
          declared_brokers?: number
          duty_participation_count?: number
          id?: string
          legacy_activity_score?: number | null
          legacy_weights?: Json
          metadata?: Json
          partner_id: string
          partner_service_count?: number
          portfolio_id?: string | null
          proposal_count?: number
          sale_count?: number
          snapshot_date: string
          training_count?: number
        }
        Update: {
          client_visit_count?: number
          company_id?: string
          created_at?: string
          declared_brokers?: number
          duty_participation_count?: number
          id?: string
          legacy_activity_score?: number | null
          legacy_weights?: Json
          metadata?: Json
          partner_id?: string
          partner_service_count?: number
          portfolio_id?: string | null
          proposal_count?: number
          sale_count?: number
          snapshot_date?: string
          training_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "partner_relationship_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_relationship_snapshots_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_relationship_snapshots_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_relationship_snapshots_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_relationship_snapshots_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_units: {
        Row: {
          address: string | null
          city: string | null
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          metadata: Json
          name: string
          partner_id: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name: string
          partner_id: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          metadata?: Json
          name?: string
          partner_id?: string
          state?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_units_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_units_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          company_id: string
          created_at: string
          declared_broker_count: number | null
          document: string | null
          id: string
          metadata: Json
          name: string
          normalized_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          declared_broker_count?: number | null
          document?: string | null
          id?: string
          metadata?: Json
          name: string
          normalized_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          declared_broker_count?: number | null
          document?: string | null
          id?: string
          metadata?: Json
          name?: string
          normalized_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          key: string
          name: string
          position: number
          stage_type: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          key: string
          name: string
          position: number
          stage_type?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          key?: string
          name?: string
          position?: number
          stage_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_partner_assignments: {
        Row: {
          company_id: string
          created_at: string
          ended_at: string | null
          id: string
          is_current: boolean
          partner_id: string
          portfolio_id: string
          started_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_current?: boolean
          partner_id: string
          portfolio_id: string
          started_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          is_current?: boolean
          partner_id?: string
          portfolio_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_partner_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_partner_assignments_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_partner_assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "portfolio_partner_assignments_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_partner_assignments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_active: boolean
          manager_name: string | null
          manager_user_id: string | null
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_name?: string | null
          manager_user_id?: string | null
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          manager_name?: string | null
          manager_user_id?: string | null
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_manager_user_id_fkey"
            columns: ["manager_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          global_role: Database["public"]["Enums"]["app_role"]
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          global_role?: Database["public"]["Enums"]["app_role"]
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          global_role?: Database["public"]["Enums"]["app_role"]
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          broker_id: string | null
          company_id: string
          created_at: string
          development_id: string | null
          gross_value: number
          id: string
          metadata: Json
          opportunity_id: string | null
          owner_user_id: string | null
          partner_id: string | null
          partner_unit_id: string | null
          sold_at: string
          updated_at: string
        }
        Insert: {
          broker_id?: string | null
          company_id: string
          created_at?: string
          development_id?: string | null
          gross_value: number
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          owner_user_id?: string | null
          partner_id?: string | null
          partner_unit_id?: string | null
          sold_at: string
          updated_at?: string
        }
        Update: {
          broker_id?: string | null
          company_id?: string
          created_at?: string
          development_id?: string | null
          gross_value?: number
          id?: string
          metadata?: Json
          opportunity_id?: string | null
          owner_user_id?: string | null
          partner_id?: string | null
          partner_unit_id?: string | null
          sold_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_broker_id_fkey"
            columns: ["broker_id"]
            isOneToOne: false
            referencedRelation: "brokers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_development_id_fkey"
            columns: ["development_id"]
            isOneToOne: false
            referencedRelation: "developments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "sales_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_partner_unit_id_fkey"
            columns: ["partner_unit_id"]
            isOneToOne: false
            referencedRelation: "partner_units"
            referencedColumns: ["id"]
          },
        ]
      }
      v6_dimension_configs: {
        Row: {
          calculation_config: Json
          company_id: string
          created_at: string
          description: string | null
          dimension_key: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          weight: number
        }
        Insert: {
          calculation_config?: Json
          company_id: string
          created_at?: string
          description?: string | null
          dimension_key: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          weight: number
        }
        Update: {
          calculation_config?: Json
          company_id?: string
          created_at?: string
          description?: string | null
          dimension_key?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "v6_dimension_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v6_dimension_configs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      v6_scores: {
        Row: {
          company_id: string
          created_at: string
          details: Json
          id: string
          overall_score: number | null
          partner_id: string
          period_end: string
          period_start: string
          updated_at: string
          v1_score: number | null
          v2_score: number | null
          v3_score: number | null
          v4_score: number | null
          v5_score: number | null
          v6_score: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          details?: Json
          id?: string
          overall_score?: number | null
          partner_id: string
          period_end: string
          period_start: string
          updated_at?: string
          v1_score?: number | null
          v2_score?: number | null
          v3_score?: number | null
          v4_score?: number | null
          v5_score?: number | null
          v6_score?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          details?: Json
          id?: string
          overall_score?: number | null
          partner_id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          v1_score?: number | null
          v2_score?: number | null
          v3_score?: number | null
          v4_score?: number | null
          v5_score?: number | null
          v6_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "v6_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v6_scores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v6_scores_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_performance"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "v6_scores_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      partner_performance: {
        Row: {
          brokers_count: number | null
          company_id: string | null
          gross_sales_value: number | null
          last_activity_at: string | null
          latest_v6_period_end: string | null
          latest_v6_score: number | null
          opportunities_count: number | null
          partner_id: string | null
          partner_name: string | null
          sales_count: number | null
          status: string | null
          won_opportunities_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partners_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_overview: {
        Row: {
          company_id: string | null
          estimated_value: number | null
          opportunities_count: number | null
          position: number | null
          stage_id: string | null
          stage_key: string | null
          stage_name: string | null
          stage_type: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "platform_companies_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_companies_overview: {
        Row: {
          activated_at: string | null
          admins_count: number | null
          collaborators_count: number | null
          contract_status: string | null
          created_at: string | null
          developments_count: number | null
          gross_sales_value: number | null
          id: string | null
          is_active: boolean | null
          last_activity_at: string | null
          managers_count: number | null
          name: string | null
          opportunities_count: number | null
          partners_count: number | null
          plan_name: string | null
          sales_count: number | null
          slug: string | null
          updated_at: string | null
          users_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_super_admin_internal: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      get_my_company_permissions: {
        Args: { target_company_id: string }
        Returns: {
          allowed: boolean
          permission: Database["public"]["Enums"]["company_permission"]
        }[]
      }
      get_overview_metrics: {
        Args: {
          date_from?: string
          date_to?: string
          target_company_id: string
        }
        Returns: Json
      }
      get_platform_overview_metrics: { Args: never; Returns: Json }
      get_platform_recent_activity: {
        Args: { limit_rows?: number }
        Returns: {
          actor_user_id: string
          company_id: string
          company_name: string
          created_at: string
          entity_id: string
          entity_type: string
          event_type: string
          id: number
          payload: Json
        }[]
      }
      set_member_permissions: {
        Args: {
          permission_list: Database["public"]["Enums"]["company_permission"][]
          target_company_id: string
          target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "manager" | "collaborator"
      company_permission:
        | "overview_view"
        | "partners_view"
        | "partners_manage"
        | "pipeline_view"
        | "opportunities_manage"
        | "activities_log"
        | "developments_view"
        | "imports_execute"
        | "intelligence_view"
        | "team_view"
        | "team_manage"
        | "admin_view"
        | "settings_manage"
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
    ? keyof DatabaseWithoutInternals[DefaultSchemaCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
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
      app_role: ["super_admin", "admin", "manager", "collaborator"],
      company_permission: [
        "overview_view",
        "partners_view",
        "partners_manage",
        "pipeline_view",
        "opportunities_manage",
        "activities_log",
        "developments_view",
        "imports_execute",
        "intelligence_view",
        "team_view",
        "team_manage",
        "admin_view",
        "settings_manage",
      ],
    },
  },
} as const
