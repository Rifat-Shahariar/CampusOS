export type ResourceType =
  | "NOTE"
  | "QUESTION_PAPER"
  | "LAB_MANUAL"
  | "NOTICE"
  | "OTHER";

export interface ResourceDepartmentInfo {
  id: string;
  code: string;
  name: string;
}

export interface ResourceCourseInfo {
  id: string;
  code: string;
  name: string;
  department?: ResourceDepartmentInfo;
}

export interface ResourceUploaderInfo {
  id: string;
  name: string;
  fullName?: string;
  email?: string;
  role?: string;
}

export interface ResourceItem {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  resourceType: ResourceType;
  type?: ResourceType;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  batch: string | null;
  section: string | null;
  uploadedBy: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  course: ResourceCourseInfo;
  uploader?: ResourceUploaderInfo;
}

export type ResourceDetail = ResourceItem;

export interface CourseItem {
  id: string;
  code: string;
  name: string;
  department: ResourceDepartmentInfo;
}

export interface ResourcesQueryParams {
  search?: string;
  courseId?: string;
  resourceType?: ResourceType;
  type?: ResourceType;
  batch?: string;
  section?: string;
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResourcesResponse<T> {
  data: T[];
  meta: PaginationMeta;
}
