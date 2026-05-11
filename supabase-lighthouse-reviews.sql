-- Sample parent reviews for The Lighthouse Schools
-- Run in Supabase SQL Editor

INSERT INTO reviews (school_id, user_id, user_name, user_email, rating, title, content, verified_parent, created_at)
VALUES

('the-lighthouse-schools',
 gen_random_uuid(),
 'Ibrahim A.',
 'parent@example.com',
 5,
 'Life-changing experience for my son',
 'Sending my son to The Lighthouse Schools was the best decision our family ever made. He came in as a shy 6th grader and graduated as a confident, disciplined young man with strong Islamic character. The boarding environment means he is surrounded by brothers who push each other to be better — academically and spiritually. The teachers are dedicated and truly invested in each student. We are from out of state and the school made the transition seamless. Cannot recommend it highly enough.',
 true,
 NOW() - INTERVAL '60 days'),

('the-lighthouse-schools',
 gen_random_uuid(),
 'Mustafa K.',
 'parent2@example.com',
 5,
 'Brotherhood, discipline, and real academics',
 'My son has been at Lighthouse for two years and the growth we have seen is remarkable. The school lives up to its motto — Brotherhood, Discipline, Purpose. He wakes up for Fajr every day, his Arabic has improved dramatically, and his grades are strong. What sets this school apart is that the Islamic environment is not an afterthought — it is woven into every part of daily life. The staff truly care and communication with parents is excellent.',
 true,
 NOW() - INTERVAL '35 days'),

('the-lighthouse-schools',
 gen_random_uuid(),
 'Yusuf M.',
 'parent3@example.com',
 5,
 'Prepared my son for life, not just college',
 'Most schools prepare kids for college. Lighthouse prepares them for life. My son learned time management, responsibility, and how to lead with Islamic values. The boarding aspect was an adjustment at first but within weeks he thrived. He built friendships that will last a lifetime with brothers from across the country. The campus is well maintained and the staff go above and beyond. If you want your son to grow into a strong Muslim man, this is the school.',
 true,
 NOW() - INTERVAL '12 days');
