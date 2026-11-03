// src/scenes/Scene3Read.js
import Phaser from "phaser";
import SoundFX from "../audio/SoundFX.js";
import { DW, DH, COL, PAL, css, makeText, drawWood, drawPanel, createButton, setupResponsive, coverScale, burst, floatText, spawnLeaves } from "../ui/PixelUI.js";

const CERITA = [
  { judul: "PAGI DI LEMBAH EKO", teks: "Matahari pagi menyinari Lembah Eko. Burung-burung berkicau riang. Miko berjalan menyusuri sungai yang jernih. Namun, ia melihat sebuah kantong plastik tersangkut di batu." },
  { judul: "SAMPAH DI SUNGAI", teks: "Miko mengambil kantong plastik itu. Ia tahu, plastik tidak bisa hancur di air. Jika dibiarkan, ikan bisa memakannya dan sungai menjadi kotor. Miko memasukkannya ke tas kainnya." },
  { judul: "PESAN UNTUK SEMUA", teks: "Di tepi hutan, Miko bertemu sekelompok anak-anak. Ia bercerita tentang pentingnya menjaga hutan. Anak-anak berjanji tidak membuang sampah sembarangan dan membawa botol minum sendiri." },
  { judul: "HUTAN YANG BERSIH", teks: "Hari itu, Lembah Eko menjadi lebih bersih. Burung-burung kembali berkicau. Miko tersenyum. Ia tahu, perubahan besar dimulai dari langkah kecil setiap orang." },
];

const PEMAHAMAN = [
  { q: "Apa yang dilihat Miko di sungai?", answers: ["Ikan besar", "Kantong plastik", "Perahu kayu"], correct: 1, explain: "Miko melihat kantong plastik yang tersangkut di batu. Plastik tidak hancur di air dan bisa mencemari sungai." },
  {
    q: "Mengapa plastik berbahaya bagi ikan?",
    answers: ["Ikan bisa memakannya", "Plastik membuat air jernih", "Plastik memberi makan ikan"],
    correct: 0,
    explain: "Ikan bisa memakan plastik karena mengira itu makanan. Ini berbahaya bagi kesehatan mereka.",
  },
  {
    q: "Apa janji anak-anak setelah bertemu Miko?",
    answers: ["Menebang pohon", "Tidak membuang sampah sembarangan", "Membakar sampah di hutan"],
    correct: 1,
    explain: "Anak-anak berjanji tidak membuang sampah sembarangan dan membawa botol minum sendiri.",
  },
  {
    q: "Apa pesan utama cerita ini?",
    answers: ["Hutan tidak penting", "Perubahan besar dimulai dari langkah kecil", "Sampah tidak berbahaya"],
    correct: 1,
    explain: "Perubahan besar dimulai dari langkah kecil setiap orang, seperti tidak membuang sampah sembarangan.",
  },
];

const LETTERS = ["A", "B", "C"];

function preparePemahaman() {
  return PEMAHAMAN.map((r) => {
    const order = Phaser.Utils.Array.Shuffle([0, 1, 2]);
    return Object.assign({}, r, {
      answers: order.map((i) => r.answers[i]),
      correct: order.indexOf(r.correct),
    });
  });
}

export default class Scene3Read extends Phaser.Scene {
  constructor() {
    super("Scene3Read");
  }

  create() {
    console.log("[Scene3Read] create START");

    this._pxTexts = [];
    this._textRes = 0;

    try {
      this.sound.stopAll();
      SoundFX.unlock();
      SoundFX.stopTheme();
      SoundFX.setEnabled(this.registry.get("audioEnabled") !== false);
      SoundFX.cancelSpeech();
      SoundFX.stopCue();
    } catch (e) {
      console.warn("[Scene3Read] audio setup error:", e);
    }

    this.indexCerita = 0;
    this.pemahaman = preparePemahaman();
    this.indexTanya = 0;
    this.score = 0;
    this.answered = false;
    this.eqMode = "idle";
    this.audioToken = 0;
    this.state = "cerita";

    this.buildBackdrop();
    this.layer = this.add.container(0, 0).setDepth(10);

    try {
      setupResponsive(this, (vw, vh) => this.onResize(vw, vh));
    } catch (e) {
      console.warn("[Scene3Read] setupResponsive error:", e);
    }

    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.keyHandler = (e) => this.onKey(e);
    if (this.input.keyboard) this.input.keyboard.on("keydown", this.keyHandler);

    this.events.once("shutdown", () => {
      this.audioToken++;
      try {
        SoundFX.cancelSpeech();
      } catch (e) {}
      try {
        SoundFX.stopCue();
      } catch (e) {}
      if (this.input.keyboard) this.input.keyboard.off("keydown", this.keyHandler);
    });

    try {
      this.mulaiCerita();
      console.log("[Scene3Read] create END, children:", this.layer.length);
    } catch (err) {
      console.error("[Scene3Read] FATAL create error:", err);
      this.add
        .text(this.scale.width / 2, this.scale.height / 2, "SCENE 3 ERROR\n" + (err && err.message ? err.message : String(err)) + "\nCek Console (F12)", {
          fontSize: "14px",
          color: "#ff6666",
          backgroundColor: "#000",
          align: "center",
          padding: { x: 12, y: 8 },
        })
        .setOrigin(0.5)
        .setDepth(9999);
    }
  }

  buildBackdrop() {
    if (this.textures.exists("menu_bg")) {
      this.bg = this.add.image(DW / 2, DH / 2, "menu_bg").setDepth(0);
      this.add.rectangle(DW / 2, DH / 2, 6000, 6000, 0x0b2418, 0.66).setDepth(1);
    } else {
      this.add.rectangle(DW / 2, DH / 2, 6000, 6000, 0x1c3a2a).setDepth(0);
    }
    try {
      spawnLeaves(this, 8, 2);
    } catch (e) {}
  }

  onResize() {
    if (this.bg) coverScale(this.bg, this._viewW, this._viewH);
  }

  clearLayer() {
    if (this.layer) this.layer.removeAll(true);
  }

  title(text, y = 0) {
    return makeText(this, DW / 2, y, text, {
      size: 22,
      color: css(COL.gold),
      stroke: css(COL.outline),
      strokeW: 7,
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
    try {
      SoundFX.cancelSpeech();
    } catch (e) {}
    try {
      SoundFX.stopCue();
    } catch (e) {}
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
    try {
      const ok = SoundFX.speak(text, { onEnd: finish });
      if (!ok) this.time.delayedCall(Math.min(5000, 1000 + text.length * 35), finish);
    } catch (e) {
      console.warn("[Scene3Read] say error:", e);
      this.time.delayedCall(500, finish);
    }
  }

  mulaiCerita() {
    this.state = "cerita";
    this.indexCerita = 0;
    this.bacakanCerita(0);
  }

  bacakanCerita(i) {
    this.cancelAudio();
    this.indexCerita = i;
    this.clearLayer();

    const L = this.layer;
    const c = CERITA[i];

    const g = this.add.graphics();
    drawPanel(g, DW / 2 - 360, 40, 720, 520);
    L.add(g);

    L.add(this.title("MEMBACA JEJAK HUTAN", 92));

    this.miko = this.addMiko(DW / 2 - 235, 380, 2.6);
    this.mikoBaseY = 380;
    L.add(
      makeText(this, DW / 2 - 235, 400, "MIKO", {
        size: 9,
        color: css(COL.gold),
        stroke: css(COL.outline),
        strokeW: 4,
      }),
    );

    const dg = this.add.graphics();
    drawWood(dg, 250, 120, 660, 280, PAL.parch, { grain: false });
    L.add(dg);

    this.ceritaJudul = makeText(this, 278, 142, c.judul, {
      size: 10,
      color: "#8a5a30",
      origin: [0, 0.5],
    });
    L.add(this.ceritaJudul);

    this.ceritaTeks = makeText(this, 278, 170, c.teks, {
      size: 13,
      color: css(COL.ink),
      origin: [0, 0],
      align: "left",
      wrap: 604,
      spacing: 12,
    });
    L.add(this.ceritaTeks);

    this.ceritaPips = [];
    const startX = DW / 2 - 60;
    for (let k = 0; k < CERITA.length; k++) {
      const r = this.add.rectangle(startX + k * 30, 430, 18, 18, 0x3a2a1a).setStrokeStyle(2, COL.outline);
      L.add(r);
      this.ceritaPips.push(r);
    }
    this.updateCeritaPips();

    this.ulangCeritaBtn = createButton(this, DW / 2 - 130, 490, 220, 44, "ULANG HALAMAN", {
      size: 9,
      onClick: () => this.bacakanCerita(this.indexCerita),
    });
    this.lanjutCeritaBtn = createButton(this, DW / 2 + 130, 490, 220, 44, "LANJUT", {
      size: 10,
      palN: PAL.woodHover,
      palH: PAL.wood,
      onClick: () => this.lanjutCerita(),
    });
    L.add([this.ulangCeritaBtn.container, this.lanjutCeritaBtn.container]);

    const token = this.audioToken;
    this.say(`${c.judul}. ${c.teks}`, token);
  }

  lanjutCerita() {
    this.cancelAudio();
    if (this.indexCerita + 1 < CERITA.length) {
      this.bacakanCerita(this.indexCerita + 1);
    } else {
      this.mulaiPemahaman();
    }
  }

  updateCeritaPips() {
    if (!this.ceritaPips) return;
    this.ceritaPips.forEach((p, k) => {
      p.setFillStyle(k < this.indexCerita ? COL.leaf : k === this.indexCerita ? COL.gold : 0x3a2a1a);
    });
  }

  mulaiPemahaman() {
    this.cancelAudio();
    this.state = "pemahaman";
    this.indexTanya = 0;
    this.score = 0;
    this.buildPemahaman();
    this.loadTanya(0);
  }

  buildPemahaman() {
    this.clearLayer();
    const L = this.layer;

    L.add(
      makeText(this, 24, 24, "PEMAHAMAN CERITA", {
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

    const dg = this.add.graphics();
    drawWood(dg, 100, 90, 760, 120, PAL.parch, { grain: false });
    L.add(dg);

    this.headerText = makeText(this, 124, 108, "", { size: 8, color: "#8a5a30", origin: [0, 0.5] });
    this.qText = makeText(this, 124, 130, "", {
      size: 13,
      color: css(COL.ink),
      origin: [0, 0],
      align: "left",
      wrap: 712,
      spacing: 10,
    });
    L.add([this.headerText, this.qText]);

    this.answerBtns = [];
    for (let i = 0; i < 3; i++) {
      const b = createButton(this, 480, 260 + i * 62, 700, 52, "", {
        size: 11,
        align: "left",
        badge: LETTERS[i],
        onClick: () => this.answer(i),
      });
      L.add(b.container);
      this.answerBtns.push(b);
    }

    this.nextBtn = createButton(this, 780, 520, 220, 44, "LANJUT", {
      size: 11,
      palN: PAL.woodHover,
      palH: PAL.wood,
      onClick: () => this.nextTanya(),
    });
    this.nextBtn.setVisible(false);
    L.add(this.nextBtn.container);
  }

  refreshPemahaman() {
    const r = this.pemahaman[this.indexTanya];
    const reveal = this.answered;
    this.answerBtns.forEach((b, i) => {
      b.setLabel(reveal ? r.answers[i] : `PILIHAN ${LETTERS[i]}`);
    });
    if (this.answered) return;
    this.headerText.setText(`PERTANYAAN ${this.indexTanya + 1} / ${this.pemahaman.length}`);
    this.qText.setText(r.q);
  }

  loadTanya(i) {
    this.indexTanya = i;
    this.answered = false;
    this.nextBtn.setVisible(false);
    this.answerBtns.forEach((b) => {
      b.setPalette(null);
      b.setEnabled(true);
      b.setDim(false);
      b.container.x = 480;
    });
    this.refreshPemahaman();
    this.playTanya();
  }

  playTanya() {
    this.cancelAudio();
    const token = this.audioToken;
    const r = this.pemahaman[this.indexTanya];
    const a = r.answers;
    this.say(`${r.q} Pilihan A, ${a[0]}. Pilihan B, ${a[1]}. Pilihan C, ${a[2]}.`, token);
  }

  answer(i) {
    if (this.state !== "pemahaman" || this.answered) return;
    this.answered = true;
    const r = this.pemahaman[this.indexTanya];
    const ok = i === r.correct;
    const chosen = this.answerBtns[i];

    if (ok) {
      this.score++;
      SoundFX.correct();
      burst(this, chosen.container.x, chosen.container.y + this.layer.y, { count: 20 });
      floatText(this, chosen.container.x + 220, chosen.container.y - 30, "+1");
    } else {
      SoundFX.wrong();
      this.tweens.add({
        targets: chosen.container,
        x: 480 + 10,
        duration: 55,
        yoyo: true,
        repeat: 3,
        onComplete: () => {
          chosen.container.x = 480;
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
    this.refreshPemahaman();

    this.headerText.setText(ok ? "BENAR!" : "BELUM TEPAT");
    this.qText.setText((ok ? "Hebat! " : "Jawaban yang benar: " + r.answers[r.correct] + ".\n") + r.explain);

    const feedback = (ok ? "Benar! " : `Belum tepat. Jawabannya ${r.answers[r.correct]}. `) + r.explain;
    const token = this.audioToken;
    this.time.delayedCall(700, () => {
      if (token === this.audioToken) this.say(feedback, token);
    });

    this.nextBtn.setLabel(this.indexTanya + 1 >= this.pemahaman.length ? "LIHAT HASIL" : "LANJUT");
    this.nextBtn.setVisible(true);
  }

  nextTanya() {
    if (this.state !== "pemahaman" || !this.answered) return;
    this.cancelAudio();
    if (this.indexTanya + 1 >= this.pemahaman.length) this.showHasilAkhir();
    else this.loadTanya(this.indexTanya + 1);
  }

  showHasilAkhir() {
    this.state = "hasil";
    this.clearLayer();
    this.eqMode = "idle";
    const L = this.layer;
    const n = this.pemahaman.length;

    this.registry.set("readScore", this.score);
    this.registry.set("readTotal", n);

    const g = this.add.graphics();
    drawPanel(g, DW / 2 - 360, 50, 720, 500);
    L.add(g);

    L.add(this.title("SESI READ SELESAI!", 100));

    const stars = this.score >= 4 ? 3 : this.score >= 3 ? 2 : this.score >= 1 ? 1 : 0;
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
      makeText(this, DW / 2, 262, `NILAI READ: ${this.score} / ${n}`, {
        size: 16,
        color: css(COL.cream),
        stroke: css(COL.outline),
        strokeW: 6,
      }),
    );

    const auditory = this.registry.get("auditoryScore");
    if (auditory !== undefined) {
      L.add(
        makeText(this, DW / 2, 300, `SESI AUDITORY: ${auditory} BENAR`, {
          size: 9,
          color: css(COL.leafLight),
          stroke: css(COL.outline),
          strokeW: 4,
        }),
      );
    }

    let msg;
    if (this.score >= 4) msg = "Sempurna! Kamu membaca dengan teliti dan paham cara menjaga hutan.";
    else if (this.score >= 2) msg = "Bagus! Teruslah membaca dan belajar tentang hutan.";
    else msg = "Ayo baca lagi ceritanya dan coba pemahaman sekali lagi.";

    L.add(makeText(this, DW / 2, 360, msg, { size: 11, wrap: 580, spacing: 8 }));

    const result = createButton(this, DW / 2 - 130, 452, 230, 48, "LIHAT HASIL AKHIR", {
      size: 9,
      palN: PAL.woodHover,
      palH: PAL.wood,
      onClick: () => this.keResult(),
    });
    const menu = createButton(this, DW / 2 + 130, 452, 230, 48, "MENU UTAMA", {
      size: 10,
      onClick: () => this.toMenu(),
    });
    L.add([result.container, menu.container]);

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

  keResult() {
    this.cancelAudio();
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      const registered = this.scene.manager.keys;
      if (!Object.keys(registered).includes("ResultScene")) {
        console.warn("[Scene3Read] ResultScene tidak terdaftar — kembali ke menu.");
        this.scene.start("MainMenuScene");
        return;
      }
      const auditoryScore = this.registry.get("auditoryScore") || 0;
      const auditoryTotal = this.registry.get("auditoryTotal") || 0;
      this.scene.start("ResultScene", {
        score: this.score,
        total: this.pemahaman.length,
        mistakes: this.pemahaman.length - this.score,
        timeLeft: 0,
        timeTotal: 0,
        cleared: true,
        mode: "read",
        auditoryScore,
        auditoryTotal,
      });
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
    if (this.state === "cerita") {
      if (e.code === "KeyR") this.bacakanCerita(this.indexCerita);
      else if (e.code === "Enter" || e.code === "Space") this.lanjutCerita();
      else if (e.code === "KeyM") this.toggleSound();
      return;
    }
    if (this.state === "pemahaman") {
      if (this.answered) {
        if (e.code === "Enter" || e.code === "Space") this.nextTanya();
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
          this.playTanya();
          break;
        case "KeyM":
          this.toggleSound();
          break;
      }
      return;
    }
    if (this.state === "hasil") {
      if (e.code === "Enter" || e.code === "Space") this.keResult();
      else if (e.code === "Escape") this.toMenu();
    }
  }

  toggleSound() {
    const on = !SoundFX.enabled;
    this.registry.set("audioEnabled", on);
    SoundFX.setEnabled(on);
    if (!on) this.cancelAudio();
    else if (this.state === "cerita") this.bacakanCerita(this.indexCerita);
    else if (this.state === "pemahaman" && !this.answered) this.playTanya();
  }

  update(time) {
    if (this.miko) {
      this.miko.y = this.eqMode === "speech" ? this.mikoBaseY - Math.abs(Math.sin(time * 0.014)) * 4 : this.mikoBaseY;
    }
  }
}
