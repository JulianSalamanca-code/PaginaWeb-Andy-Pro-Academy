export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  level: string;
  price: number;
  thumbnail: string;
  isPublished: boolean;
  createdAt: Date;
}
