-- Sample parent reviews for Al-Furqan Academy and MY Academy
-- Run in Supabase SQL Editor (bypasses RLS)
-- These seed the reviews section so schools can see the concept when reviewing the site.

INSERT INTO reviews (school_id, user_id, user_name, user_email, rating, title, content, verified_parent, created_at)
VALUES

-- ── Al-Furqan Academy ──────────────────────────────────────────────────────

('al-furqan-academy',
 gen_random_uuid(),
 'Fatima A.',
 'parent@example.com',
 5,
 'Best decision we made for our kids',
 'We moved to Jacksonville three years ago and choosing Al-Furqan was the best decision we made. The teachers genuinely care about each child — academically and spiritually. My son memorized two juz in his first year while keeping up strong grades. The community feels like family. Highly recommend to any Muslim family in the area.',
 true,
 NOW() - INTERVAL '45 days'),

('al-furqan-academy',
 gen_random_uuid(),
 'Omar K.',
 'parent2@example.com',
 5,
 'Strong academics with real Islamic values',
 'My daughter has been at AFA since PreK and is now in 7th grade. The academic level is on par with the best public schools in the area — she''s ahead in math and reading. What sets AFA apart is that Islamic values are woven into everything, not just an add-on class. Administration is responsive and the parent community is very active.',
 true,
 NOW() - INTERVAL '20 days'),

('al-furqan-academy',
 gen_random_uuid(),
 'Sara M.',
 'parent3@example.com',
 4,
 'Excellent school, parking could be better',
 'We have two kids at AFA and overall it has been a wonderful experience. Teachers are qualified and caring, the Islamic environment is authentic, and our kids love going to school every day. The only small complaint is morning drop-off can get congested. Otherwise this school has exceeded our expectations in every way.',
 true,
 NOW() - INTERVAL '8 days'),

-- ── MY Academy ────────────────────────────────────────────────────────────

('my-academy',
 gen_random_uuid(),
 'Yusuf B.',
 'parent4@example.com',
 5,
 'Small school, big impact',
 'MY Academy is a hidden gem in Jacksonville. Because it''s smaller, every teacher knows your child by name. My son struggled in public school but within one semester here his confidence completely turned around. The 7:1 student-teacher ratio is real — kids get individual attention. The Islamic program is solid and the teachers lead by example.',
 true,
 NOW() - INTERVAL '30 days'),

('my-academy',
 gen_random_uuid(),
 'Amina H.',
 'parent5@example.com',
 5,
 'Perfect fit for our family',
 'After visiting four Islamic schools in Jacksonville, MY Academy stood out for its family atmosphere. The principal knows every student personally. My kids come home excited about what they learned — both deen and academics. Tuition is very reasonable compared to other private schools. We feel very blessed to have found this school.',
 true,
 NOW() - INTERVAL '15 days'),

('my-academy',
 gen_random_uuid(),
 'Khalid R.',
 'parent6@example.com',
 4,
 'Great community, growing in the right direction',
 'MY Academy has grown a lot over the past two years. New teachers have been excellent additions and you can see the school leadership is committed to continuous improvement. My daughter is in 5th grade and is well prepared. The Arabic program has gotten noticeably stronger this year. Looking forward to seeing how the high school program develops.',
 true,
 NOW() - INTERVAL '5 days');
