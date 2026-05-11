export type MemberRole = 'owner' | 'member' | 'viewer'
export type InvitationStatus = 'pending' | 'accepted' | 'declined'
export type InvitedRole = 'member' | 'viewer'
export type FlightDirection = 'outbound' | 'return'
export type SplitType = 'equal_all' | 'equal_select' | 'custom'
export type SplitStatus = 'unpaid' | 'disputed' | 'paid'
export type PaymentStatus = 'pending' | 'confirmed'
export type Visibility = 'trip' | 'friend' | 'private'
export type PlaceCategory = 'eat' | 'drink' | 'activity' | 'sight' | 'other'

export interface Database {
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
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      privacy_settings: {
        Row: {
          user_id: string
          phone_visibility: Visibility
          bio_visibility: Visibility
          home_city_visibility: Visibility
        }
        Insert: Database['public']['Tables']['privacy_settings']['Row']
        Update: Partial<Database['public']['Tables']['privacy_settings']['Row']>
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
        Insert: Omit<Database['public']['Tables']['trips']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['trips']['Insert']>
      }
      trip_members: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          role: MemberRole
          joined_at: string
        }
        Insert: Omit<Database['public']['Tables']['trip_members']['Row'], 'id' | 'joined_at'>
        Update: Partial<Database['public']['Tables']['trip_members']['Insert']>
      }
      trip_permissions: {
        Row: {
          trip_id: string
          members_can_edit_info: boolean
          members_can_add_itinerary: boolean
          members_can_invite: boolean
          itinerary_visible_to_viewers: boolean
        }
        Insert: Database['public']['Tables']['trip_permissions']['Row']
        Update: Partial<Database['public']['Tables']['trip_permissions']['Row']>
      }
      invitations: {
        Row: {
          id: string
          trip_id: string
          invited_email: string
          invited_role: InvitedRole
          invited_by: string
          status: InvitationStatus
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['invitations']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
      }
      flights: {
        Row: {
          id: string
          trip_id: string
          direction: FlightDirection
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
        Insert: Omit<Database['public']['Tables']['flights']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['flights']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['hotels']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['hotels']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['itinerary_items']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['itinerary_items']['Insert']>
      }
      places: {
        Row: {
          id: string
          trip_id: string
          google_place_id: string
          name: string
          category: PlaceCategory
          lat: number
          lng: number
          price_level: number | null
          rating: number | null
          photo_url: string | null
          added_to_itinerary: boolean
          added_by: string
        }
        Insert: Omit<Database['public']['Tables']['places']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['places']['Insert']>
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
          split_type: SplitType
          added_by: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['expenses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['expenses']['Insert']>
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount_owed: number
          status: SplitStatus
          disputed_at: string | null
          paid_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['expense_splits']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['expense_splits']['Insert']>
      }
      payments: {
        Row: {
          id: string
          trip_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          note: string | null
          status: PaymentStatus
          created_at: string
          confirmed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
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
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>
      }
    }
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
        Returns: MemberRole
      }
    }
  }
}
