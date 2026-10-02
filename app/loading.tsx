export default function Loading() {
  return (
    <div
      className="skeleton-page"
      role="status"
      aria-label="Loading maintenance records"
    >
      <div className="skeleton skeleton-title" />
      <div className="skeleton" />
      <div className="skeleton-row">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}
