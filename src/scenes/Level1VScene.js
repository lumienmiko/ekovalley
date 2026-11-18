// src/scenes/Level1VScene.js
// =====================================================================
// LEVEL 1 : VISUAL — Pilah Sampah (drag & drop)
//  1. Materi bergambar  : kenali 3 tempat sampah + berapa lama sampah terurai
//  2. Permainan         : seret sampah ke tong yang tepat (Organik / Anorganik / B3)
//  3. Hasil             : bintang, nilai, lanjut ke Sesi Auditory
// Tidak ada suara narasi — sesi ini fokus pada gambar, warna, dan simbol.
// =====================================================================
import Phaser from "phaser";
import SoundFX from "../audio/SoundFX.js";
import { DW, DH, COL, PAL, css, makeText, drawWood, drawPanel, createButton, setupResponsive, coverScale, burst, floatText, spawnLeaves, makeStar } from "../ui/PixelUI.js";
import { ensureIcons } from "../ui/PixelIcons.js";
import { setVark } from "../vark.js";

// Tiga tempat sampah (warna sama dengan materi di Sesi Auditory)
const BINS = [
  { id: "organik", label: "ORGANIK", warna: "HIJAU", color: 0x5bbd64, light: 0x8fdc8a, dark: 0x3f7a2f, icon: "ico_daun", ket: "Mudah membusuk" },
  { id: "anorganik", label: "ANORGANIK", warna: "KUNING", color: 0xf2c230, light: 0xffe27a, dark: 0xb88a16, icon: "ico_botol", ket: "Plastik, kaleng" },
  { id: "b3", label: "B3", warna: "MERAH", color: 0xd9503f, light: 0xf0806a, dark: 0x9c3326, icon: null, ket: "Berbahaya & beracun" },
];

// Sampah yang dipilah. Ubah / tambah di sini (icon = nama di PixelIcons.js).
const ITEMS = [
  { icon: "daun", nama: "DAUN KERING", pendek: "DAUN", bin: "organik" },
  { icon: "apel", nama: "SISA APEL", pendek: "APEL", bin: "organik" },
  { icon: "wortel", nama: "SISA SAYUR", pendek: "SAYUR", bin: "organik" },
  { icon: "pisang", nama: "KULIT PISANG", pendek: "PISANG", bin: "organik" },
  { icon: "botol", nama: "BOTOL PLASTIK", pendek: "BOTOL", bin: "anorganik" },
  { icon: "kantong", nama: "KANTONG PLASTIK", pendek: "KANTONG", bin: "anorganik" },
  { icon: "kaleng", nama: "KALENG MINUMAN", pendek: "KALENG", bin: "anorganik" },
  { icon: "gelas", nama: "GELAS PLASTIK", pendek: "GELAS", bin: "anorganik" },
  { icon: "baterai", nama: "BATERAI BEKAS", pendek: "BATERAI", bin: "b3" },
  { icon: "bohlam", nama: "LAMPU BEKAS", pendek: "LAMPU", bin: "b3" },
  { icon: "semprot", nama: "KALENG SEMPROT", pendek: "SEMPROT", bin: "b3" },
  { icon: "obat", nama: "OBAT KEDALUWARSA", pendek: "OBAT", bin: "b3" },
];

// Materi bergambar "berapa lama terurai" (panjang batang = lama terurai)
const URAI = [
  { icon: "daun", nama: "DAUN", lama: "BEBERAPA MINGGU", bar: 30, color: 0x6fb04a },
  { icon: "kaleng", nama: "KALENG", lama: "± 200 TAHUN", bar: 260, color: 0xf2c230 },
  { icon: "botol", nama: "BOTOL PLASTIK", lama: "± 450 TAHUN", bar: 540, color: 0xd9503f },
];

const SLIDES = ["KENALI 3 TEMPAT SAMPAH", "BERAPA LAMA SAMPAH TERURAI?"];

const TRAY = { x: DW / 2, y: 200 };
const BIN_Y = 560; // posisi dasar tong
const BIN_W = 170;
const BIN_H = 150;
const BIN_X = [200, DW / 2, DW - 200];
const ICON_SCALE = 5;

export default class Level1VScene extends Phaser.Scene {
  constructor() {
    super("Level1VScene");
  }

  create() {
    this._pxTexts = [];
    this._textRes = 0;

    this.sound.stopAll();
    SoundFX.unlock();
    SoundFX.stopTheme();
    SoundFX.setEnabled(this.registry.get("audioEnabled") !== false);
    SoundFX.cancelSpeech();
    SoundFX.stopCue();

    ensureIcons(this);

    this.state = "materi";
    this.slide = 0;
    this.leaving = false;

    this.buildBackdrop();
    this.layer = this.add.container(0, 0).setDepth(10);
    this.loose = []; // objek di luar layer (sampah yang diseret) untuk dibersihkan
    setupResponsive(this, () => {
      if (this.bg) coverScale(this.bg, this._viewW, this._viewH);
    });

    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.input.on("dragstart", (p, obj) => this.onDragStart(obj));
    this.input.on("drag", (p, obj, x, y) => this.onDrag(obj, x, y));
    this.input.on("dragend", (p, obj) => this.onDragEnd(obj));

    this.keyHandler = (e) => this.onKey(e);
    if (this.input.keyboard) this.input.keyboard.on("keydown", this.keyHandler);

    this.events.once("shutdown", () => {
      if (this.input.keyboard) this.input.keyboard.off("keydown", this.keyHandler);
    });

    this.showSlide(0);
  }

  buildBackdrop() {
    if (this.textures.exists("menu_bg")) {
      this.bg = this.add.image(DW / 2, DH / 2, "menu_bg").setDepth(0);
      this.add.rectangle(DW / 2, DH / 2, 6000, 6000, 0x0b2418, 0.55).setDepth(1);
    } else {
      this.add.rectangle(DW / 2, DH / 2, 6000, 6000, 0x1c3a2a).setDepth(0);
    }
    spawnLeaves(this, 8, 2);
  }

  clearLayer() {
    this.layer.removeAll(true);
    this.loose.forEach((o) => o && o.destroy());
    this.loose = [];
  }

  // ---------------------------------------------------------------
  // Gambar tong sampah. (x, y) = titik tengah bawah tong.
  // ---------------------------------------------------------------
  drawBin(x, y, bin, w, h, withLabel = true) {
    const L = this.layer;
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    c.add(g);

    g.fillStyle(0x000000, 0.3);
    g.fillEllipse(0, 4, w + 20, 16);

    // Badan
    g.fillStyle(COL.outline, 1);
    g.fillRect(-w / 2, -h, w, h);
    g.fillStyle(bin.color, 1);
    g.fillRect(-w / 2 + 4, -h + 4, w - 8, h - 8);
    g.fillStyle(bin.light, 1);
    g.fillRect(-w / 2 + 4, -h + 4, w - 8, 6);
    g.fillStyle(bin.dark, 1);
    g.fillRect(-w / 2 + 4, -14, w - 8, 10);
    for (let k = -w / 2 + 18; k < w / 2 - 12; k += 22) g.fillRect(k, -h + 16, 4, h - 34);

    // Tutup
    g.fillStyle(COL.outline, 1);
    g.fillRect(-w / 2 - 10, -h - 20, w + 20, 24);
    g.fillRect(-18, -h - 30, 36, 14);
    g.fillStyle(bin.dark, 1);
    g.fillRect(-w / 2 - 6, -h - 16, w + 12, 16);
    g.fillRect(-14, -h - 26, 28, 8);

    // Plat simbol
    const ps = Math.min(64, w * 0.45);
    const py = -h / 2 - 4;
    g.fillStyle(COL.outline, 1);
    g.fillRect(-ps / 2 - 4, py - ps / 2 - 4, ps + 8, ps + 8);
    g.fillStyle(PAL.parch.base, 1);
    g.fillRect(-ps / 2, py - ps / 2, ps, ps);

    if (bin.icon) {
      const ic = this.add.image(0, py, bin.icon).setScale((ps - 8) / 16);
      c.add(ic);
    } else {
      // Simbol bahaya (segitiga + tanda seru) untuk B3
      const s = ps - 14;
      g.fillStyle(COL.outline, 1);
      g.fillTriangle(0, py - s / 2 - 4, -s / 2 - 5, py + s / 2 + 2, s / 2 + 5, py + s / 2 + 2);
      g.fillStyle(COL.gold, 1);
      g.fillTriangle(0, py - s / 2 + 3, -s / 2 + 1, py + s / 2 - 2, s / 2 - 1, py + s / 2 - 2);
      g.fillStyle(COL.outline, 1);
      g.fillRect(-3, py - s / 4, 6, s / 3);
      g.fillRect(-3, py + s / 4 - 2, 6, 6);
    }

    if (withLabel) {
      c.add(makeText(this, 0, -h - 46, bin.label, { size: w > 140 ? 12 : 10, color: css(bin.light), stroke: css(COL.outline), strokeW: 5 }));
    }

    L.add(c);
    return c;
  }

  // ---------------------------------------------------------------
  // MATERI BERGAMBAR
  // ---------------------------------------------------------------
  showSlide(i) {
    this.state = "materi";
    this.slide = i;
    this.clearLayer();
    const L = this.layer;

    const g = this.add.graphics();
    drawPanel(g, 30, 22, DW - 60, 556);
    L.add(g);

    L.add(makeText(this, DW / 2, 52, "SESI 1 : VISUAL", { size: 9, color: css(COL.leafLight), stroke: css(COL.outline), strokeW: 4 }));
    L.add(makeText(this, DW / 2, 82, SLIDES[i], { size: 18, color: css(COL.gold), stroke: css(COL.outline), strokeW: 7 }));

    // Titik halaman
    SLIDES.forEach((_, k) => {
      const d = this.add.rectangle(DW / 2 + (k - (SLIDES.length - 1) / 2) * 24, 112, 14, 14, k < i ? COL.leaf : k === i ? COL.gold : 0x3a2a1a).setStrokeStyle(2, COL.outline);
      L.add(d);
    });

    if (i === 0) this.slideBins();
    else this.slideUrai();

    const prev = createButton(this, DW / 2 - 150, 536, 240, 46, "SEBELUMNYA", { size: 10, onClick: () => this.prevSlide() });
    const last = i === SLIDES.length - 1;
    const next = createButton(this, DW / 2 + 150, 536, 240, 46, last ? "MULAI MAIN!" : "LANJUT", {
      size: 11,
      palN: PAL.woodHover,
      palH: PAL.wood,
      onClick: () => this.nextSlide(),
    });
    if (i === 0) {
      prev.setVisible(false);
      next.container.x = DW / 2;
    }
    if (last) this.tweens.add({ targets: next.container, scaleX: 1.05, scaleY: 1.05, duration: 600, yoyo: true, repeat: -1 });
    L.add([prev.container, next.container]);
  }

  slideBins() {
    const L = this.layer;
    BINS.forEach((bin, b) => {
      const x = BIN_X[b];
      this.drawBin(x, 290, bin, 120, 110, false);

      L.add(makeText(this, x, 316, `${bin.warna} = ${bin.label}`, { size: 10, color: css(bin.light), stroke: css(COL.outline), strokeW: 5 }));
      L.add(makeText(this, x, 338, bin.ket, { size: 7, color: css(COL.cream) }));

      // Contoh sampah
      const items = ITEMS.filter((it) => it.bin === bin.id);
      const step = 62;
      items.forEach((it, k) => {
        const ix = x + (k - (items.length - 1) / 2) * step;
        const box = this.add.graphics();
        drawWood(box, ix - 27, 360, 54, 54, PAL.parch, { outline: 3, grain: false });
        L.add(box);
        const img = this.add.image(ix, 387, "ico_" + it.icon).setScale(2.6);
        L.add(img);
        L.add(makeText(this, ix, 428, it.pendek, { size: 7, color: css(COL.cream), stroke: css(COL.outline), strokeW: 3 }));
        this.tweens.add({ targets: img, y: 383, duration: 700 + k * 120, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      });

      // Panah dari contoh ke tong
      const ag = this.add.graphics();
      ag.fillStyle(COL.cream, 0.9);
      ag.fillTriangle(x - 10, 352, x + 10, 352, x, 344);
      L.add(ag);
    });

    L.add(makeText(this, DW / 2, 470, "Perhatikan WARNA dan SIMBOL tiap tong.\nSampah yang sejenis masuk ke tong yang sama!", { size: 9, color: css(COL.cream), spacing: 8, stroke: css(COL.outline), strokeW: 3 }));
  }

  slideUrai() {
    const L = this.layer;
    const x0 = 230;

    URAI.forEach((u, k) => {
      const y = 180 + k * 92;

      const box = this.add.graphics();
      drawWood(box, 92, y - 36, 72, 72, PAL.parch, { outline: 3, grain: false });
      L.add(box);
      L.add(this.add.image(128, y, "ico_" + u.icon).setScale(3.6));

      L.add(makeText(this, x0, y - 22, `${u.nama} : ${u.lama}`, { size: 9, color: css(COL.cream), origin: [0, 0.5], stroke: css(COL.outline), strokeW: 4 }));

      // Batang (tumbuh perlahan)
      const track = this.add.graphics();
      track.fillStyle(COL.outline, 1);
      track.fillRect(x0 - 4, y - 4, 560 + 8, 32);
      track.fillStyle(0x1d3322, 1);
      track.fillRect(x0, y, 560, 24);
      L.add(track);

      const bar = this.add.graphics();
      L.add(bar);
      const prog = { v: 0 };
      this.tweens.add({
        targets: prog,
        v: 1,
        duration: 600 + u.bar * 3,
        delay: 300 + k * 400,
        ease: "Sine.easeOut",
        onUpdate: () => {
          bar.clear();
          const w = Math.max(6, Math.floor((u.bar * prog.v) / 6) * 6);
          bar.fillStyle(u.color, 1);
          bar.fillRect(x0, y, w, 24);
          bar.fillStyle(0xffffff, 0.25);
          bar.fillRect(x0, y, w, 5);
        },
      });
    });

    // Skala waktu
    L.add(makeText(this, x0, 448, "SEBENTAR", { size: 7, color: css(COL.leafLight), origin: [0, 0.5] }));
    L.add(makeText(this, x0 + 560, 448, "SANGAT LAMA", { size: 7, color: "#ff9a80", origin: [1, 0.5] }));
    const ag = this.add.graphics();
    ag.fillStyle(COL.cream, 0.8);
    ag.fillRect(x0 + 90, 446, 330, 4);
    ag.fillTriangle(x0 + 420, 440, x0 + 420, 456, x0 + 434, 448);
    L.add(ag);

    L.add(makeText(this, DW / 2, 484, "Semakin panjang batangnya, semakin lama sampah mencemari alam.\nPlastik bisa bertahan RATUSAN TAHUN — maka pilah sampahmu!", { size: 8, color: css(COL.cream), spacing: 8, stroke: css(COL.outline), strokeW: 3 }));
  }

  prevSlide() {
    if (this.slide > 0) this.showSlide(this.slide - 1);
  }

  nextSlide() {
    if (this.slide + 1 < SLIDES.length) this.showSlide(this.slide + 1);
    else this.startGame();
  }

  // ---------------------------------------------------------------
  // PERMAINAN DRAG & DROP
  // ---------------------------------------------------------------
  startGame() {
    this.state = "game";
    this.clearLayer();
    const L = this.layer;

    this.queue = Phaser.Utils.Array.Shuffle(ITEMS.slice());
    this.itemIndex = 0;
    this.score = 0;
    this.mistakes = 0;

    L.add(makeText(this, 24, 24, "SESI 1 : VISUAL", { size: 10, color: css(COL.gold), origin: [0, 0.5], stroke: css(COL.outline), strokeW: 4 }));
    this.scoreText = makeText(this, 24, 48, "BENAR: 0", { size: 9, origin: [0, 0.5], stroke: css(COL.outline), strokeW: 3 });
    L.add(this.scoreText);

    this.pips = [];
    const n = this.queue.length;
    for (let i = 0; i < n; i++) {
      const r = this.add.rectangle(DW - 24 - (n - 1 - i) * 20, 30, 12, 12, 0x3a2a1a).setStrokeStyle(2, COL.outline);
      L.add(r);
      this.pips.push(r);
    }

    // Pita perintah
    const rg = this.add.graphics();
    drawWood(rg, DW / 2 - 250, 66, 500, 36, PAL.wood, { grain: false });
    L.add(rg);
    L.add(makeText(this, DW / 2, 84, "SERET SAMPAH KE TONG YANG TEPAT!", { size: 10, color: css(COL.cream), stroke: css(COL.outline), strokeW: 4 }));

    // Nampan tempat sampah muncul
    const tg = this.add.graphics();
    drawWood(tg, TRAY.x - 110, TRAY.y - 80, 220, 160, PAL.parch, { grain: false });
    L.add(tg);
    this.nameText = makeText(this, TRAY.x, TRAY.y + 60, "", { size: 9, color: "#8a5a30" });
    L.add(this.nameText);

    // Miko & umpan balik
    if (this.textures.exists("player_sheet")) {
      L.add(this.add.ellipse(110, 290, 60, 12, 0x000000, 0.3));
      this.miko = this.add.sprite(110, 290, "player_sheet", 1).setOrigin(0.5, 1).setScale(2.4);
      L.add(this.miko);
      L.add(makeText(this, 110, 306, "MIKO", { size: 8, color: css(COL.gold), stroke: css(COL.outline), strokeW: 4 }));
    }
    this.feedback = makeText(this, TRAY.x, 312, "", { size: 9, color: css(COL.cream), stroke: css(COL.outline), strokeW: 4, wrap: 520 });
    L.add(this.feedback);

    // Tong
    this.bins = BINS.map((bin, b) => {
      const x = BIN_X[b];
      const glow = this.add.rectangle(x, BIN_Y - BIN_H / 2 - 12, BIN_W + 34, BIN_H + 44).setStrokeStyle(5, COL.gold).setFillStyle(COL.gold, 0.12).setAlpha(0);
      L.add(glow);
      const cont = this.drawBin(x, BIN_Y, bin, BIN_W, BIN_H);
      L.add(makeText(this, x, BIN_Y + 24, `[${b + 1}]`, { size: 7, color: css(COL.cream) }).setAlpha(0.6));
      return { ...bin, x, cont, glow, hint: null };
    });

    this.spawnItem();
  }

  updatePips() {
    this.pips.forEach((p, i) => p.setFillStyle(i < this.itemIndex ? COL.leaf : i === this.itemIndex ? COL.gold : 0x3a2a1a));
  }

  spawnItem() {
    this.updatePips();
    const it = this.queue[this.itemIndex];
    this.current = { data: it, tries: 0 };

    const img = this.add.image(TRAY.x, TRAY.y - 6, "ico_" + it.icon).setScale(0).setDepth(60);
    img.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(img);
    this.loose.push(img);
    this.current.img = img;

    this.nameText.setText(it.nama);
    this.tweens.add({ targets: img, scale: ICON_SCALE, duration: 260, ease: "Back.easeOut" });
    this.bins.forEach((b) => this.setHint(b, false));
  }

  binAt(x, y) {
    return this.bins.find((b) => Math.abs(x - b.x) < BIN_W / 2 + 20 && y > BIN_Y - BIN_H - 70 && y < BIN_Y + 20) || null;
  }

  onDragStart(obj) {
    if (this.state !== "game" || !this.current || obj !== this.current.img) return;
    this.tweens.killTweensOf(obj);
    obj.setScale(ICON_SCALE * 1.15);
    SoundFX.hover();
  }

  onDrag(obj, x, y) {
    if (this.state !== "game" || !this.current || obj !== this.current.img) return;
    obj.x = x;
    obj.y = y;
    const over = this.binAt(x, y);
    this.bins.forEach((b) => {
      if (!b.hint) b.glow.setAlpha(b === over ? 1 : 0);
    });
  }

  onDragEnd(obj) {
    if (this.state !== "game" || !this.current || obj !== this.current.img) return;
    const bin = this.binAt(obj.x, obj.y);
    this.bins.forEach((b) => {
      if (!b.hint) b.glow.setAlpha(0);
    });
    if (!bin) {
      this.returnToTray(obj);
      return;
    }
    this.dropInto(bin);
  }

  returnToTray(obj) {
    this.tweens.add({ targets: obj, x: TRAY.x, y: TRAY.y - 6, scale: ICON_SCALE, duration: 220, ease: "Back.easeOut" });
  }

  dropInto(bin) {
    const cur = this.current;
    if (!cur || cur.busy) return;
    const it = cur.data;
    const img = cur.img;

    if (bin.id === it.bin) {
      cur.busy = true;
      img.disableInteractive();
      const first = cur.tries === 0;
      if (first) this.score++;
      this.scoreText.setText(`BENAR: ${this.score}`);

      SoundFX.correct();
      this.tweens.add({
        targets: img,
        x: bin.x,
        y: BIN_Y - BIN_H - 10,
        scale: 0.4,
        angle: 200,
        duration: 320,
        ease: "Quad.easeIn",
        onComplete: () => {
          img.destroy();
          burst(this, bin.x, BIN_Y - BIN_H, { count: 16, colors: [bin.light, COL.gold, COL.cream], depth: 80 });
          this.tweens.add({ targets: bin.cont, scaleY: 0.92, duration: 80, yoyo: true });
        },
      });
      floatText(this, bin.x, BIN_Y - BIN_H - 60, first ? "+1" : "OK", css(COL.gold), 14);
      this.feedback.setColor(css(COL.leafLight));
      this.feedback.setText(`BENAR! ${it.nama} MASUK TONG ${bin.warna} (${bin.label}).`);
      if (this.miko) this.tweens.add({ targets: this.miko, y: 280, duration: 120, yoyo: true, repeat: 1 });

      this.time.delayedCall(750, () => {
        this.itemIndex++;
        if (this.itemIndex >= this.queue.length) this.showResults();
        else this.spawnItem();
      });
    } else {
      cur.tries++;
      this.mistakes++;
      SoundFX.wrong();
      this.tweens.add({ targets: bin.cont, x: bin.x + 8, duration: 50, yoyo: true, repeat: 3, onComplete: () => (bin.cont.x = bin.x) });
      floatText(this, bin.x, BIN_Y - BIN_H - 60, "BUKAN DI SINI!", "#ff9a80", 10);
      this.feedback.setColor("#ffb199");
      this.feedback.setText("Belum tepat. Lihat lagi WARNA dan SIMBOL tongnya!");
      this.returnToTray(img);

      // Setelah 2 kali salah, tong yang benar diberi tanda
      if (cur.tries >= 2) {
        const right = this.bins.find((b) => b.id === it.bin);
        this.setHint(right, true);
      }
    }
  }

  setHint(bin, on) {
    if (!bin) return;
    if (bin.hint) {
      bin.hint.stop();
      bin.hint = null;
    }
    bin.glow.setAlpha(0);
    if (on) bin.hint = this.tweens.add({ targets: bin.glow, alpha: { from: 0.2, to: 1 }, duration: 450, yoyo: true, repeat: -1 });
  }

  // ---------------------------------------------------------------
  // HASIL
  // ---------------------------------------------------------------
  showResults() {
    this.state = "result";
    this.clearLayer();
    const L = this.layer;
    const n = this.queue.length;

    this.registry.set("visualScore", this.score);
    this.registry.set("visualTotal", n);
    setVark(this, "V", this.score / n);

    const g = this.add.graphics();
    drawPanel(g, DW / 2 - 360, 50, 720, 500);
    L.add(g);
    L.add(makeText(this, DW / 2, 100, "SESI VISUAL SELESAI!", { size: 22, color: css(COL.gold), stroke: css(COL.outline), strokeW: 8 }));

    const stars = this.score >= 11 ? 3 : this.score >= 8 ? 2 : this.score >= 5 ? 1 : 0;
    for (let i = 0; i < 3; i++) L.add(makeStar(this, DW / 2 + (i - 1) * 90, 180, i < stars, 300 + i * 260, i));

    L.add(makeText(this, DW / 2, 252, `TEPAT SEKALI COBA: ${this.score} / ${n}`, { size: 14, color: css(COL.cream), stroke: css(COL.outline), strokeW: 6 }));
    L.add(makeText(this, DW / 2, 284, `SALAH TARUH: ${this.mistakes} KALI`, { size: 9, color: css(COL.leafLight), stroke: css(COL.outline), strokeW: 4 }));

    let msg;
    if (stars === 3) msg = "Luar biasa! Matamu jeli membedakan sampah organik, anorganik, dan B3.";
    else if (stars >= 1) msg = "Bagus! Ingat lagi warna dan simbol tiap tong, ya.";
    else msg = "Ayo lihat lagi gambar materinya, lalu coba sekali lagi!";
    L.add(makeText(this, DW / 2, 336, msg, { size: 10, wrap: 580, spacing: 8 }));

    const next = createButton(this, DW / 2, 420, 420, 50, "LANJUT KE SESI AUDITORY", { size: 12, palN: PAL.woodHover, palH: PAL.wood, onClick: () => this.leaveTo("Level2AScene") });
    const again = createButton(this, DW / 2 - 110, 488, 200, 40, "ULANGI [R]", { size: 9, onClick: () => this.scene.restart() });
    const menu = createButton(this, DW / 2 + 110, 488, 200, 40, "MENU [M]", { size: 9, onClick: () => this.leaveTo("MainMenuScene") });
    L.add([next.container, again.container, menu.container]);
    this.tweens.add({ targets: next.container, scaleX: 1.03, scaleY: 1.03, duration: 700, yoyo: true, repeat: -1 });

    SoundFX.win();
    this.time.delayedCall(250, () => burst(this, DW / 2, 160, { count: 30, speed: 260, colors: [COL.gold, COL.leaf, COL.leafLight, COL.cream], depth: 50 }));
  }

  leaveTo(key) {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start(key));
  }

  onKey(e) {
    if (this.state === "materi") {
      if (e.code === "Enter" || e.code === "Space" || e.code === "ArrowRight") this.nextSlide();
      else if (e.code === "ArrowLeft") this.prevSlide();
      return;
    }
    if (this.state === "game") {
      // Alternatif tanpa mouse: tekan 1 / 2 / 3 untuk memasukkan ke tong
      const idx = { Digit1: 0, Digit2: 1, Digit3: 2, Numpad1: 0, Numpad2: 1, Numpad3: 2 }[e.code];
      if (idx !== undefined && this.bins[idx]) this.dropInto(this.bins[idx]);
      return;
    }
    if (this.state === "result") {
      if (e.code === "Enter" || e.code === "Space") this.leaveTo("Level2AScene");
      else if (e.code === "KeyR") this.scene.restart();
      else if (e.code === "KeyM" || e.code === "Escape") this.leaveTo("MainMenuScene");
    }
  }
}
