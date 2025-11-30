// User and Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  builderId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface Builder {
  id: string;
  name: string;
  subdomain: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  builderName?: string;
  subdomain?: string;
}

export type UserRole = 'ADMIN' | 'MANAGER' | 'AGENT';

// Project Types
export interface Project {
  id: string;
  builderId: string;
  name: string;
  city: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leadStats?: {
    total: number;
    new: number;
    booked: number;
  };
}

export interface CreateProjectData {
  name: string;
  city: string;
  description?: string;
}

export interface UpdateProjectData {
  name?: string;
  city?: string;
  description?: string;
  isActive?: boolean;
}

// Lead Types
export interface Lead {
  id: string;
  projectId: string;
  builderId: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  stage: LeadStage;
  assignedTo?: string;
  lastContactedAt?: string;
  nextFollowUpAt?: string;
  meta?: Record<string, any>;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  assignedToUser?: User;
  activities?: Activity[];
  messageLogs?: MessageLog[];
}

export interface CreateLeadData {
  name: string;
  phone: string;
  email?: string;
  projectId: string;
  source: string;
  notes?: string;
  meta?: Record<string, any>;
}

export interface UpdateLeadData {
  name?: string;
  email?: string;
  notes?: string;
  assignedTo?: string;
  stage?: LeadStage;
  meta?: Record<string, any>;
}

export interface LeadFilters {
  projectId?: string;
  stage?: LeadStage;
  assignedTo?: string;
  source?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'name' | 'lastContactedAt';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export type LeadStage = 'NEW' | 'CONTACTED' | 'HOT' | 'VISITING' | 'BOOKED' | 'LOST';

// Activity Types
export interface Activity {
  id: string;
  leadId: string;
  userId: string;
  type: ActivityType;
  note: string;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: User;
}

export interface CreateActivityData {
  leadId: string;
  type: ActivityType;
  note: string;
  metadata?: Record<string, any>;
}

export type ActivityType = 'NOTE' | 'CALL' | 'EMAIL' | 'WHATSAPP' | 'STAGE_CHANGE' | 'ASSIGNMENT';

// Message Template Types
export interface MessageTemplate {
  id: string;
  builderId: string;
  name: string;
  content: string;
  variables?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMessageTemplateData {
  name: string;
  content: string;
  variables?: string[];
}

export interface UpdateMessageTemplateData {
  name?: string;
  content?: string;
  variables?: string[];
  isActive?: boolean;
}

// Automation Sequence Types
export interface AutomationSequence {
  id: string;
  builderId: string;
  name: string;
  description?: string;
  triggerEvent: AutomationTrigger;
  triggerStage?: string;
  steps: AutomationStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  templates?: MessageTemplate[];
}

export interface AutomationStep {
  id: string;
  sequenceId: string;
  messageTemplateId: string;
  delayHours: number;
  order: number;
  businessHoursOnly: boolean;
  template?: MessageTemplate;
  sendAt?: string;
}

export interface CreateAutomationSequenceData {
  name: string;
  description?: string;
  triggerEvent: AutomationTrigger;
  triggerStage?: string;
  steps: CreateAutomationStepData[];
}

export interface CreateAutomationStepData {
  messageTemplateId: string;
  delayHours: number;
  businessHoursOnly?: boolean;
}

export interface UpdateAutomationSequenceData {
  name?: string;
  description?: string;
  isActive?: boolean;
  steps?: CreateAutomationStepData[];
}

export type AutomationTrigger = 'LEAD_CREATED' | 'STAGE_CHANGED' | 'MANUAL';

// Message Log Types
export interface MessageLog {
  id: string;
  leadId: string;
  sequenceId?: string;
  stepIndex?: number;
  templateId?: string;
  providerMessageId?: string;
  provider: WhatsAppProvider;
  status: MessageStatus;
  direction: MessageDirection;
  content: string;
  errorMessage?: string;
  sentAt?: string;
  deliveredAt?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
  lead?: Lead;
  template?: MessageTemplate;
}

export type WhatsAppProvider = 'TWILIO' | 'ULTRAMSG' | 'MOCK';
export type MessageStatus = 'PENDING' | 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'REPLIED';
export type MessageDirection = 'OUTBOUND' | 'INBOUND';

// WhatsApp Configuration Types
export interface WhatsAppConfig {
  id: string;
  builderId: string;
  provider: WhatsAppProvider;
  phoneNumber: string;
  accountSid?: string;
  serviceName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWhatsAppConfigData {
  provider: WhatsAppProvider;
  apiKey: string;
  phoneNumber: string;
  accountSid?: string;
  serviceName?: string;
}

// Dashboard Types
export interface DashboardSummary {
  totalLeads: number;
  newLeads7Days: number;
  hotLeads: number;
  missedFollowUps: number;
  conversionRate: number;
  avgResponseTime: number;
}

export interface DashboardMetrics {
  leadsBySource: Array<{ source: string; count: number }>;
  leadsByStage: Array<{ stage: LeadStage; count: number }>;
  conversionFunnel: Array<{ stage: string; count: number; percentage: number }>;
  agentPerformance: Array<{
    agent: User;
    leadsAssigned: number;
    responseTime: number;
    conversions: number;
  }>;
  timeline: Array<{
    date: string;
    leads: number;
    bookings: number;
    messages: number;
  }>;
}

// Pipeline Types
export interface PipelineStage {
  name: LeadStage;
  count: number;
  color: string;
}

export interface PipelineBoard {
  stages: Array<{
    name: LeadStage;
    leads: Lead[];
  }>;
}

export interface MoveStageData {
  leadId: string;
  fromStage: LeadStage;
  toStage: LeadStage;
  note?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T> {
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

// Filter and Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TableProps<T> extends BaseComponentProps {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: PaginationParams;
  onPageChange?: (page: number) => void;
  onSort?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onRowClick?: (item: T) => void;
}

export interface TableColumn<T> {
  key: keyof T;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, item: T) => React.ReactNode;
}

// Form Types
export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  disabled?: boolean;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

// Chart Types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path?: string;
}

// Notification Types
export interface NotificationOptions {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right';
}

// Environment Types
export interface Config {
  apiUrl: string;
  appName: string;
  appVersion: string;
  demoMode: boolean;
  sentryDsn?: string;
}

// Storage Types
export interface StorageKeys {
  accessToken: 'xavira_access_token';
  refreshToken: 'xavira_refresh_token';
  user: 'xavira_user';
  builder: 'xavira_builder';
  theme: 'xavira_theme';
  preferences: 'xavira_preferences';
}

// Context Types
export interface AuthContextType {
  user: User | null;
  builder: Builder | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
}

export interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Route Types
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  roles?: UserRole[];
  children?: RouteConfig[];
  index?: boolean;
}

// Search and Filter Types
export interface SearchParams {
  q?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

export interface FilterOptions {
  label: string;
  value: string;
  count?: number;
}

// Status Types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
}

// File Upload Types
export interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  onUpload: (files: File[]) => void;
  onError?: (error: string) => void;
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
}

// Permission Types
export type Permission = 'users:read' | 'users:write' | 'users:delete' |
                      'projects:read' | 'projects:write' | 'projects:delete' |
                      'leads:read' | 'leads:write' | 'leads:delete' |
                      'automation:read' | 'automation:write' | 'automation:delete' |
                      'templates:read' | 'templates:write' | 'templates:delete' |
                      'dashboard:read' |
                      'settings:read' | 'settings:write';

export interface RolePermissions {
  [key in UserRole]: Permission[];
}

// Feature Flag Types
export interface FeatureFlags {
  whatsappIntegration: boolean;
  bulkMessaging: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

// Date and Time Types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface RelativeTime {
  value: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';
}

// Integration Types
export interface WebhookPayload {
  event: string;
  data: Record<string, any>;
  timestamp: string;
  signature?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  key: string;
  permissions: Permission[];
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  lastUsedAt?: string;
}

// Export all types for external use
export type {
  User,
  Builder,
  AuthResponse,
  LoginData,
  RegisterData,
  UserRole,
  Project,
  Lead,
  Activity,
  MessageTemplate,
  AutomationSequence,
  MessageLog,
  WhatsAppConfig,
  DashboardSummary,
  DashboardMetrics,
  AppError,
  NotificationOptions,
  Config,
  AuthContextType,
  ThemeContextType,
};