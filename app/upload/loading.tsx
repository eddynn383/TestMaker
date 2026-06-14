import styles from "@/components/SkeletonCard.module.css";

export default function UploadLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--tm-page)" }}>
      <div
        className="w-full max-w-md rounded-3xl p-8 space-y-6"
        style={{ background: "var(--tm-surface)", boxShadow: "var(--tm-shadow-card-lg)" }}
        aria-hidden="true"
      >
        <div>
          <div className={`${styles.block} h-7 mb-2`} style={{ width: "55%" }} />
          <div className={`${styles.block} h-4`} style={{ width: "75%" }} />
        </div>

        <div>
          <div className={`${styles.block} h-3.5 mb-2`} style={{ width: 80 }} />
          <div className={`${styles.block} h-11 w-full`} style={{ borderRadius: 12 }} />
        </div>

        <div>
          <div className={`${styles.block} h-3.5 mb-2`} style={{ width: 100 }} />
          <div className={`${styles.block} w-full`} style={{ height: 120, borderRadius: 14 }} />
        </div>

        <div className={`${styles.block} h-11 w-full`} style={{ borderRadius: 14 }} />
      </div>
    </div>
  );
}
