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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          adresse: string | null
          code_postal: string | null
          created_at: string | null
          email: string | null
          entreprise: string | null
          id: string
          nom: string
          notes: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string | null
          user_id: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string | null
          email?: string | null
          entreprise?: string | null
          id?: string
          nom: string
          notes?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          created_at?: string | null
          email?: string | null
          entreprise?: string | null
          id?: string
          nom?: string
          notes?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string
          ville?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          adresse: string | null
          code_postal: string | null
          conditions_generales: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          nom_entreprise: string
          siret: string | null
          telephone: string | null
          updated_at: string
          user_id: string
          ville: string | null
        }
        Insert: {
          adresse?: string | null
          code_postal?: string | null
          conditions_generales?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom_entreprise: string
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          user_id: string
          ville?: string | null
        }
        Update: {
          adresse?: string | null
          code_postal?: string | null
          conditions_generales?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          nom_entreprise?: string
          siret?: string | null
          telephone?: string | null
          updated_at?: string
          user_id?: string
          ville?: string | null
        }
        Relationships: []
      }
      devis: {
        Row: {
          client_id: string
          client_nom: string | null
          conditions_paiement: string | null
          created_at: string
          date_creation: string
          delai_realisation: string | null
          id: string
          lignes_prestation: Json
          montant: number
          notes: string | null
          pret_envoi: boolean
          reference: string
          statut: string
          total_ht: number
          total_ttc: number
          total_tva: number
          updated_at: string
          user_id: string
          validite_jours: number
        }
        Insert: {
          client_id: string
          client_nom?: string | null
          conditions_paiement?: string | null
          created_at?: string
          date_creation?: string
          delai_realisation?: string | null
          id?: string
          lignes_prestation?: Json
          montant?: number
          notes?: string | null
          pret_envoi?: boolean
          reference?: string
          statut?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
          user_id: string
          validite_jours?: number
        }
        Update: {
          client_id?: string
          client_nom?: string | null
          conditions_paiement?: string | null
          created_at?: string
          date_creation?: string
          delai_realisation?: string | null
          id?: string
          lignes_prestation?: Json
          montant?: number
          notes?: string | null
          pret_envoi?: boolean
          reference?: string
          statut?: string
          total_ht?: number
          total_ttc?: number
          total_tva?: number
          updated_at?: string
          user_id?: string
          validite_jours?: number
        }
        Relationships: [
          {
            foreignKeyName: "devis_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      interventions: {
        Row: {
          adresse: string | null
          client_id: string
          commentaire_technicien: string | null
          created_at: string | null
          date_intervention: string | null
          description: string | null
          id: string
          materiel_utilise: string | null
          photos: string[] | null
          rapport_envoye: boolean | null
          rapport_pdf_url: string | null
          signature_url: string | null
          statut: Database["public"]["Enums"]["intervention_status"] | null
          technicien_id: string | null
          titre: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          adresse?: string | null
          client_id: string
          commentaire_technicien?: string | null
          created_at?: string | null
          date_intervention?: string | null
          description?: string | null
          id?: string
          materiel_utilise?: string | null
          photos?: string[] | null
          rapport_envoye?: boolean | null
          rapport_pdf_url?: string | null
          signature_url?: string | null
          statut?: Database["public"]["Enums"]["intervention_status"] | null
          technicien_id?: string | null
          titre: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          adresse?: string | null
          client_id?: string
          commentaire_technicien?: string | null
          created_at?: string | null
          date_intervention?: string | null
          description?: string | null
          id?: string
          materiel_utilise?: string | null
          photos?: string[] | null
          rapport_envoye?: boolean | null
          rapport_pdf_url?: string | null
          signature_url?: string | null
          statut?: Database["public"]["Enums"]["intervention_status"] | null
          technicien_id?: string | null
          titre?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interventions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "interventions_technicien_id_fkey"
            columns: ["technicien_id"]
            isOneToOne: false
            referencedRelation: "techniciens"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          nom: string | null
          prenom: string | null
          telephone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          nom?: string | null
          prenom?: string | null
          telephone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      techniciens: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          nom: string
          prenom: string | null
          specialite: string | null
          telephone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          nom: string
          prenom?: string | null
          specialite?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          nom?: string
          prenom?: string | null
          specialite?: string | null
          telephone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      intervention_status: "a_faire" | "en_cours" | "termine"
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
      intervention_status: ["a_faire", "en_cours", "termine"],
    },
  },
} as const
