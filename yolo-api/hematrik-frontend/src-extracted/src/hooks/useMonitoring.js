import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import axios from "axios";

export const API = "http://127.0.0.1:8000";
export const AUTO_CEK_INTERVAL = 2 * 60; // 2 menit dalam detik

export function useMonitoring() {
  const [data,      setData]      = useState({});
  const [status,    setStatus]    = useState({});
  const [history,   setHistory]   = useState([]);
  const [listrikH,  setListrikH]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [lastCek,   setLastCek]   = useState(null);
  const [curImg,    setCurImg]    = useState(null);
  const [error,     setError]     = useState(null);
  const [countdown, setCountdown] = useState(AUTO_CEK_INTERVAL);
  const [autoMode,  setAutoMode]  = useState(true);
  const loadingRef = useRef(false);

  // ── Summary dihitung LANGSUNG dari history (konsisten dengan halaman Riwayat) ──
  const summary = useMemo(() => {
    const total      = history.length;
    const normal     = history.filter(h => h.kondisi === "NORMAL").length;
    const peringatan = history.filter(h => h.kondisi === "PERINGATAN").length;
    const pemborosan = history.filter(h => h.kondisi === "PEMBOROSAN").length;
    const aman       = history.filter(h => h.kondisi === "AMAN").length;
    return { total, normal, peringatan, pemborosan, aman };
  }, [history]);

  // ── Load history + listrik history ──────────────────────────
  const loadHistory = useCallback(async () => {
    try {
      const [h, lh] = await Promise.all([
        axios.get(`${API}/history`),
        axios.get(`${API}/listrik/history`),
      ]);
      setHistory(Array.isArray(h.data) ? h.data : []);
      setListrikH(Array.isArray(lh.data) ? lh.data : []);
      setError(null);
    } catch (e) {
      setError("Tidak bisa terhubung ke backend. Pastikan FastAPI berjalan.");
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Poll /status setiap 5 detik ─────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await axios.get(`${API}/status`, { timeout: 4000 });
        setStatus(r.data || {});
        setError(null);
      } catch {}
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, []);

  // ── Fungsi CEK SEKARANG ─────────────────────────────────────
  const doCheck = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const r = await axios.get(`${API}/check`, { timeout: 30000 });
      const d = r.data || {};
      setData(d);
      setLastCek(new Date());
      if (d.gambar_b64)       setCurImg(d.gambar_b64);
      else if (d.gambar_url)  setCurImg(d.gambar_url);
      await loadHistory();
    } catch (e) {
      setError("Gagal menghubungi backend: " + (e.message || "timeout"));
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [loadHistory]);

  // ── Handler tombol manual ───────────────────────────────────
  const handleCek = useCallback(async () => {
    await doCheck();
    setCountdown(AUTO_CEK_INTERVAL);
  }, [doCheck]);

  // ── Auto CEK setiap 2 menit ─────────────────────────────────
  useEffect(() => {
    if (!autoMode) return;
    doCheck();
    const t = setInterval(() => {
      doCheck();
      setCountdown(AUTO_CEK_INTERVAL);
    }, AUTO_CEK_INTERVAL * 1000);
    return () => clearInterval(t);
  }, [autoMode, doCheck]);

  // ── Countdown timer ─────────────────────────────────────────
  useEffect(() => {
    if (!autoMode) { setCountdown(AUTO_CEK_INTERVAL); return; }
    setCountdown(AUTO_CEK_INTERVAL);
    const t = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? AUTO_CEK_INTERVAL : prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [lastCek, autoMode]);

  return {
    data, status, history, summary, listrikH,
    loading, lastCek, curImg, error,
    countdown, autoMode, setAutoMode,
    handleCek, loadHistory,
  };
}