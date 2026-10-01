const allowedProfileHosts: Record<string, string[]> = {
  instagram: ["instagram.com"],
  facebook: ["facebook.com"],
  youtube: ["youtube.com", "youtu.be"],
  linkedin: ["linkedin.com"],
  tiktok: ["tiktok.com"],
  x: ["x.com", "twitter.com"],
};

export function isValidSocialProfileUrl(
  platform: string,
  value: string,
): boolean {
  if (!value.trim()) return true;
  const allowedHosts = allowedProfileHosts[platform];
  if (!allowedHosts) return false;

  try {
    const url = new URL(value.trim());
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      allowedHosts.some(
        (host) => url.hostname === host || url.hostname.endsWith(`.${host}`),
      )
    );
  } catch {
    return false;
  }
}