
-- Listing images: authenticated upload to own folder, anyone can read (signed URLs)
CREATE POLICY "Anyone can read listing images" ON storage.objects FOR SELECT USING (bucket_id = 'listings');
CREATE POLICY "Users upload own listing images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own listing images" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- KYC docs
CREATE POLICY "Users upload own kyc" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kyc' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own kyc" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'kyc' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
