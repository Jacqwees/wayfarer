-- Storage RLS for avatars bucket
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('covers', 'covers', true) on conflict do nothing;

create policy "avatars: public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "avatars: auth upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "avatars: own update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "avatars: own delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "covers: public read" on storage.objects for select using (bucket_id = 'covers');
create policy "covers: auth upload" on storage.objects for insert with check (bucket_id = 'covers' and auth.role() = 'authenticated');
create policy "covers: auth update" on storage.objects for update using (bucket_id = 'covers' and auth.role() = 'authenticated');
create policy "covers: auth delete" on storage.objects for delete using (bucket_id = 'covers' and auth.role() = 'authenticated');
