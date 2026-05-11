export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string
          avatar_url: string | null
          phone: string | null
          bio: string | null
          home_city: string | null
          onboarding_complete: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          home_city?: string | null
          onboarding_complete?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string
          avatar_url?: string | null
          phone?: string | null
          bio?: string | null
          home_city?: string | null
          onboarding_complete?: boolean
          created_at?: string
        }
        Relationships: []
      }
      privacy_settings: {
        Row: {
          user_id: string
          phone_visibility: 'trip' | 'friend' | 'private'
          bio_visibility: 'trip' | 'friend' | 'private'
          home_city_visibility: 'trip' | 'friend' | 'private'
        }
        Insert: {
          user_id: string
          phone_visibility?: 'trip' | 'friend' | 'private'
          bio_visibility?: 'trip' | 'friend' | 'private'
          home_city_visibility?: 'trip' | 'friend' | 'private'
        }
        Update: {
          user_id?: string
          phone_visibility?: 'trip' | 'friend' | 'private'
          bio_visibility?: 'trip' | 'friend' | 'private'
          home_city_visibility?: 'trip' | 'friend' | 'private'
        }
        Relationships: []
      }
      trips: {
        Row: {
          id: string
          name: string
          destination_name: string
          destination_lat: number | null
          destination_lng: number | null
          start_date: string
          end_date: string
          cover_photo_url: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          destination_name: string
          destination_lat?: number | null
          destination_lng?: number | null
          start_date: string
          end_date: string
          cover_photo_url?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          destination_name?: string
          destination_lat?: number | null
          destination_lng?: number | null
          start_date?: string
          end_date?: string
          cover_photo_url?: string | null
          created_by?: string
          created_at?: string
        }
        Relationships: []
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: 'owner' | 'member' | 'viewer'
          joined_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          role?: 'owner' | 'member' | 'viewer'
          joined_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          role?: 'owner' | 'member' | 'viewer'
          joined_at?: string
        }
        Relationships: []
      }
      trip_permissions: {
        Row: {
          trip_id: string
          members_can_edit_info: boolean
          members_can_add_itinerary: boolean
          members_can_invite: boolean
          itinerary_visible_to_viewers: boolean
        }
        Insert: {
          trip_id: string
          members_can_edit_info?: boolean
          members_can_add_itinerary?: boolean
          members_can_invite?: boolean
          itinerary_visible_to_viewers?: boolean
        }
        Update: {
          trip_id?: string
          members_can_edit_info?: boolean
          members_can_add_itinerary?: boolean
          members_can_invite?: boolean
          itinerary_visible_to_viewers?: boolean
        }
        Relationships: []
      }
      invitations: {
        Row: {
          id: string
          trip_id: string
          invited_email: string
          invited_role: 'member' | 'viewer'
          invited_by: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          invited_email: string
          invited_role?: 'member' | 'viewer'
          invited_by: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          invited_email?: string
          invited_role?: 'member' | 'viewer'
          invited_by?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
        }
        Relationships: []
      }
      flights: {
        Row: {
          id: string
          trip_id: string
          direction: 'outbound' | 'return'
          departure_airport: string
          arrival_airport: string
          departure_datetime: string
          arrival_datetime: string
          flight_number: string | null
          airline: string | null
          booking_ref: string | null
          notes: string | null
          added_by: string
        }
        Insert: {
          id?: string
          trip_id: string
          direction: 'outbound' | 'return'
          departure_airport: string
          arrival_airport: string
          departure_datetime: string
          arrival_datetime: string
          flight_number?: string | null
          airline?: string | null
          booking_ref?: string | null
          notes?: string | null
          added_by: string
        }
        Update: {
          id?: string
          trip_id?: string
          direction?: 'outbound' | 'return'
          departure_airport?: string
          arrival_airport?: string
          departure_datetime?: string
          arrival_datetime?: string
          flight_number?: string | null
          airline?: string | null
          booking_ref?: string | null
          notes?: string | null
          added_by?: string
        }
        Relationships: []
      }
      hotels: {
        Row: {
          id: string
          trip_id: string
          name: string
          address: string
          lat: number | null
          lng: number | null
          check_in_date: string
          check_out_date: string
          booking_ref: string | null
          notes: string | null
          added_by: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          address: string
          lat?: number | null
          lng?: number | null
          check_in_date: string
          check_out_date: string
          booking_ref?: string | null
          notes?: string | null
          added_by: string
        }
        Update: {
          id?: string
          trip_id?: string
          name?: string
          address?: string
          lat?: number | null
          lng?: number | null
          check_in_date?: string
          check_out_date?: string
          booking_ref?: string | null
          notes?: string | null
          added_by?: string
        }
        Relationships: []
      }
      itinerary_items: {
        Row: {
          id: string
          trip_id: string
          date: string
          title: string
          description: string | null
          place_id: string | null
          lat: number | null
          lng: number | null
          time: string | null
          added_by: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          date: string
          title: string
          description?: string | null
          place_id?: string | null
          lat?: number | null
          lng?: number | null
          time?: string | null
          added_by: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          date?: string
          title?: string
          description?: string | null
          place_id?: string | null
          lat?: number | null
          lng?: number | null
          time?: string | null
          added_by?: string
          created_at?: string
        }
        Relationships: []
      }
      places: {
        Row: {
          id: string
          trip_id: string
          google_place_id: string
          name: string
          category: 'eat' | 'drink' | 'activity' | 'sight' | 'other'
          lat: number
          lng: number
          price_level: number | null
          rating: number | null
          photo_url: string | null
          added_to_itinerary: boolean
          added_by: string
        }
        Insert: {
          id?: string
          trip_id: string
          google_place_id: string
          name: string
          category?: 'eat' | 'drink' | 'activity' | 'sight' | 'other'
          lat: number
          lng: number
          price_level?: number | null
          rating?: number | null
          photo_url?: string | null
          added_to_itinerary?: boolean
          added_by: string
        }
        Update: {
          id?: string
          trip_id?: string
          google_place_id?: string
          name?: string
          category?: 'eat' | 'drink' | 'activity' | 'sight' | 'other'
          lat?: number
          lng?: number
          price_level?: number | null
          rating?: number | null
          photo_url?: string | null
          added_to_itinerary?: boolean
          added_by?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          description: string
          amount: number
          currency: string
          amount_gbp: number
          fx_rate_used: number
          paid_by: string
          date: string
          category: string
          split_type: 'equal_all' | 'equal_select' | 'custom'
          added_by: string
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          description: string
          amount: number
          currency?: string
          amount_gbp: number
          fx_rate_used?: number
          paid_by: string
          date?: string
          category?: string
          split_type?: 'equal_all' | 'equal_select' | 'custom'
          added_by: string
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          description?: string
          amount?: number
          currency?: string
          amount_gbp?: number
          fx_rate_used?: number
          paid_by?: string
          date?: string
          category?: string
          split_type?: 'equal_all' | 'equal_select' | 'custom'
          added_by?: string
          created_at?: string
        }
        Relationships: []
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount_owed: number
          status: 'unpaid' | 'disputed' | 'paid'
          disputed_at: string | null
          paid_at: string | null
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount_owed: number
          status?: 'unpaid' | 'disputed' | 'paid'
          disputed_at?: string | null
          paid_at?: string | null
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          amount_owed?: number
          status?: 'unpaid' | 'disputed' | 'paid'
          disputed_at?: string | null
          paid_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          trip_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          note: string | null
          status: 'pending' | 'confirmed'
          created_at: string
          confirmed_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          note?: string | null
          status?: 'pending' | 'confirmed'
          created_at?: string
          confirmed_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          from_user_id?: string
          to_user_id?: string
          amount?: number
          note?: string | null
          status?: 'pending' | 'confirmed'
          created_at?: string
          confirmed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          trip_id: string | null
          reference_id: string | null
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          trip_id?: string | null
          reference_id?: string | null
          message: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          trip_id?: string | null
          reference_id?: string | null
          message?: string
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      packing_items: {
        Row: {
          id: string
          trip_id: string
          label: string
          packed: boolean
          assigned_to: string | null
          added_by: string
          packed_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          label: string
          packed?: boolean
          assigned_to?: string | null
          added_by: string
          packed_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          label?: string
          packed?: boolean
          assigned_to?: string | null
          added_by?: string
          packed_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_trip_member: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
      is_trip_owner: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: boolean
      }
      trip_role: {
        Args: { p_trip_id: string; p_user_id: string }
        Returns: 'owner' | 'member' | 'viewer'
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
