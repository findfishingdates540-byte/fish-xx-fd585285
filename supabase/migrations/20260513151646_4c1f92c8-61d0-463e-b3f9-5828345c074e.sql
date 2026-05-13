INSERT INTO public.app_settings (key, value, description)
VALUES ('platform_fee_percent', '{"percent": 10}'::jsonb, 'Platform fee percentage applied to cash-prize challenge pools')
ON CONFLICT (key) DO NOTHING;