export interface Course {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  tag: string;
  level: string;
  duration: string;
  sessions: number;
  price: number;
  depositAmount: number;
  topics: string[];
  includes: string[];
  coverUrl: string | null;
  isPublished: boolean;
}
