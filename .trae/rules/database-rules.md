# Database Rules

## Tables

* users
* user_profiles
* work_entries
* pay_settings
* break_settings
* ai_uploads
* roles

## Rules

* Use proper relationships (foreign keys)
* Separate user and profile data
* Store authentication in Supabase Auth
* Keep schema scalable

## Work Entry

* user_id
* date
* start_time
* end_time
* total_hours
* break_time
* pay_rate
* weekend_pay_rate
* meal_allowance
* payable_hours
* total_pay

## Important

* break_time is deducted from working hours
* meal_allowance is extra money added to the final pay
* always link data to user_id
* never mix user data
