-- Politique pour permettre la création d'utilisateurs par tout le monde (anonyme)
CREATE POLICY "Allow anonymous user creation" ON public.users
    FOR INSERT WITH CHECK (true);

-- Politique pour permettre la lecture des utilisateurs par tout le monde (nécessaire pour la vérification)
CREATE POLICY "Allow anonymous user read" ON public.users
    FOR SELECT USING (true);

-- Politique pour permettre la mise à jour du profil par l'utilisateur lui-même
CREATE POLICY "Allow users to update own profile" ON public.users
    FOR UPDATE USING (auth.uid()::text = id);

-- Accorder les permissions nécessaires
GRANT INSERT ON public.users TO anon;
GRANT SELECT ON public.users TO anon;
GRANT UPDATE ON public.users TO authenticated;
GRANT ALL ON public.users TO authenticated;