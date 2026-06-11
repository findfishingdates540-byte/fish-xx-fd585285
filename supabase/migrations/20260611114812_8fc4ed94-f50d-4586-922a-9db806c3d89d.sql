ALTER TABLE public.catches DISABLE TRIGGER USER;
UPDATE public.catches SET approval_status = 'approved' WHERE id = '35605532-6504-4e22-9f68-0d2a6bcc9249';
ALTER TABLE public.catches ENABLE TRIGGER USER;