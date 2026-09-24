export type ProjectStage = 'concept' | 'prototype' | 'early_revenue' | 'scaling';
export type ProjectStatus = 'pending' | 'approved' | 'rejected' | 'live';
export type MilestoneStatus = 'pending' | 'in_progress' | 'completed';
export type InvestmentStatus = 'pending' | 'active' | 'completed';
export type TransactionType = 'return' | 'revenue_share' | 'valuation_update';

export type CategoryName =
  | 'Technology'
  | 'Agriculture'
  | 'Healthcare'
  | 'Creative Arts'
  | 'Renewable Energy';

export interface Profile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  is_innovator: boolean;
  is_investor: boolean;
  is_admin: boolean;
  company: string;
  expertise_fields: string[];
  created_at: string;
}

export interface Category {
  id: string;
  name: CategoryName;
  slug: string;
  description: string;
  icon: string;
  color: string;
  project_count: number;
}

export interface Project {
  id: string;
  innovator_id: string;
  innovator_name: string;
  innovator_avatar: string;
  category_id: string;
  category_name: CategoryName;
  title: string;
  description: string;
  problem: string;
  solution: string;
  stage: ProjectStage;
  funding_goal: number;
  funding_raised: number;
  equity_offered: number;
  revenue_share_pct: number;
  status: ProjectStatus;
  image_url: string;
  roi_projection: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string;
  target_date: string;
  completed_at: string | null;
  status: MilestoneStatus;
}

export interface Investment {
  id: string;
  investor_id: string;
  investor_name: string;
  project_id: string;
  project_title: string;
  project_image: string;
  amount: number;
  equity_pct: number;
  revenue_share_pct: number;
  status: InvestmentStatus;
  created_at: string;
}

export interface Transaction {
  id: string;
  investment_id: string;
  project_title: string;
  amount: number;
  type: TransactionType;
  description: string;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  receiver_id: string;
  project_id: string | null;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  category_id: string;
  author_id: string;
  author_name: string;
  author_avatar: string;
  author_role: string;
  title: string;
  content: string;
  replies: number;
  created_at: string;
}

export interface ProjectFollow {
  id: string;
  investor_id: string;
  project_id: string;
  created_at: string;
}

export interface RoiDataPoint {
  month: string;
  invested: number;
  returns: number;
  total: number;
}

