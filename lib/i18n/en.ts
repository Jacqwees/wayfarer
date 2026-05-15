/**
 * English (en-GB) — source locale for SquadStay.
 * To add a new language, create e.g. lib/i18n/fr.ts exporting an object
 * of the same shape (use `typeof en` from index.ts to enforce it).
 */

export const en = {
  // ── Common ──────────────────────────────────────────────────
  common: {
    back: 'Back',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    remove: 'Remove',
    add: 'Add',
    done: 'Done',
    confirm: 'Confirm',
    close: 'Close',
    loading: 'Loading…',
    saving: 'Saving…',
    error: 'Something went wrong. Please try again.',
    cannotBeUndone: 'This cannot be undone.',
    stay: 'Stay',
    leave: 'Leave',
    transfer: 'Transfer',
    copy: 'Copy',
    copied: 'Copied!',
    share: 'Share',
    invite: 'Invite',
    you: 'you',
    people: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
    optional: 'Optional',
    yes: 'Yes',
    no: 'No',
  },

  // ── Navigation ───────────────────────────────────────────────
  nav: {
    trips: 'Trips',
    notifications: 'Notify',
    profile: 'Profile',
  },

  // ── Auth / Onboarding ────────────────────────────────────────
  auth: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    signOutSub: 'See you soon',
    continueWithGoogle: 'Continue with Google',
    continueWithApple: 'Continue with Apple',
    orContinueWith: 'or continue with',
    email: 'Email',
    emailPlaceholder: 'you@example.com',
    sendMagicLink: 'Send magic link',
    checkYourEmail: 'Check your email',
    magicLinkSent: "We've sent a magic link to",
    magicLinkNote: 'Click the link in the email to sign in. You can close this tab.',
    backToSignIn: 'Back to sign in',
    notAuthenticated: 'Not authenticated',
  },

  onboarding: {
    stepName: {
      title: "What's your name?",
      subtitle: 'This is how you\'ll appear to your travel squad.',
      placeholder: 'Your name',
      continue: 'Continue',
    },
    stepDetails: {
      title: 'A bit about you',
      subtitle: 'Optional — you can always add this later.',
      homeCityPlaceholder: 'Home city',
      bioPlaceholder: 'Short bio…',
      continue: 'Continue',
      skip: 'Skip for now',
    },
    stepNotifications: {
      title: 'Stay in the loop',
      subtitle: 'Get notified when squad members add things, make changes, or invite you.',
      enableNotifications: 'Enable notifications',
      skip: 'Skip for now',
      alreadyEnabled: 'Notifications already enabled',
      permissionDenied: 'Notifications were blocked. You can enable them in your browser settings.',
    },
    stepReady: {
      title: "You're all set!",
      subtitle: "Your SquadStay profile is ready. Time to plan something epic.",
      viewTrips: 'View my trips',
      joinTrip: 'Join your trip →',
    },
  },

  // ── Trips List ───────────────────────────────────────────────
  trips: {
    title: 'My Trips',
    upcoming: 'Upcoming',
    past: 'Past',
    noTrips: 'No trips yet',
    noTripsUpcoming: 'No upcoming trips',
    noTripsPast: 'No past trips',
    noTripsHint: 'Create your first trip or accept an invitation.',
    createTrip: 'Create a trip',
    newTrip: 'New trip',
  },

  // ── New Trip Form ────────────────────────────────────────────
  newTrip: {
    title: 'New trip',
    destinationLabel: 'Where to?',
    destinationPlaceholder: 'Barcelona, Spain',
    tripNameLabel: 'Trip name',
    tripNamePlaceholder: 'Summer squad 2025',
    startDateLabel: 'Start date',
    endDateLabel: 'End date',
    create: 'Create trip',
    creating: 'Creating…',
  },

  // ── Trip Dashboard ───────────────────────────────────────────
  dashboard: {
    countdown: {
      daysToGo: (n: number) => `${n} ${n === 1 ? 'day' : 'days'} to go`,
      dayLeft: (n: number) => `${n} ${n === 1 ? 'day' : 'days'} left`,
      tripActive: 'Trip active',
      tripComplete: 'Trip complete',
    },
    tiles: {
      members: 'Members',
      itinerary: 'Itinerary',
      places: 'Places',
      hotel: 'Hotel',
      flights: 'Flights',
      packing: 'Packing',
      expenses: 'Expenses',
    },
    tileStats: {
      items: (n: number) => `${n} ${n === 1 ? 'item' : 'items'}`,
      added: 'Added',
      packed: (packed: number, total: number) => `${packed} / ${total} packed`,
      members: (n: number) => `${n} ${n === 1 ? 'member' : 'members'}`,
    },
  },

  // ── Trip Settings ────────────────────────────────────────────
  tripSettings: {
    title: 'Trip settings',
    tripName: 'Trip name',
    destination: 'Destination',
    startDate: 'Start date',
    endDate: 'End date',
    saveChanges: 'Save changes',
    deleteTrip: 'Delete trip',
    deleteTripConfirm: 'Delete this trip?',
    deleteTripWarning: 'All itinerary, expenses, and flight data will be permanently deleted.',
  },

  // ── Members ──────────────────────────────────────────────────
  members: {
    title: 'Members',
    people: (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`,
    roles: {
      owner: 'Owner',
      member: 'Member',
      viewer: 'Viewer',
    },
    actions: {
      makeMember: 'Make member',
      makeViewer: 'Make viewer',
      transferOwnership: 'Transfer ownership',
      remove: 'Remove',
      inviteSomeone: 'Invite someone',
      leaveTrip: 'Leave trip',
    },
    confirmLeave: {
      title: 'Leave this trip?',
      body: "You'll lose access to all trip content. The owner can re-invite you.",
      confirm: 'Leave',
      cancel: 'Stay',
    },
    confirmTransfer: {
      title: 'Transfer ownership?',
      body: (name: string) => `${name} will become the new owner. You'll become a member.`,
      confirm: 'Transfer',
      cancel: 'Cancel',
    },
    permissions: {
      heading: 'Permissions',
      membersCanEditInfo: 'Members can edit trip info',
      membersCanAddItinerary: 'Members can add itinerary items',
      membersCanInvite: 'Members can invite others',
      itineraryVisibleToViewers: 'Itinerary visible to viewers',
    },
  },

  // ── Invite ───────────────────────────────────────────────────
  invite: {
    title: 'Invite to trip',
    emailLabel: 'Email address',
    emailPlaceholder: 'friend@example.com',
    roleLabel: 'Role',
    roleMember: 'Member',
    roleViewer: 'Viewer',
    sendInvite: 'Send invite',
    inviteSent: 'Invite sent!',
    orShareLink: 'Or share a link',
    generateLink: 'Generate invite link',
    generating: 'Generating…',
    copyLink: 'Copy link',
    revokeLink: 'Revoke link',
    linkCopied: 'Link copied!',
    linkExpiry: 'Link expires in 7 days · anyone with it can join as a member',
  },

  // ── Flights ──────────────────────────────────────────────────
  flights: {
    title: 'Flights',
    outbound: 'Outbound',
    return: 'Return',
    noOutbound: 'No outbound flight added yet',
    noReturn: 'No return flight added yet',
    addFlight: 'Add flight',
    editFlight: 'Edit flight',
    saveChanges: 'Save changes',
    form: {
      from: 'From (IATA)',
      to: 'To (IATA)',
      fromPlaceholder: 'LHR',
      toPlaceholder: 'BCN',
      departure: 'Departure',
      arrival: 'Arrival',
      airline: 'Airline',
      airlinePlaceholder: 'easyJet',
      flightNumber: 'Flight no.',
      flightNumberPlaceholder: 'EZY1234',
      bookingRef: 'Booking reference',
      bookingRefPlaceholder: 'ABC123',
      notes: 'Notes',
      notesPlaceholder: 'Checked bags, terminal info…',
    },
    delete: {
      title: 'Remove flight?',
      body: 'This cannot be undone.',
      confirm: 'Delete',
      cancel: 'Cancel',
    },
  },

  // ── Itinerary ────────────────────────────────────────────────
  itinerary: {
    title: 'Itinerary',
    noItems: 'Nothing planned yet',
    noItemsHint: 'Add your first activity or event.',
    addItem: 'Add item',
    editItem: 'Edit item',
    form: {
      title: 'Title',
      titlePlaceholder: 'Dinner at El Nacional',
      date: 'Date',
      time: 'Time',
      location: 'Location',
      locationPlaceholder: 'Address or place name',
      notes: 'Notes',
      notesPlaceholder: 'Booking details, tips…',
      category: 'Category',
    },
    delete: {
      title: 'Remove item?',
      confirm: 'Delete',
      cancel: 'Cancel',
    },
  },

  // ── Places ───────────────────────────────────────────────────
  places: {
    title: 'Places',
    noPlaces: 'No places saved yet',
    noPlacesHint: 'Add restaurants, attractions, and spots you want to visit.',
    addPlace: 'Add place',
    editPlace: 'Edit place',
    form: {
      name: 'Name',
      namePlaceholder: 'Sagrada Família',
      category: 'Category',
      address: 'Address',
      addressPlaceholder: 'Full address',
      notes: 'Notes',
      notesPlaceholder: 'Opening times, tips…',
      url: 'Link',
      urlPlaceholder: 'https://…',
    },
    delete: {
      title: 'Remove place?',
      confirm: 'Delete',
      cancel: 'Cancel',
    },
  },

  // ── Hotel ────────────────────────────────────────────────────
  hotel: {
    title: 'Hotel',
    noHotel: 'No accommodation added yet',
    addHotel: 'Add accommodation',
    editHotel: 'Edit accommodation',
    form: {
      name: 'Name',
      namePlaceholder: 'Hotel Arts Barcelona',
      address: 'Address',
      addressPlaceholder: 'Full address',
      checkIn: 'Check-in',
      checkOut: 'Check-out',
      bookingRef: 'Booking reference',
      bookingRefPlaceholder: 'ABC123',
      notes: 'Notes',
      notesPlaceholder: 'Room details, contact…',
      url: 'Booking link',
    },
    delete: {
      title: 'Remove accommodation?',
      confirm: 'Delete',
      cancel: 'Cancel',
    },
  },

  // ── Packing ──────────────────────────────────────────────────
  packing: {
    title: 'Packing',
    noPacking: 'No packing list yet',
    addItem: 'Add item',
    editItem: 'Edit item',
    packed: 'Packed',
    unpacked: 'Not packed',
    markAllPacked: 'Mark all packed',
    clearList: 'Clear list',
    form: {
      item: 'Item',
      itemPlaceholder: 'Sunscreen',
      quantity: 'Quantity',
      category: 'Category',
      assignedTo: 'Assigned to',
    },
  },

  // ── Expenses ─────────────────────────────────────────────────
  expenses: {
    title: 'Expenses',
    noExpenses: 'No expenses yet',
    addExpense: 'Add expense',
    editExpense: 'Edit expense',
    totalSpent: 'Total spent',
    yourShare: 'Your share',
    youAreOwed: 'You are owed',
    youOwe: 'You owe',
    settled: 'Settled',
    settle: 'Settle up',
    form: {
      description: 'Description',
      descriptionPlaceholder: 'Dinner',
      amount: 'Amount (£)',
      paidBy: 'Paid by',
      category: 'Category',
      date: 'Date',
      splitWith: 'Split with',
      notes: 'Notes',
    },
    delete: {
      title: 'Remove expense?',
      confirm: 'Delete',
      cancel: 'Cancel',
    },
  },

  // ── Notifications ────────────────────────────────────────────
  notifications: {
    title: 'Notifications',
    noNotifications: 'No notifications yet',
    noNotificationsHint: "You're all caught up.",
    markAllRead: 'Mark all read',
    types: {
      trip_invitation: 'Trip invitation',
      invitation_sent: 'Invitation sent',
      member_joined: 'Joined the trip',
      itinerary_added: 'Itinerary update',
      expense_added: 'New expense',
      general: 'Notification',
    },
    acceptInvite: 'Accept',
    declineInvite: 'Decline',
  },

  // ── Profile ──────────────────────────────────────────────────
  profile: {
    editProfile: 'Edit profile',
    saveProfile: 'Save',
    cancelEdit: 'Cancel',
    travelStyle: 'Travel style',
    noTravelStyle: 'No travel style set yet',
    bio: 'Bio',
    bioPlaceholder: 'Write a short bio…',
    noBio: 'No bio yet',
    homeCity: 'Home city',
    homeCityPlaceholder: 'Home city',
    noHomeCity: 'No home city',
    phone: 'Phone',
    phonePlaceholder: 'Phone number',
    noPhone: 'No phone number',
    joined: (month: string, shortYear: string) => `joined ${month} '${shortYear}`,
    visibility: {
      tripMembers: 'Trip members',
      onlyMe: 'Only me',
    },
    stats: {
      trips: 'Trips',
      countries: 'Countries',
      daysAway: 'Days away',
      squad: 'Squad',
    },
    totalSpent: 'Total spent across all trips',
    settings: {
      heading: 'Settings',
      privacyLabel: 'Profile · privacy',
      privacySub: 'What trip members see',
      notificationsLabel: 'Notifications',
      notificationsSub: 'Push · email',
      appearanceLabel: 'Appearance',
      appearanceSub: 'Auto · light · dark',
      signOut: 'Sign out',
      signOutSub: 'See you soon',
    },
    travelTags: [
      'Adventure',
      'Food & Drink',
      'Mountains',
      'Beach',
      'Festivals',
      'Culture',
      'City Breaks',
      'Backpacking',
      'Nightlife',
      'Luxury',
      'Road Trips',
      'Wellness',
    ],
  },

  // ── Appearance ───────────────────────────────────────────────
  appearance: {
    heading: 'Appearance',
    auto: 'Auto',
    autoSub: 'Follows your device setting',
    light: 'Light',
    lightSub: 'Always light',
    dark: 'Dark',
    darkSub: 'Easy on the eyes',
  },

  // ── What's New ───────────────────────────────────────────────
  whatsNew: {
    badge: "What's new",
    subtitle: "Here's everything that's new in SquadStay.",
    current: 'Current',
    cta: "Let's go",
  },

  // ── Errors ───────────────────────────────────────────────────
  errors: {
    generic: 'Something went wrong. Please try again.',
    notFound: 'Not found.',
    unauthorized: 'You don\'t have permission to do that.',
    networkError: 'Network error. Check your connection.',
  },
} as const

export type Translation = typeof en
