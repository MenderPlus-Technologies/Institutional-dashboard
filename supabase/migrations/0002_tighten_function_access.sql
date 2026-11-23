-- Trigger and internal helpers should not be callable through the API.
revoke execute on function public.handle_new_user() from authenticated;
revoke execute on function public.protect_org_locked_fields() from authenticated;
revoke execute on function public.write_audit() from authenticated;
revoke execute on function public.on_cac_submitted() from authenticated;
revoke execute on function public.program_available(uuid) from authenticated;
alter function public.protect_profile_fields() set search_path = public;
revoke execute on function public.protect_profile_fields() from public, anon, authenticated;
