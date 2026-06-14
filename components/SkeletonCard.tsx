import styles from "./SkeletonCard.module.css";

export default function SkeletonCard() {
  return (
    <div className={styles.card} aria-hidden="true">
      {/* Row 1: title + button circles */}
      <div className="flex items-start justify-between gap-3">
        <div className={`${styles.block} h-5 flex-1`} style={{ maxWidth: "65%" }} />
        <div className="flex items-center gap-2.5">
          <div className={styles.circle} style={{ width: 36, height: 36 }} />
          <div className={styles.circle} style={{ width: 40, height: 40 }} />
        </div>
      </div>

      {/* Row 2: stats + badge */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={`${styles.block} h-3.5`} style={{ width: 90 }} />
          <div className={`${styles.block} h-3.5`} style={{ width: 60 }} />
        </div>
        <div className={`${styles.block} h-5`} style={{ width: 76, borderRadius: 20 }} />
      </div>
    </div>
  );
}
