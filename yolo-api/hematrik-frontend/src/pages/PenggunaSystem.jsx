import { useEffect, useState } from "react";

const ROLE_COLORS = {
  Administrator: { bg: "#fee2e2", color: "#dc2626" },
  "Pelaksana Umum": { bg: "#dbeafe", color: "#2563eb" },
  Viewer: { bg: "#f3f4f6", color: "#374151" },
};

const ROLE_OPTIONS = ["Administrator", "Pelaksana Umum", "Viewer"];
const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const getAuthHeaders = () => {
  const token = window.localStorage.getItem("hematrix_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const buildDate = (value) => {
  if (!value) return "–";
  try {
    return new Date(value).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
};

const normalizeUser = (user) => ({
  ...user,
  loginTerakhir: user.last_login || user.loginTerakhir || "–",
  created_at: user.created_at || user.createdAt || user.dibuat || "",
});

export default function PenggunaSystem() {
  const [users, setUsers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ nama: "", email: "", role: "Viewer", password: "" });
  const [formError, setFormError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setFormError("");
    try {
      const res = await fetch(`${API}/auth/users`, {
        headers: getAuthHeaders(),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Response bukan JSON: ${text.slice(0, 200)}`);
      }
      if (!res.ok) throw new Error(data.detail || data.message || res.statusText);
      setUsers((data.users || []).map(normalizeUser));
    } catch (error) {
      setFormError(error.message || "Gagal memuat pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ nama: "", email: "", role: "Viewer", password: "" });
    setSelectedUser(null);
    setFormError("");
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.email || (!selectedUser && !form.password)) {
      setFormError("Nama, email, dan password wajib diisi.");
      return;
    }

    if (form.password && form.password.length < 6) {
      setFormError("Password minimal 6 karakter.");
      return;
    }

    setLoading(true);
    setFormError("");

    try {
      const payload = {
        nama: form.nama,
        email: form.email,
        role: form.role,
        ...(form.password ? { password: form.password } : {}),
      };

      const endpoint = selectedUser ? `/auth/users/${selectedUser.id}` : "/auth/register";
      const method = selectedUser ? "PUT" : "POST";

      const res = await fetch(`${API}${endpoint}`, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Response bukan JSON: ${text.slice(0, 200)}`);
      }
      if (!res.ok) throw new Error(data.detail || data.message || res.statusText);

      if (selectedUser) {
        setMessage("Pengguna berhasil diperbarui.");
      } else {
        setMessage("Pengguna baru berhasil ditambahkan.");
      }

      resetForm();
      setShowAdd(false);
      await loadUsers();
    } catch (error) {
      setFormError(error.message || "Gagal menyimpan pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setForm({ nama: user.nama, email: user.email, role: user.role || "Viewer", password: "" });
    setFormError("");
    setShowAdd(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Hapus pengguna ini?")) return;
    setLoading(true);
    setFormError("");
    try {
      const res = await fetch(`${API}/auth/users/${userId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error(`Response bukan JSON: ${text.slice(0, 200)}`);
      }
      if (!res.ok) throw new Error(data.detail || data.message || res.statusText);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setMessage("Pengguna berhasil dihapus.");
    } catch (error) {
      setFormError(error.message || "Gagal menghapus pengguna.");
    } finally {
      setLoading(false);
    }
  };

  const totalAdmin = users.filter((u) => u.role === "Administrator").length;
  const totalPelaksanaUmum = users.filter((u) => u.role === "Pelaksana Umum").length;
  const totalAktif = users.filter((u) => u.status === "Aktif").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {message && (
        <div style={{ padding: "12px 16px", background: "#dcfce7", color: "#166534", borderRadius: 10, border: "1px solid #bbf7d0" }}>
          {message}
        </div>
      )}
      {formError && (
        <div style={{ padding: "12px 16px", background: "#fee2e2", color: "#991b1b", borderRadius: 10, border: "1px solid #fecdd3" }}>
          {formError}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        {[
          { label: "Total Pengguna", value: users.length, iconBg: "#f3f4f6", iconColor: "#6b7280" },
          { label: "Administrator", value: totalAdmin, iconBg: "#fee2e2", iconColor: "#dc2626" },
          { label: "Pelaksana Umum", value: totalPelaksanaUmum, iconBg: "#dbeafe", iconColor: "#2563eb" },
          { label: "Pengguna Aktif", value: totalAktif, iconBg: "#dcfce7", iconColor: "#16a34a" },
        ].map(({ label, value, iconBg, iconColor }) => (
          <div key={label} style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "13px 16px", boxShadow: "0 1px 3px rgba(0,0,0,.05)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 9, background: iconBg, color: iconColor, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={18} /></div>
            <div>
              <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#111827", lineHeight: 1.2, marginTop: 2 }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", padding: "14px 18px", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>Informasi Role &amp; Hak Akses</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}>
          {[
            { role: "Administrator", color: "#dc2626", items: ["Akses penuh ke semua fitur", "Kelola pengguna sistem", "Ubah pengaturan sistem"] },
            { role: "Pelaksana Umum", color: "#2563eb", items: ["Monitoring dan pengecekan", "Kelola perangkat IoT", "Lihat riwayat dan grafik"] },
            { role: "Viewer", color: "#374151", items: ["Lihat dashboard", "Lihat riwayat", "Tidak bisa ubah apapun"] },
          ].map(({ role, color, items }) => (
            <div key={role}>
              <div style={{ fontSize: 13, fontWeight: 700, color, marginBottom: 7 }}>{role}</div>
              {items.map((item) => <div key={item} style={{ fontSize: 11, color: "#6b7280", marginBottom: 3 }}>• {item}</div>)}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: 11, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,.05)", overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Daftar Pengguna</h3>
          <button onClick={() => { setShowAdd((v) => !v); resetForm(); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            + Tambah Pengguna
          </button>
        </div>

        {showAdd && (
          <div style={{ padding: "12px 18px", borderBottom: "1px solid #f3f4f6", background: "#f9fafb", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            {[{ label: "Nama", key: "nama", type: "text" }, { label: "Email", key: "email", type: "email" }, { label: "Password", key: "password", type: "password" }].map(({ label, key, type }) => (
              <div key={key} style={{ flex: "1 1 150px" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</div>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontFamily: "inherit", outline: "none" }}
                />
              </div>
            ))}
            <div style={{ flex: "0 0 110px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Role</div>
              <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} style={{ width: "100%", padding: "7px 10px", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 7, flexGrow: 1, alignItems: "flex-end" }}>
              <button onClick={handleSubmit} disabled={loading} style={{ padding: "7px 14px", borderRadius: 7, border: "none", background: "#16a34a", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {selectedUser ? "Perbarui" : "Simpan"}
              </button>
              <button onClick={() => { setShowAdd(false); resetForm(); }} style={{ padding: "7px 12px", borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", color: "#374151", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Batal
              </button>
            </div>
            {selectedUser && (
              <div style={{ width: "100%", color: "#6b7280", fontSize: 11, marginTop: 8 }}>
                Biarkan password kosong untuk tetap menggunakan password saat ini.
              </div>
            )}
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f9fafb" }}>
                {["Pengguna", "Email", "Role", "Status", "Login Terakhir", "Dibuat", "Aksi"].map((th) => (
                  <th key={th} style={{ textAlign: "left", padding: "9px 14px", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".5px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" }}>{th}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const rc = ROLE_COLORS[u.role] || ROLE_COLORS.Viewer;
                return (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f3f4f6", transition: "background .1s" }} onMouseEnter={(e) => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f3f4f6", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><UserIcon size={15} /></div>
                        <span style={{ fontWeight: 600, color: "#111827" }}>{u.nama}</span>
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#6b7280" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        {u.email}
                      </div>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: rc.bg, color: rc.color }}>{u.role}</span>
                    </td>
                    <td style={{ padding: "11px 14px" }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: u.status === "Aktif" ? "#dcfce7" : "#f3f4f6", color: u.status === "Aktif" ? "#15803d" : "#6b7280" }}>{u.status || "Aktif"}</span>
                    </td>
                    <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 11, whiteSpace: "nowrap" }}>{u.loginTerakhir}</td>
                    <td style={{ padding: "11px 14px", color: "#6b7280", fontSize: 11, whiteSpace: "nowrap" }}>{buildDate(u.created_at)}</td>
                    <td style={{ padding: "11px 14px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => handleEdit(u)} style={{ background: "none", border: "none", cursor: "pointer", color: "#2563eb", padding: 3 }} title="Edit"><EditIcon /></button>
                        <button onClick={() => handleDelete(u.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 3 }} title="Hapus"><TrashIcon /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr><td colSpan={7} style={{ padding: "18px 14px", textAlign: "center", color: "#6b7280" }}>{loading ? "Memuat pengguna..." : "Belum ada pengguna."}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const UserIcon = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const EditIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const TrashIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;
