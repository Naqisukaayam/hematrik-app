export default function KondisiBadge({ kondisi }) {
  const cls = {
    NORMAL:     "badge normal",
    PEMBOROSAN: "badge pemborosan",
    PERINGATAN: "badge peringatan",
    AMAN:       "badge aman",
  };
  return (
    <span className={cls[kondisi] || "badge"}>
      {kondisi || "–"}
    </span>
  );
}