export type UserRole = 'student' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  font_size: 'sm' | 'md' | 'lg' | 'xl'
  high_contrast: boolean
  onboarding_completed: boolean
  created_at: string
}

export interface Module {
  id: number
  slug: string
  title: string
  description: string
  order_index: number
  published: boolean
  lessons?: Lesson[]
}

export type ContentBlock =
  | { type: 'intro'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'section_title'; text: string }
  | { type: 'highlight'; author: string; year: string; text: string }
  | { type: 'image'; url: string; caption: string }
  | { type: 'quote'; text: string; author: string }

export interface Lesson {
  id: number
  module_id: number
  slug: string
  title: string
  subtitle: string
  content: ContentBlock[]
  order_index: number
  published: boolean
  estimated_minutes: number
}

export interface LessonProgress {
  id: number
  user_id: string
  lesson_id: number
  status: 'not_started' | 'in_progress' | 'completed'
  started_at: string | null
  completed_at: string | null
}

export interface QuizQuestion {
  id: number
  lesson_id: number
  question: string
  options: string[]
  correct_index: number
  explanation: string
  order_index: number
}

export interface QuizResult {
  id: number
  user_id: string
  lesson_id: number
  score: number
  answers: number[]
  completed_at: string
}

export interface Exercise {
  id: number
  lesson_id: number
  title: string
  description: string
  exercise_type: 'text' | 'photo' | 'both'
  due_note: string
}

export interface Submission {
  id: number
  user_id: string
  exercise_id: number
  text_content: string | null
  file_urls: string[]
  status: 'submitted' | 'reviewed' | 'needs_revision'
  admin_feedback: string | null
  admin_grade: string | null
  submitted_at: string
  reviewed_at: string | null
  exercise?: Exercise
  profile?: Profile
}
