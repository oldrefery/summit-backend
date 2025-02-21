-- Enable RLS
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.sections;
DROP POLICY IF EXISTS "Enable insert access for authenticated users only" ON public.sections;
DROP POLICY IF EXISTS "Enable update access for users based on user_id" ON public.sections;
DROP POLICY IF EXISTS "Enable delete access for users based on user_id" ON public.sections;
DROP POLICY IF EXISTS "Deny access for anonymous users" ON public.sections;

-- Create trigger function for auto-filling user_id
CREATE OR REPLACE FUNCTION public.set_section_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS set_section_user_id ON public.sections;
CREATE TRIGGER set_section_user_id
  BEFORE INSERT ON public.sections
  FOR EACH ROW
  EXECUTE FUNCTION public.set_section_user_id();

-- Create policies
CREATE POLICY "Enable read access for authenticated users" ON public.sections
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for authenticated users only" ON public.sections
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for users based on user_id" ON public.sections
FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for users based on user_id" ON public.sections
FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Deny access for anonymous users
CREATE POLICY "Deny access for anonymous users" ON public.sections
FOR ALL TO anon USING (false); 