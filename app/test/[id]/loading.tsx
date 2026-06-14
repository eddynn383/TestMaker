import styles from "@/components/SkeletonCard.module.css";

export default function TestLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--tm-page)" }}>
      <div
        className="w-full max-w-sm rounded-3xl p-8"
        style={{ background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card-lg)" }}
        aria-hidden="true"
      >
        <div className="mb-6">
          <div className={`${styles.block} h-4 mb-2`} style={{ width: "45%" }} />
          <div className={`${styles.block} h-7`} style={{ width: "85%" }} />
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className={`${styles.block} h-4`} style={{ width: 90 }} />
          <div className={`${styles.block} h-4`} style={{ width: 70 }} />
        </div>

        <div className={`${styles.block} h-3.5 mb-3`} style={{ width: 100 }} />

        <div
          className="rounded-2xl p-4 mb-6 flex items-center justify-center gap-6"
          style={{ boxShadow: "var(--tm-shadow-inset)" }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className={styles.circle} style={{ width: 32, height: 32 }} />
            <div className={`${styles.block} h-10`} style={{ width: 56, borderRadius: 12 }} />
            <div className={styles.circle} style={{ width: 32, height: 32 }} />
          </div>
          <div className={`${styles.block} h-8`} style={{ width: 8, borderRadius: 4 }} />
          <div className="flex flex-col items-center gap-2">
            <div className={styles.circle} style={{ width: 32, height: 32 }} />
            <div className={`${styles.block} h-10`} style={{ width: 56, borderRadius: 12 }} />
            <div className={styles.circle} style={{ width: 32, height: 32 }} />
          </div>
        </div>

        <div className={`${styles.block} h-12 w-full`} style={{ borderRadius: 14 }} />
      </div>
    </div>
  );
}
