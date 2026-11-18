// src/vark.js
// Penyimpanan skor VARK bersama untuk semua sesi.
// Setiap sesi menyimpan nilai 0..1 (persentase) ke registry "varkScores".

export const VARK_INFO = {
  V: {
    nama: "VISUAL",
    desk: "Kamu mudah memahami lewat gambar, warna, simbol, dan diagram.",
    tips: "Buat peta konsep, beri warna pada catatan, dan pakai gambar saat belajar.",
  },
  A: {
    nama: "AUDITORY",
    desk: "Kamu mudah memahami lewat mendengarkan penjelasan dan berdiskusi.",
    tips: "Dengarkan penjelasan, diskusi dengan teman, dan baca materi dengan suara keras.",
  },
  R: {
    nama: "READ / WRITE",
    desk: "Kamu mudah memahami lewat membaca teks dan menulis ulang.",
    tips: "Buat ringkasan, catatan poin-poin, dan baca buku atau artikel.",
  },
  K: {
    nama: "KINESTETIK",
    desk: "Kamu mudah memahami lewat praktik langsung dan bergerak.",
    tips: "Belajar sambil praktik, coba simulasi, dan buat proyek nyata.",
  },
};

export function resetVark(scene) {
  scene.registry.set("varkScores", { V: null, A: null, R: null, K: null });
}

export function setVark(scene, key, value) {
  const v = Object.assign({ V: null, A: null, R: null, K: null }, scene.registry.get("varkScores") || {});
  v[key] = Math.max(0, Math.min(1, value));
  scene.registry.set("varkScores", v);
}

export function getVark(scene) {
  return Object.assign({ V: null, A: null, R: null, K: null }, scene.registry.get("varkScores") || {});
}
