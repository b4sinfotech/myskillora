-- =============================================================================
-- myskillora — Seed Data
-- Run this AFTER 001_initial_schema.sql
-- =============================================================================

-- =============================================================================
-- CATEGORIES
-- =============================================================================

-- Academic subjects (parent categories)
insert into public.categories (id, name, slug, description, type, is_active, sort_order) values
  ('10000000-0000-0000-0000-000000000001', 'Academic Subjects', 'academic-subjects', 'Core school and university subjects', 'academic', true, 1),
  ('10000000-0000-0000-0000-000000000002', 'Activity & Skills', 'activity-skills', 'Creative, physical, and hobby-based skills', 'activity', true, 2),
  ('10000000-0000-0000-0000-000000000003', 'Professional Skills', 'professional-skills', 'Career and professional development', 'professional', true, 3);

-- Academic sub-categories
insert into public.categories (id, name, slug, description, type, parent_id, is_active, sort_order) values
  ('20000000-0000-0000-0000-000000000001', 'English', 'english', 'English language, literature, grammar, and communication skills', 'academic', '10000000-0000-0000-0000-000000000001', true, 1),
  ('20000000-0000-0000-0000-000000000002', 'Mathematics', 'maths', 'Arithmetic, algebra, geometry, calculus, and statistics', 'academic', '10000000-0000-0000-0000-000000000001', true, 2),
  ('20000000-0000-0000-0000-000000000003', 'Science', 'science', 'Physics, chemistry, biology, and general science', 'academic', '10000000-0000-0000-0000-000000000001', true, 3),
  ('20000000-0000-0000-0000-000000000004', 'Tamil', 'tamil', 'Tamil language, literature, grammar, and poetry', 'academic', '10000000-0000-0000-0000-000000000001', true, 4),
  ('20000000-0000-0000-0000-000000000005', 'Hindi', 'hindi', 'Hindi language and literature', 'academic', '10000000-0000-0000-0000-000000000001', true, 5),
  ('20000000-0000-0000-0000-000000000006', 'Social Studies', 'social-studies', 'History, geography, civics, and economics', 'academic', '10000000-0000-0000-0000-000000000001', true, 6),
  ('20000000-0000-0000-0000-000000000007', 'Physics', 'physics', 'Mechanics, thermodynamics, electromagnetism, and modern physics', 'academic', '10000000-0000-0000-0000-000000000001', true, 7),
  ('20000000-0000-0000-0000-000000000008', 'Chemistry', 'chemistry', 'Organic, inorganic, and physical chemistry', 'academic', '10000000-0000-0000-0000-000000000001', true, 8),
  ('20000000-0000-0000-0000-000000000009', 'Biology', 'biology', 'Cell biology, genetics, ecology, and human anatomy', 'academic', '10000000-0000-0000-0000-000000000001', true, 9),
  ('20000000-0000-0000-0000-000000000010', 'Computer Science', 'computer-science', 'Programming concepts, algorithms, and digital literacy', 'academic', '10000000-0000-0000-0000-000000000001', true, 10);

-- Activity sub-categories
insert into public.categories (id, name, slug, description, type, parent_id, is_active, sort_order) values
  ('30000000-0000-0000-0000-000000000001', 'Music', 'music', 'Vocal and instrumental music training', 'activity', '10000000-0000-0000-0000-000000000002', true, 1),
  ('30000000-0000-0000-0000-000000000002', 'Orchestra & Instruments', 'orchestra', 'Classical and modern orchestra instruments', 'activity', '10000000-0000-0000-0000-000000000002', true, 2),
  ('30000000-0000-0000-0000-000000000003', 'Martial Arts', 'martial-arts', 'Karate, taekwondo, judo, jiu-jitsu, and self-defence', 'activity', '10000000-0000-0000-0000-000000000002', true, 3),
  ('30000000-0000-0000-0000-000000000004', 'Dance', 'dance', 'Classical, contemporary, folk, and freestyle dance', 'activity', '10000000-0000-0000-0000-000000000002', true, 4),
  ('30000000-0000-0000-0000-000000000005', 'Art & Drawing', 'art', 'Sketching, painting, digital art, and crafts', 'activity', '10000000-0000-0000-0000-000000000002', true, 5),
  ('30000000-0000-0000-0000-000000000006', 'Coding & Programming', 'coding', 'Web development, Python, JavaScript, app building', 'activity', '10000000-0000-0000-0000-000000000002', true, 6),
  ('30000000-0000-0000-0000-000000000007', 'Yoga & Meditation', 'yoga', 'Hatha yoga, pranayama, and mindfulness', 'activity', '10000000-0000-0000-0000-000000000002', true, 7),
  ('30000000-0000-0000-0000-000000000008', 'Chess', 'chess', 'Chess strategy, tactics, and tournament preparation', 'activity', '10000000-0000-0000-0000-000000000002', true, 8),
  ('30000000-0000-0000-0000-000000000009', 'Cooking & Baking', 'cooking', 'Culinary arts, baking, and nutrition basics', 'activity', '10000000-0000-0000-0000-000000000002', true, 9),
  ('30000000-0000-0000-0000-000000000010', 'Photography', 'photography', 'Digital photography, editing, and composition', 'activity', '10000000-0000-0000-0000-000000000002', true, 10),
  ('30000000-0000-0000-0000-000000000011', 'Public Speaking', 'public-speaking', 'Communication, debate, and presentation skills', 'activity', '10000000-0000-0000-0000-000000000002', true, 11),
  ('30000000-0000-0000-0000-000000000012', 'Sports Coaching', 'sports', 'Cricket, football, badminton, swimming, and more', 'activity', '10000000-0000-0000-0000-000000000002', true, 12);

-- Professional sub-categories
insert into public.categories (id, name, slug, description, type, parent_id, is_active, sort_order) values
  ('40000000-0000-0000-0000-000000000001', 'Interview Prep', 'interview-prep', 'Job interviews, aptitude, and resume building', 'professional', '10000000-0000-0000-0000-000000000003', true, 1),
  ('40000000-0000-0000-0000-000000000002', 'IELTS / TOEFL', 'ielts-toefl', 'International English language test preparation', 'professional', '10000000-0000-0000-0000-000000000003', true, 2),
  ('40000000-0000-0000-0000-000000000003', 'CAT / GMAT / GRE', 'cat-gmat-gre', 'Management and graduate entrance exam preparation', 'professional', '10000000-0000-0000-0000-000000000003', true, 3),
  ('40000000-0000-0000-0000-000000000004', 'JEE / NEET', 'jee-neet', 'Engineering and medical entrance exam preparation', 'professional', '10000000-0000-0000-0000-000000000003', true, 4),
  ('40000000-0000-0000-0000-000000000005', 'Data Science & AI', 'data-science', 'Machine learning, data analysis, and AI fundamentals', 'professional', '10000000-0000-0000-0000-000000000003', true, 5);

-- =============================================================================
-- PLATFORM SETTINGS
-- =============================================================================

insert into public.platform_settings (key, value, description) values
  ('admin_email',             '"admin@myskillora.com"',        'Email that receives admin role on first signup'),
  ('platform_name',           '"myskillora"',                  'Display name of the platform'),
  ('commission_bronze',       '0.20',                          'Platform fee for Bronze tier teachers (20%)'),
  ('commission_silver',       '0.17',                          'Platform fee for Silver tier teachers (17%)'),
  ('commission_gold',         '0.14',                          'Platform fee for Gold tier teachers (14%)'),
  ('commission_elite',        '0.10',                          'Platform fee for Elite tier teachers (10%)'),
  ('silver_tier_sessions',    '50',                            'Minimum completed sessions for Silver tier'),
  ('gold_tier_sessions',      '200',                           'Minimum completed sessions for Gold tier'),
  ('gold_tier_rating',        '4.5',                           'Minimum rating for Gold tier'),
  ('elite_tier_sessions',     '500',                           'Minimum completed sessions for Elite tier'),
  ('elite_tier_rating',       '4.8',                           'Minimum rating for Elite tier'),
  ('max_videos_per_teacher',  '5',                             'Maximum sample videos a teacher can upload'),
  ('booking_cancellation_hours', '24',                         'Hours before session within which cancellation is not allowed'),
  ('currency',                '"INR"',                         'Default platform currency'),
  ('support_email',           '"support@myskillora.com"',      'Customer support email address'),
  ('maintenance_mode',        'false',                         'Set to true to put the platform in maintenance mode'),
  ('new_teacher_requires_approval', 'true',                   'Whether new teachers need admin approval before going live'),
  ('featured_teachers_count', '6',                             'Number of featured teachers shown on the home page');
