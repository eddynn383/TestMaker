import styles from "@/components/SkeletonCard.module.css";

export default function UploadLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#e0e5ee" }}>
      <div
        className="w-full max-w-md rounded-3xl p-8 space-y-6"
        style={{ background: "#e0e5ee", boxShadow: "12px 12px 24px #b8c0cc, -12px -12px 24px #ffffff" }}
        aria-hidden="true"
      >
        {/* Header */}
        <div>
          <div className={`${styles.block} h-7 mb-2`} style={{ width: "55%" }} />
          <div className={`${styles.block} h-4`} style={{ width: "75%" }} />
        </div>

        {/* Step 1 — name input */}
        <div>
          <div className={`${styles.block} h-3.5 mb-2`} style={{ width: 80 }} />
          <div className={`${styles.block} h-11 w-full`} style={{ borderRadius: 12 }} />
        </div>

        {/* Step 2 — upload area */}
        <div>
          <div className={`${styles.block} h-3.5 mb-2`} style={{ width: 100 }} />
          <div
            className={`${styles.block} w-full`}
            style={{ height: 120, borderRadius: 14 }}
          />
        </div>

        {/* Button */}
        <div className={`${styles.block} h-11 w-full`} style={{ borderRadius: 14 }} />
      </div>
    </div>
  );
}
