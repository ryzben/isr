-- Remove made-up placeholder details (fake "1234 Queens Blvd" address, "555" phone,
-- unverified tuition) from the Muslim Center School listing.
-- Run in Supabase SQL editor ONLY after AB approves. Real details will be added
-- after the Researcher verifies them on the school's own website.
update schools
set address = null, phone = null, tuition_range = null
where id = 'muslim-center-school'
  and (address like '1234 %' or phone like '%555-%');

-- Check: list any other rows that still look like placeholders.
select id, name, address, phone
from schools
where phone like '%555-%'
   or address ~ '^(1234|12345|2345|3456|4567|5678|6789|7890) ';
