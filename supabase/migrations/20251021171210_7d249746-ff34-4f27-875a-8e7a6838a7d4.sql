-- Add missing RLS policies for techniciens table
CREATE POLICY "Users can insert their own technicians"
ON public.techniciens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own technicians"
ON public.techniciens
FOR DELETE
USING (auth.uid() = user_id);