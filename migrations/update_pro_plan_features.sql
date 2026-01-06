-- Migration: Remove Custom Branding and Advanced Reminders from Pro Plan
-- Description: Update Pro plan features to remove custom_branding (move to Business only)
-- Date: December 28, 2024

-- Update Pro plan features
UPDATE subscription_plans
SET 
  features = '{"availability": "advanced", "reminders": true, "public_link": true, "analytics": true, "integrations": true, "custom_branding": false, "priority_support": false, "api_access": true}'::jsonb,
  updated_at = TIMEZONE('utc', NOW())
WHERE name = 'pro';

-- Verify Business plan still has custom branding
UPDATE subscription_plans
SET 
  features = '{"availability": "advanced", "reminders": true, "public_link": true, "analytics": true, "integrations": true, "custom_branding": true, "priority_support": true, "api_access": true}'::jsonb,
  updated_at = TIMEZONE('utc', NOW())
WHERE name = 'business';

-- Verify the update
SELECT 
  name,
  display_name,
  features->>'custom_branding' as has_custom_branding,
  features
FROM subscription_plans
ORDER BY 
  CASE 
    WHEN name = 'free' THEN 1
    WHEN name = 'pro' THEN 2
    WHEN name = 'business' THEN 3
  END;
