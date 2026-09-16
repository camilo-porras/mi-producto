CREATE POLICY "Solo funciones internas administran clientes"
ON public.clientes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);