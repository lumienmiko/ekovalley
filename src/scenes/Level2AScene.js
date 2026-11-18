// src/scenes/Level2AScene.js
import Phaser from "phaser";
import SoundFX from "../audio/SoundFX.js";
import { DW, DH, COL, PAL, css, makeText, drawWood, drawPanel, createButton, setupResponsive, coverScale, burst, floatText, spawnLeaves } from "../ui/PixelUI.js";
import { setVark } from "../vark.js";

const MATERI = [
  { judul: "PLASTIK TIDAK HANCUR", teks: "Plastik butuh ratusan tahun untuk terurai di alam. Satu kantong plastik yang dibuang sembarangan bisa bertahan jauh lebih lama dari umur kita." },
  { judul: "BAHAYA MEMBAKAR PLASTIK", teks: "Membakar sampah plastik menghasilkan asap beracun. Asap ini mencemari udara dan berbahaya bagi pernapasan manusia serta hewan di hutan." },
  { judul: "PILAH SAMPAH", teks: "Sampah organik masuk tempat sampah hijau. Sampah anorganik seperti botol plastik masuk tempat sampah kuning. Memilah sampah membuat daur ulang jauh lebih mudah." },
  { judul: "3R UNTUK HUTAN", teks: "Reduce, kurangi sampah dari sumbernya. Reuse, pakai ulang barang yang masih bisa dipakai. Recycle, daur ulang sampah menjadi barang baru." },
  { judul: "JAGA RUMAH SATWA", teks: "Hutan adalah rumah bagi burung, serangga, dan satwa lain. Menebang pohon sembarangan dan membuang sampah ke sungai membuat mereka kehilangan tempat tinggal dan sumber makanan." },
];

const KUIS = [
  {
    q: "Berapa lama waktu yang dibutuhkan plastik untuk terurai di alam?",
    answers: ["Satu minggu", "Satu bulan", "Ratusan tahun"],
    correct: 2,
    explain: "Plastik sangat sulit terurai. Butuh ratusan tahun, jadi jangan dibuang sembarangan!",
  },
  {
    q: "Apa yang dihasilkan jika sampah plastik dibakar?",
    answers: ["Pupuk untuk tanaman", "Asap beracun yang mencemari udara", "Udara yang lebih segar"],
    correct: 1,
    explain: "Membakar plastik menghasilkan asap beracun yang berbahaya bagi pernapasan dan lingkungan.",
  },
  {
    q: "Botol plastik bekas sebaiknya dibuang ke tempat sampah yang mana?",
    answers: ["Sampah organik (hijau)", "Sampah anorganik (kuning)", "Sampah B3 (merah)"],
    correct: 1,
    explain: "Botol plastik termasuk sampah anorganik. Pilah dulu supaya mudah didaur ulang.",
  },
  {
    q: "Apa kepanjangan dari 3R dalam mengelola sampah?",
    answers: ["Reduce, Reuse, Recycle", "Run, Rest, Repeat", "Read, Rewrite, Repeat"],
    correct: 0,
    explain: "3R artinya Reduce atau kurangi, Reuse atau pakai ulang, dan Recycle atau daur ulang.",
  },
  {
    q: "Cara apa yang paling baik untuk mengurangi sampah plastik sekali pakai?",
    answers: ["Membawa tas belanja dan botol minum sendiri", "Membakar sampah plastik di kebun", "Membuang plastik ke parit"],
    correct: 0,
    explain: "Membawa tas dan botol sendiri mengurangi plastik sekali pakai dari sumbernya.",
  },
  {
    q: "Mengapa kita harus menjaga hutan dari sampah dan penebangan liar?",
    answers: ["Supaya hutan terlihat rapi", "Karena hutan adalah rumah bagi satwa dan sumber kehidupan", "Agar tidak ada pohon tumbang"],
    correct: 1,
    explain: "Hutan adalah rumah bagi satwa. Menjaganya berarti menjaga kehidupan mereka dan kita juga.",
  },
];

const LETTERS = ["A", "B", "C"];

function prepareKuis() {
  return KUIS.map((r) => {
    const order = Phaser.Utils.Array.Shuffle([0, 1, 2]);
    return Object.assign({}, r, {
      answers: order.map((i) => r.answers[i]),
      correct: order.indexOf(r.correct),
    });
  });
}

export default class Level2AScene extends Phaser.Scene {
  constructor() {
    super("Level2AScene");
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

    this.rounds = prepareKuis();
    this.index = 0;
    this.score = 0;
    this.answered = false;
    this.showText = false;
    this.eqMode = "idle";
    this.audioToken = 0;
    this.state = "materi";
    this.materiIndex = 0;

    this.buildBackdrop();
    this.layer = this.add.container(0, 0).setDepth(10);
    setupResponsive(this, (vw, vh) => this.onResize(vw, vh));

    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.keyHandler = (e) => this.onKey(e);
    if (this.input.keyboard) this.input.keyboard.on("keydown", this.keyHandler);

    this.events.once("shutdown", () => {
      this.audioToken++;
      SoundFX.cancelSpeech();
      SoundFX.stopCue();
      if (this.input.keyboard) this.input.keyboard.off("keydown", this.keyHandler);
    });

    this.mulaiMateri();
  }

  buildBackdrop() {
    if (this.textures.exists("menu_bg")) {
      this.bg = this.add.image(DW / 2, DH / 2, "menu_bg").setDepth(0);
      this.add.rectangle(DW / 2, DH / 2, 6000, 6000, 0x0b2418, 0.66).setDepth(1);
    } else {
      this.add.rectangle(DW / 2, DH / 2, 6000, 6000, 0x1c3a2a).setDepth(0);
    }
    spawnLeaves(this, 10, 2);
  }

  onResize() {
    if (this.bg) coverScale(this.bg, this._viewW, this._viewH);
  }

  clearLayer() {
    this.layer.removeAll(true);
    this.pips = null;
    this.bars = null;
  }

  title(text, y = 0) {
    return makeText(this, DW / 2, y, text, {
      size: 24,
      color: css(COL.gold),
      stroke: css(COL.outline),
      strokeW: 8,
    });
  }

  addMiko(x, y, scale) {
    const shadow = this.add.ellipse(x, y + 2, 28 * scale, 7 * scale, 0x000000, 0.3);
    this.layer.add(shadow);
    if (!this.textures.exists("player_sheet")) return null;
    const s = this.add.sprite(x, y, "player_sheet", 1).setOrigin(0.5, 1).setScale(scale);
    this.layer.add(s);
    return s;
  }

  cancelAudio() {
    this.audioToken++;
    SoundFX.cancelSpeech();
    SoundFX.stopCue();
    this.eqMode = "idle";
  }

  say(text, token, onDone) {
    this.eqMode = "speech";
    const finish = () => {
      if (token !== this.audioToken) return;
      this.eqMode = "idle";
      if (onDone) onDone();
    };
    if (!SoundFX.enabled) {
      this.time.delayedCall(500, finish);
      return;
    }
    const ok = SoundFX.speak(text, { onEnd: finish });
    if (!ok) this.time.delayedCall(Math.min(4000, 800 + text.length * 40), finish);
  }

  // ---------------------------------------------------------------
  // MATERI — kotak wood diposisikan DI SAMPING kanan Miko,
  //          ukuran pas, tidak keluar panel.
  // ---------------------------------------------------------------
  mulaiMateri() {
    this.state = "materi";
    this.materiIndex = 0;
    this.clearLayer();

    const L = this.layer;

    // Panel utama
    const g = this.add.graphics();
    drawPanel(g, DW / 2 - 360, 50, 720, 500);
    L.add(g);

    // Judul
    L.add(this.title("MATERI PENJAGAAN HUTAN", 104));

    // Miko — kiri bawah, di dalam panel
    const mikoX = DW / 2 - 240;
    const mikoY = 400;
    this.miko = this.addMiko(mikoX, mikoY, 2.8);
    this.mikoBaseY = mikoY;
    L.add(
      makeText(this, mikoX, mikoY + 18, "MIKO", {
        size: 10,
        color: css(COL.gold),
        stroke: css(COL.outline),
        strokeW: 4,
      }),
    );

    // Pips materi — di bawah judul
    this.materiPips = [];
    const pipsStartX = DW / 2 - 80;
    for (let i = 0; i < MATERI.length; i++) {
      const r = this.add.rectangle(pipsStartX + i * 32, 168, 20, 20, 0x3a2a1a).setStrokeStyle(2, COL.outline);
      L.add(r);
      this.materiPips.push(r);
    }

    // ── KOTAK WOOD ────────────────────────────────────────────────
    // Panel  : DW/2-360 .. DW/2+360
    // Miko   : center DW/2-240, kanan ~ DW/2-192
    // Kotak  : x=DW/2-160, w=420 → DW/2-160 .. DW/2+260
    //   gap kiri  ~32px dari Miko
    //   gap kanan ~100px dari tepi panel  ✓ simetris dalam panel
    const boxX = DW / 2 - 160;
    const boxY = 200;
    const boxW = 420;
    const boxH = 150;
    const boxCX = boxX + boxW / 2; // = DW/2 + 50
    const boxCY = boxY + boxH / 2; // = 275

    const dg = this.add.graphics();
    drawWood(dg, boxX, boxY, boxW, boxH, PAL.parch, { grain: false });
    L.add(dg);

    this.materiStatus = makeText(this, boxCX, boxCY, "", {
      size: 11,
      color: "#8a5a30",
      wrap: boxW - 40,
      spacing: 10,
      origin: [0.5, 0.5],
      align: "center",
    });
    L.add(this.materiStatus);

    // Hint di bawah kotak, sejajar
    this.materiHint = makeText(this, boxCX, boxY + boxH + 20, "", {
      size: 8,
      color: "#ffd9a0",
      wrap: boxW + 20,
      origin: [0.5, 0],
    });
    L.add(this.materiHint);

    if (!SoundFX.enabled) {
      this.materiHint.setText("SUARA MATI. Tekan M untuk menyalakan.");
    } else if (!SoundFX.speechSupported) {
      this.materiHint.setText("Browser tidak mendukung suara Miko.");
    }

    // Tombol
    this.ulangMateriBtn = createButton(this, DW / 2 - 130, 460, 230, 48, "ULANG MATERI", {
      size: 10,
      onClick: () => this.ulangMateri(),
    });
    this.lewatiMateriBtn = createButton(this, DW / 2 + 130, 460, 230, 48, "LEWATI", {
      size: 10,
      palN: PAL.woodHover,
      palH: PAL.wood,
      onClick: () => this.mulaiKuis(),
    });
    L.add([this.ulangMateriBtn.container, this.lewatiMateriBtn.container]);

    this.bacakanMateri(0);
  }

  bacakanMateri(i) {
    this.cancelAudio();
    this.materiIndex = i;
    const token = this.audioToken;
    const m = MATERI[i];

    this.updateMateriPips();
    this.materiStatus.setText(`MATERI ${i + 1} DARI ${MATERI.length}`);

    const full = `Materi ${i + 1}. ${m.judul}. ${m.teks}`;

    this.say(full, token, () => {
      if (token !== this.audioToken) return;
      if (i + 1 < MATERI.length) {
        this.time.delayedCall(600, () => this.bacakanMateri(i + 1));
      } else {
        this.materiStatus.setText("MATERI SELESAI.\nSIAP UNTUK KUIS?");
        this.lewatiMateriBtn.setLabel("MULAI KUIS");
      }
    });
  }

  ulangMateri() {
    this.cancelAudio();
    this.bacakanMateri(this.materiIndex);
  }

  updateMateriPips() {
    this.materiPips.forEach((p, i) => {
      p.setFillStyle(i < this.materiIndex ? COL.leaf : i === this.materiIndex ? COL.gold : 0x3a2a1a);
    });
  }

  // ---------------------------------------------------------------
  // KUIS
  // ---------------------------------------------------------------
  mulaiKuis() {
    this.cancelAudio();
    this.state = "quiz";
    this.index = 0;
    this.score = 0;
    this.buildQuiz();
    this.loadRound(0);
  }

  buildQuiz() {
    this.clearLayer();
    const L = this.layer;
    const n = this.rounds.length;

    L.add(
      makeText(this, 24, 24, "KUIS PENJAGAAN HUTAN", {
        size: 10,
        color: css(COL.gold),
        origin: [0, 0.5],
        stroke: css(COL.outline),
        strokeW: 4,
      }),
    );
    this.scoreText = makeText(this, 24, 48, `BENAR: 0`, {
      size: 9,
      origin: [0, 0.5],
      stroke: css(COL.outline),
      strokeW: 3,
    });
    L.add(this.scoreText);

    this.pips = [];
    const startX = 740;
    for (let i = 0; i < n; i++) {
      const r = this.add.rectangle(startX + i * 24, 30, 14, 14, 0x3a2a1a).setStrokeStyle(2, COL.outline);
      L.add(r);
      this.pips.push(r);
    }

    const grass = this.add.ellipse(130, 328, 190, 44, 0x4f8f3a).setStrokeStyle(3, COL.outline);
    L.add(grass);
    this.miko = this.addMiko(130, 334, 3);
    this.mikoBaseY = 334;
    L.add(
      makeText(this, 130, 376, "MIKO", {
        size: 10,
        color: css(COL.gold),
        stroke: css(COL.outline),
        strokeW: 4,
      }),
    );

    const dg = this.add.graphics();
    drawWood(dg, 250, 76, 660, 176, PAL.parch, { grain: false });
    L.add(dg);

    this.headerText = makeText(this, 278, 98, "", { size: 8, color: "#8a5a30", origin: [0, 0.5] });
    this.qText = makeText(this, 278, 120, "", {
      size: 14,
      color: css(COL.ink),
      origin: [0, 0],
      align: "left",
      wrap: 604,
      spacing: 10,
    });
    L.add([this.headerText, this.qText]);

    this.answerBtns = [];
    for (let i = 0; i < 3; i++) {
      const b = createButton(this, 580, 372 + i * 62, 660, 52, "", {
        size: 12,
        align: "left",
        badge: LETTERS[i],
        onClick: () => this.answer(i),
      });
      L.add(b.container);
      this.answerBtns.push(b);
    }

    this.nextBtn = createButton(this, 830, 562, 220, 44, "LANJUT", {
      size: 12,
      palN: PAL.woodHover,
      palH: PAL.wood,
      onClick: () => this.next(),
    });
    this.nextBtn.setVisible(false);
    L.add(this.nextBtn.container);

    this.updatePips();
  }

  updatePips() {
    if (!this.pips) return;
    this.pips.forEach((p, i) => {
      p.setFillStyle(i < this.index ? COL.leaf : i === this.index ? COL.gold : 0x3a2a1a);
    });
  }

  refreshTexts() {
    const r = this.round;
    const reveal = this.showText || this.answered;
    this.answerBtns.forEach((b, i) => {
      b.setLabel(reveal ? r.answers[i] : `PILIHAN ${LETTERS[i]} (DENGARKAN MIKO)`);
    });
    if (this.answered) return;
    this.headerText.setText(`PERTANYAAN ${this.index + 1} / ${this.rounds.length}`);
    this.qText.setFontSize(14);
    this.qText.setText(this.showText ? r.q : "MODE DENGAR\n\nDengarkan Miko, lalu pilih A, B, atau C!");
  }

  loadRound(i) {
    this.index = i;
    this.round = this.rounds[i];
    this.answered = false;
    this.nextBtn.setVisible(false);
    this.answerBtns.forEach((b) => {
      b.setPalette(null);
      b.setEnabled(true);
      b.setDim(false);
      b.container.x = 580;
    });
    this.updatePips();
    this.refreshTexts();
    this.playRound();
  }

  playRound() {
    this.cancelAudio();
    const token = this.audioToken;
    const r = this.round;
    const a = r.answers;
    this.say(`${r.q} Pilihan A, ${a[0]}. Pilihan B, ${a[1]}. Pilihan C, ${a[2]}.`, token);
  }

  answer(i) {
    if (this.state !== "quiz" || this.answered) return;
    this.answered = true;
    const r = this.round;
    const ok = i === r.correct;
    const chosen = this.answerBtns[i];

    if (ok) {
      this.score++;
      SoundFX.correct();
      burst(this, chosen.container.x, chosen.container.y + this.layer.y, { count: 22 });
      floatText(this, chosen.container.x + 200, chosen.container.y - 30, "+1");
    } else {
      SoundFX.wrong();
      this.tweens.add({
        targets: chosen.container,
        x: 580 + 10,
        duration: 55,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          chosen.container.x = 580;
        },
      });
    }

    this.answerBtns.forEach((b, k) => {
      if (k === r.correct) b.setPalette(PAL.woodHover);
      else if (k === i) b.setPalette(PAL.red);
      else b.setDim(true);
      b.setEnabled(false);
    });

    this.scoreText.setText(`BENAR: ${this.score}`);
    this.updatePips();
    this.refreshTexts();

    this.headerText.setText(ok ? "MIKO BERKATA: BENAR!" : "MIKO BERKATA: BELUM TEPAT");
    this.qText.setFontSize(12);
    this.qText.setText((ok ? "Hebat! " : "Jawaban yang benar: " + r.answers[r.correct] + ".\n") + r.explain);

    const feedback = (ok ? "Benar! " : `Belum tepat. Jawabannya ${r.answers[r.correct]}. `) + r.explain;
    const token = this.audioToken;
    this.time.delayedCall(700, () => {
      if (token === this.audioToken) this.say(feedback, token);
    });

    this.nextBtn.setLabel(this.index + 1 >= this.rounds.length ? "LIHAT HASIL" : "LANJUT");
    this.nextBtn.setVisible(true);
  }

  next() {
    if (this.state !== "quiz" || !this.answered) return;
    this.cancelAudio();
    if (this.index + 1 >= this.rounds.length) this.showResults();
    else this.loadRound(this.index + 1);
  }

  showResults() {
    this.state = "result";
    this.clearLayer();
    this.eqMode = "idle";
    const L = this.layer;
    const n = this.rounds.length;

    this.registry.set("auditoryScore", this.score);
    this.registry.set("auditoryTotal", n);
    setVark(this, "A", this.score / n);

    const g = this.add.graphics();
    drawPanel(g, DW / 2 - 360, 50, 720, 500);
    L.add(g);

    L.add(this.title("KUIS SELESAI!", 100));

    const stars = this.score >= 5 ? 3 : this.score >= 4 ? 2 : this.score >= 2 ? 1 : 0;
    for (let i = 0; i < 3; i++) {
      const sg = this.add.graphics();
      const earned = i < stars;
      const pts = [];
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rad = k % 2 === 0 ? 34 : 15;
        pts.push({ x: Math.cos(a) * rad, y: Math.sin(a) * rad });
      }
      sg.fillStyle(COL.outline, 1);
      sg.lineStyle(8, COL.outline, 1);
      sg.strokePoints(pts, true);
      sg.fillPoints(pts, true);
      sg.fillStyle(earned ? COL.gold : 0x5a4d3f, 1);
      const inner = pts.map((p) => ({ x: p.x * 0.78, y: p.y * 0.78 }));
      sg.fillPoints(inner, true);
      sg.setPosition(DW / 2 + (i - 1) * 90, 190);
      sg.setScale(0);
      L.add(sg);
      this.tweens.add({
        targets: sg,
        scale: 1,
        duration: 320,
        delay: 300 + i * 260,
        ease: "Back.easeOut",
        onStart: () => {
          if (earned) SoundFX.star(i);
        },
      });
    }

    L.add(
      makeText(this, DW / 2, 262, `NILAI: ${this.score} / ${n}`, {
        size: 16,
        color: css(COL.cream),
        stroke: css(COL.outline),
        strokeW: 6,
      }),
    );

    let msg;
    if (this.score >= 5) msg = "Luar biasa! Kamu paham cara menjaga hutan. Miko bangga!";
    else if (this.score >= 3) msg = "Bagus! Sedikit lagi kamu jadi penjaga hutan sejati.";
    else msg = "Jangan menyerah! Baca ulang materi dan coba lagi.";

    L.add(makeText(this, DW / 2, 340, msg, { size: 11, wrap: 580, spacing: 8 }));

    const nextScene = createButton(this, DW / 2 - 130, 452, 230, 48, "LANJUT KE READ", {
      size: 10,
      palN: PAL.woodHover,
      palH: PAL.wood,
      onClick: () => this.keScene3(),
    });
    const menu = createButton(this, DW / 2 + 130, 452, 230, 48, "MENU UTAMA", {
      size: 10,
      onClick: () => this.toMenu(),
    });
    L.add([nextScene.container, menu.container]);

    SoundFX.win();
    this.time.delayedCall(250, () => {
      burst(this, DW / 2, 160, {
        count: 30,
        speed: 260,
        colors: [COL.gold, COL.leaf, COL.leafLight, COL.cream],
        depth: 50,
      });
    });
  }

  // ── DEFENSIVE: cek dulu Scene3Read terdaftar atau tidak ──
  keScene3() {
    this.cancelAudio();

    const registered = this.scene.manager.keys;
    const keys = Object.keys(registered);
    console.log("[Level2AScene] keScene3 — scene keys:", keys);

    if (!keys.includes("Scene3Read")) {
      console.error("[Level2AScene] ⚠️ Scene3Read TIDAK TERDAFTAR di main.js!");
      this.add
        .text(this.scale.width / 2, this.scale.height - 30, "ERROR: 'Scene3Read' tidak terdaftar di main.js — cek Console (F12)", {
          fontSize: "12px",
          color: "#ff5555",
          backgroundColor: "#000000",
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(99999);
      return;
    }

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Scene3Read");
    });
  }

  toMenu() {
    this.cancelAudio();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("MainMenuScene");
    });
  }

  onKey(e) {
    if (this.state === "materi") {
      if (e.code === "KeyR") this.ulangMateri();
      else if (e.code === "Enter" || e.code === "Space") this.lewatiMateriBtn?.click();
      else if (e.code === "KeyM") this.toggleSound();
      return;
    }
    if (this.state === "quiz") {
      if (this.answered) {
        if (e.code === "Enter" || e.code === "Space") this.next();
        return;
      }
      switch (e.code) {
        case "KeyA":
          this.answer(0);
          break;
        case "KeyB":
          this.answer(1);
          break;
        case "KeyC":
          this.answer(2);
          break;
        case "KeyR":
          this.playRound();
          break;
        case "KeyM":
          this.toggleSound();
          break;
      }
      return;
    }
    if (this.state === "result") {
      if (e.code === "Enter" || e.code === "Space") this.keScene3();
      else if (e.code === "Escape" || e.code === "KeyM") this.toMenu();
    }
  }

  toggleSound() {
    const on = !SoundFX.enabled;
    this.registry.set("audioEnabled", on);
    SoundFX.setEnabled(on);
    if (this.state === "materi") {
      if (on) this.bacakanMateri(this.materiIndex);
      else this.cancelAudio();
    } else if (this.state === "quiz" && on && !this.answered) {
      this.playRound();
    }
  }

  update(time) {
    if (this.miko) {
      this.miko.y = this.eqMode === "speech" ? this.mikoBaseY - Math.abs(Math.sin(time * 0.014)) * 5 : this.mikoBaseY;
    }

    if (this.state !== "quiz" || !this.bars) return;
    const n = this.bars.length;
    let target = null;
    if (this.eqMode === "cue") target = SoundFX.getLevels(n);
    else if (this.eqMode === "speech") {
      target = [];
      for (let i = 0; i < n; i++) {
        target.push(0.2 + 0.8 * Math.abs(Math.sin(time * 0.011 + i * 0.7) * Math.sin(time * 0.0047 + i * 1.3)));
      }
    }
    for (let i = 0; i < n; i++) {
      const goal = target ? 4 + target[i] * 40 : 4 + 2 * Math.abs(Math.sin(time * 0.002 + i * 0.5));
      this.barH[i] += (goal - this.barH[i]) * 0.35;
      const h = Math.max(4, Math.round(this.barH[i] / 4) * 4);
      this.bars[i].setSize(10, h);
      this.bars[i].setFillStyle(h > 30 ? COL.gold : h > 18 ? COL.leafLight : COL.leaf);
    }
  }
}
