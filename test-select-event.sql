-- Test if you can SELECT your event type with your user context

-- Set your user context
SET request.jwt.claim.sub = 'e2afcb8f-dd48-4da2-9e43-b987272229ce';

-- Try to select event types as this user
SELECT 
  id,
  title,
  duration,
  location_type,
  is_active,
  created_at
FROM event_types
WHERE user_id = 'e2afcb8f-dd48-4da2-9e43-b987272229ce';

-- This should return your event. If it doesn't, there's an RLS issue.
