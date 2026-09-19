type PrivyAccount = {
  type?: string;
  address?: string | null;
  email?: string | null;
  name?: string | null;
  username?: string | null;
  phoneNumber?: string | null;
  number?: string | null;
};

type PrivyUserLike = {
  id?: string | null;
  email?: string | { address?: string | null } | null;
  phone?: string | { number?: string | null } | null;
  linked_accounts?: PrivyAccount[] | null;
  linkedAccounts?: PrivyAccount[] | null;
} | null | undefined;

function accountsOf(user: PrivyUserLike) {
  return user?.linked_accounts ?? user?.linkedAccounts ?? [];
}

export function getPrivyUserId(user: PrivyUserLike) {
  return user?.id ?? null;
}

export function getPrivyEmail(user: PrivyUserLike) {
  if (!user) {
    return undefined;
  }

  if (typeof user.email === 'string' && user.email.length > 0) {
    return user.email;
  }

  if (user.email && typeof user.email === 'object' && user.email.address) {
    return user.email.address;
  }

  const emailAccount = accountsOf(user).find(
    (account) =>
      account.type === 'email' ||
      account.type === 'email_address' ||
      account.type === 'google_oauth',
  );

  return emailAccount?.address ?? emailAccount?.email ?? undefined;
}

export function getPrivyPhone(user: PrivyUserLike) {
  if (!user) {
    return undefined;
  }

  if (typeof user.phone === 'string' && user.phone.length > 0) {
    return user.phone;
  }

  if (user.phone && typeof user.phone === 'object' && user.phone.number) {
    return user.phone.number;
  }

  const phoneAccount = accountsOf(user).find(
    (account) => account.type === 'phone' || account.type === 'phone_number',
  );

  return phoneAccount?.phoneNumber ?? phoneAccount?.number ?? phoneAccount?.address ?? undefined;
}

export function getPrivyDisplayName(user: PrivyUserLike) {
  const email = getPrivyEmail(user);
  if (email) {
    return email;
  }

  const phone = getPrivyPhone(user);
  if (phone) {
    return phone;
  }

  const social = accountsOf(user).find(
    (account) => account.type === 'google_oauth' || account.type === 'twitter_oauth',
  );

  return social?.name ?? social?.username ?? getPrivyUserId(user) ?? undefined;
}
