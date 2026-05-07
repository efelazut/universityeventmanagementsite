export function FollowButton({ status, disabled, onFollow, onUnfollow }) {
  const isFollowing = Boolean(status?.isFollowing);

  return (
    <button
      className={isFollowing ? "ghost-button follow-button is-following" : "primary-button follow-button"}
      type="button"
      disabled={disabled}
      onClick={isFollowing ? onUnfollow : onFollow}
    >
      {disabled ? "İşleniyor..." : isFollowing ? "Takipten Çık" : "Takip Et"}
      {typeof status?.followerCount === "number" ? <span>{status.followerCount} takipçi</span> : null}
    </button>
  );
}
