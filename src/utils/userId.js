export function getUserId() {
  try {
    const rawUserId = window?.localStorage?.getItem("userId");
    const id1 = rawUserId != null ? String(rawUserId).trim() : "";
    if (id1) return id1;

    // Fallback for newer auth flow: user is persisted as JSON by persistAuth()
    const rawUser = window?.localStorage?.getItem("user");
    const parsed = rawUser ? JSON.parse(rawUser) : null;
    const id2 = parsed && parsed._id ? String(parsed._id).trim() : "";
    return id2 || "demo-user-1";
  } catch {
    return "demo-user-1";
  }
}

