-- =====================================================
-- EXPAIR DATABASE INITIAL DATA
-- Skills and Categories Data
-- =====================================================

-- =====================================================
-- 1. GENERAL SKILLS CATEGORIES
-- =====================================================
INSERT INTO genskills_tbl (genskills_id, gencateg) VALUES
(1, 'Creative & Design'),
(2, 'Technical & IT'),
(3, 'Business & Management'),
(4, 'Communication & Interpersonal'),
(5, 'Health & Wellness'),
(6, 'Education & Training'),
(7, 'Home & Lifestyle'),
(8, 'Handiwork & Maintenance'),
(9, 'Digital & Social Media'),
(10, 'Language & Translation'),
(11, 'Financial & Accounting'),
(12, 'Sports & Fitness'),
(13, 'Arts & Performance'),
(14, 'Culture & Diversity'),
(15, 'Research & Critical Thinking')
ON CONFLICT (genskills_id) DO NOTHING;

-- =====================================================
-- 2. SPECIALIZED SKILLS
-- =====================================================

-- Creative & Design Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(1, 1, 'Graphic Design'),
(2, 1, 'Photography'),
(3, 1, 'Video Editing'),
(4, 1, 'Illustration'),
(5, 1, 'Animation')
ON CONFLICT (specskills_id) DO NOTHING;

-- Technical & IT Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(6, 2, 'Web Development'),
(7, 2, 'Software Development'),
(8, 2, 'IT Support'),
(9, 2, 'Network Administration'),
(10, 2, 'Cybersecurity')
ON CONFLICT (specskills_id) DO NOTHING;

-- Business & Management Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(11, 3, 'Project Management'),
(12, 3, 'Business Consulting'),
(13, 3, 'Human Resources'),
(14, 3, 'Operations Management'),
(15, 3, 'Marketing Strategy')
ON CONFLICT (specskills_id) DO NOTHING;

-- Communication & Interpersonal Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(16, 4, 'Customer Service'),
(17, 4, 'Public Relations'),
(18, 4, 'Copywriting'),
(19, 4, 'Multilingual Communication'),
(20, 4, 'Online Community Engagement')
ON CONFLICT (specskills_id) DO NOTHING;

-- Health & Wellness Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(21, 5, 'Nutrition Coaching'),
(22, 5, 'Personal Training'),
(23, 5, 'Mental Health Counseling'),
(24, 5, 'Yoga Instruction'),
(25, 5, 'Fitness Coaching')
ON CONFLICT (specskills_id) DO NOTHING;

-- Education & Training Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(26, 6, 'Tutoring'),
(27, 6, 'Language Instruction'),
(28, 6, 'Corporate Training'),
(29, 6, 'Curriculum Development'),
(30, 6, 'Test Preparation')
ON CONFLICT (specskills_id) DO NOTHING;

-- Home & Lifestyle Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(31, 7, 'Interior Decorating'),
(32, 7, 'Cleaning Services'),
(33, 7, 'Gardening'),
(34, 7, 'Event Planning'),
(35, 7, 'Personal Assistance')
ON CONFLICT (specskills_id) DO NOTHING;

-- Handiwork & Maintenance Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(36, 8, 'Furniture Assembly'),
(37, 8, 'Sewing & Alterations'),
(38, 8, 'Handyman Services'),
(39, 8, 'Painting & Decorating'),
(40, 8, 'Crafting')
ON CONFLICT (specskills_id) DO NOTHING;

-- Digital & Social Media Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(41, 9, 'Social Media Management'),
(42, 9, 'Content Creation'),
(43, 9, 'SEO'),
(44, 9, 'Digital Advertising'),
(45, 9, 'Email Marketing')
ON CONFLICT (specskills_id) DO NOTHING;

-- Language & Translation Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(46, 10, 'Translation'),
(47, 10, 'Interpretation'),
(48, 10, 'Language Tutoring'),
(49, 10, 'Transcription'),
(50, 10, 'Localization')
ON CONFLICT (specskills_id) DO NOTHING;

-- Financial & Accounting Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(51, 11, 'Bookkeeping'),
(52, 11, 'Tax Preparation'),
(53, 11, 'Financial Planning'),
(54, 11, 'Payroll Services'),
(55, 11, 'Auditing')
ON CONFLICT (specskills_id) DO NOTHING;

-- Sports & Fitness Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(56, 12, 'Exercise Coaching'),
(57, 12, 'Group Fitness Instruction'),
(58, 12, 'Sports Coaching'),
(59, 12, 'Nutrition for Athletes'),
(60, 12, 'Physical Therapy')
ON CONFLICT (specskills_id) DO NOTHING;

-- Arts & Performance Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(61, 13, 'Music Lessons'),
(62, 13, 'Dance Instruction'),
(63, 13, 'Acting Coaching'),
(64, 13, 'Visual Arts'),
(65, 13, 'Creative Writing')
ON CONFLICT (specskills_id) DO NOTHING;

-- Culture & Diversity Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(66, 14, 'Diversity Training'),
(67, 14, 'Cultural Consulting'),
(68, 14, 'Language & Cultural Exchange'),
(69, 14, 'Community Outreach'),
(70, 14, 'Inclusion Workshops')
ON CONFLICT (specskills_id) DO NOTHING;

-- Research & Critical Thinking Skills
INSERT INTO specskills_tbl (specskills_id, genskills_id, speccateg) VALUES
(71, 15, 'Market Research'),
(72, 15, 'Data Analysis'),
(73, 15, 'Academic Research'),
(74, 15, 'Competitive Analysis'),
(75, 15, 'Strategic Planning')
ON CONFLICT (specskills_id) DO NOTHING;

-- =====================================================
-- 3. SAMPLE ADMIN USER (Optional)
-- =====================================================
-- Uncomment the following lines if you want to create a sample admin user
-- Note: Password is hashed using Django's password hashing
-- Default password: 'admin123' (change this in production!)

/*
INSERT INTO users_tbl (
    user_id, first_name, last_name, username, email, password,
    is_verified, verification_status, is_active
) VALUES (
    1, 'Admin', 'User', 'admin', 'admin@expair.com', 
    'pbkdf2_sha256$600000$example$hashedpassword', -- Replace with actual hash
    true, 'VERIFIED', true
) ON CONFLICT (user_id) DO NOTHING;
*/

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these queries to verify the data was inserted correctly:

-- Check general skills count
-- SELECT COUNT(*) as general_skills_count FROM genskills_tbl;

-- Check specialized skills count  
-- SELECT COUNT(*) as specialized_skills_count FROM specskills_tbl;

-- Check skills by category
-- SELECT g.gencateg, COUNT(s.specskills_id) as skill_count 
-- FROM genskills_tbl g 
-- LEFT JOIN specskills_tbl s ON g.genskills_id = s.genskills_id 
-- GROUP BY g.genskills_id, g.gencateg 
-- ORDER BY g.genskills_id;
