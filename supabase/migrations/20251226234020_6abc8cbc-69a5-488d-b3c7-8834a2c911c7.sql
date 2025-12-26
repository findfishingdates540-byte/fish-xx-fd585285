-- Create app_settings table for storing application-wide configurations
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (needed for maintenance mode check)
CREATE POLICY "Anyone can view app settings" 
ON public.app_settings 
FOR SELECT 
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update app settings" 
ON public.app_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert app settings" 
ON public.app_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.app_settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false}'::jsonb, 'Enable maintenance mode to temporarily disable the platform'),
  ('registration_enabled', '{"enabled": true}'::jsonb, 'Allow new users to sign up'),
  ('email_notifications', '{"enabled": true}'::jsonb, 'Send admin alerts via email'),
  ('report_alerts', '{"enabled": true}'::jsonb, 'Get notified when new reports are filed'),
  ('require_2fa', '{"enabled": false}'::jsonb, 'Require 2FA for admin accounts'),
  ('session_timeout', '{"enabled": true, "minutes": 30}'::jsonb, 'Auto-logout after period of inactivity');