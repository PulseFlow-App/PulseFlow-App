export function isEmailUnconfirmed(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  return error.code === "email_not_confirmed" || /not confirmed/i.test(error.message ?? "");
}

export async function signOutIfUnconfirmed(supabase: {
  auth: {
    getUser(): Promise<{ data: { user: { email_confirmed_at?: string | null } | null } }>;
    signOut(): Promise<unknown>;
  };
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && !user.email_confirmed_at) {
    await supabase.auth.signOut();
    return true;
  }
  return false;
}

