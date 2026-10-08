export type EventRegistrationStatus = "REGISTERED" | "CANCELLED" | "ATTENDED";

export interface EventClubInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  contactEmail?: string | null;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  eventType: string;
  location: string;
  startTime: string;
  endTime: string;
  registrationStart: string | null;
  registrationEnd: string | null;
  maxAttendees: number | null;
  isRegistrationRequired: boolean;
  isActive: boolean;
  club: EventClubInfo;
  currentAttendeesCount: number;
  isFull: boolean;
  isRegistrationOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EventDetail extends EventItem {
  isUserRegistered: boolean;
  userRegistrationStatus: EventRegistrationStatus | null;
  userRegistrationCode: string | null;
}

export interface StudentRegistrationItem {
  id: string;
  registrationCode: string;
  status: EventRegistrationStatus;
  registeredAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    eventType: string;
    location: string;
    startTime: string;
    endTime: string;
    coverImageUrl: string | null;
    isActive: boolean;
    club: EventClubInfo;
  };
}

export interface EventTicketAttendee {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  batch: string | null;
  section: string | null;
}

export interface EventTicket {
  id: string;
  registrationCode: string;
  qrToken: string;
  status: EventRegistrationStatus;
  registeredAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    eventType: string;
    location: string;
    startTime: string;
    endTime: string;
    coverImageUrl: string | null;
    isActive: boolean;
    club: EventClubInfo;
  };
  attendee: EventTicketAttendee;
}

export interface EventsQueryParams {
  search?: string;
  clubId?: string;
  clubSlug?: string;
  eventType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface MyRegistrationsQueryParams {
  status?: EventRegistrationStatus;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedEventsResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
