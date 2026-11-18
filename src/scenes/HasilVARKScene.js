// src/scenes/HasilVARKScene.js
// =====================================================================
// Hasil akhir: nilai keempat sesi (V, A, R, K) dan gaya belajar dominan.
// Nilai tiap sesi (0..1) disimpan lewat setVark() di src/vark.js.
// =====================================================================
import Phaser from "phaser";
import SoundFX from "../audio/SoundFX.js";
import { DW, DH, COL, PAL, css, makeText, drawWood, drawPanel, createButton, setupResponsive, coverScale, burst, spawnLeaves } from "../ui/PixelUI.js";
import { VARK_INFO, getVark } from "../vark.js";

const ORDER = ["V", "A", "R", "K"];
const BAR_COLOR = { V: 0x439bd3, A: 0xffd24a, R: 0xf3e2b3, K: 0x6fb04a };

export default class HasilVARKScene extends Phaser.Scene {
  constructor() {
    super("HasilVARKScene");
  }

  create() {
    this._pxTexts = [];
    this._textRes = 0;
    this.leaving = false;

    this.sound.stopAll();
    SoundFX.unlock();
    SoundFX.setEnabled(this.registry.get("audioEnabled") !== false);
    SoundFX.cancelSpeech();

    if (this.textures.exists("menu_bg")) {
      this.bg = this.add.image(DW / 2, DH / 2, "menu_bg").setDepth(0);
      this.add.rectangle(DW / 2, DH / 2, 6000, 6000, 0x0b2418, 0.6).setDepth(1);
    }
    spawnLeaves(this, 10, 2);
    setupResponsive(this, () => {
      if (this.bg) coverScale(this.bg, this._viewW, this._viewH);
    });

    this.build();
    this.cameras.main.fadeIn(350, 0, 0, 0);

    this.keyHandler = (e) => {
      if (["Enter", "Space", "Escape", "KeyM"].includes(e.code)) this.toMenu();
    };
    if (this.input.keyboard) this.input.keyboard.on("keydown", this.keyHandler);
    this.events.once("shutdown", () => {
      SoundFX.cancelSpeech();
      if (this.input.keyboard) this.input.keyboard.off("keydown", this.keyHandler);
    });
  }

  detail(key) {
    const r = this.registry;
    const pair = (s, t) => (r.get(s) !== undefined ? `${r.get(s)} / ${r.get(t)} BENAR` : "");
    if (key === "V") return pair("visualScore", "visualTotal");
    if (key === "A") return pair("auditoryScore", "auditoryTotal");
    if (key === "R") return pair("readScore", "readTotal");
    if (key === "K") return r.get("kinestheticScore") !== undefined ? `${r.get("kinestheticScore")} SAMPAH` : "";
    return "";
  }

  build() {
    const cx = DW / 2;
    const vark = getVark(this);

    const g = this.add.graphics().setDepth(5);
    drawPanel(g, cx - 410, 22, 820, 556);

    makeText(this, cx, 66, "HASIL GAYA BELAJARMU", { size: 20, color: css(COL.gold), stroke: css(COL.outline), strokeW: 8 }).setDepth(7);

    const barX = 360;
    const barW = 380;

    ORDER.forEach((k, i) => {
      const y = 128 + i * 58;
      const v = vark[k];

      const badge = this.add.graphics().setDepth(6);
      drawWood(badge, 88, y - 22, 44, 44, PAL.parch, { outline: 3, grain: false });
      makeText(this, 110, y, k, { size: 16, color: css(COL.ink) }).setDepth(7);

      makeText(this, 150, y - 8, VARK_INFO[k].nama, { size: 11, color: css(COL.cream), origin: [0, 0.5], stroke: css(COL.outline), strokeW: 4 }).setDepth(7);
      makeText(this, 150, y + 14, v === null ? "BELUM DIMAINKAN" : this.detail(k), { size: 7, color: css(COL.leafLight), origin: [0, 0.5] }).setDepth(7);

      const track = this.add.graphics().setDepth(6);
      track.fillStyle(COL.outline, 1);
      track.fillRect(barX - 4, y - 16, barW + 8, 32);
      track.fillStyle(0x1d3322, 1);
      track.fillRect(barX, y - 12, barW, 24);

      const bar = this.add.graphics().setDepth(7);
      const pct = makeText(this, barX + barW + 18, y, v === null ? "-" : "0%", { size: 12, color: css(COL.gold), origin: [0, 0.5], stroke: css(COL.outline), strokeW: 4 }).setDepth(7);

      if (v !== null) {
        const p = { v: 0 };
        this.tweens.add({
          targets: p,
          v,
          duration: 900,
          delay: 300 + i * 250,
          ease: "Sine.easeOut",
          onUpdate: () => {
            bar.clear();
            const w = Math.floor((barW * p.v) / 10) * 10;
            bar.fillStyle(BAR_COLOR[k], 1);
            bar.fillRect(barX, y - 12, w, 24);
            bar.fillStyle(0xffffff, 0.25);
            bar.fillRect(barX, y - 12, w, 5);
            pct.setText(`${Math.round(p.v * 100)}%`);
          },
        });
      }
    });

    // Gaya dominan (bisa lebih dari satu jika nilainya sama)
    const played = ORDER.filter((k) => vark[k] !== null);
    const box = this.add.graphics().setDepth(6);
    drawWood(box, cx - 360, 360, 720, 136, PAL.parch, { grain: false });

    let head;
    let body;
    if (!played.length) {
      head = "BELUM ADA SESI YANG DIMAINKAN";
      body = "Mainkan sesi-sesinya dulu dari menu utama.";
    } else {
      const best = Math.max(...played.map((k) => vark[k]));
      const top = played.filter((k) => Math.abs(vark[k] - best) < 0.001);
      if (top.length >= 3) {
        head = "GAYA BELAJARMU: MULTIMODAL";
        body = "Kamu seimbang di banyak gaya belajar. Gabungkan gambar, suara, bacaan, dan praktik saat belajar.";
      } else {
        head = "GAYA BELAJAR DOMINAN: " + top.map((k) => VARK_INFO[k].nama).join(" & ");
        body = top.map((k) => `${VARK_INFO[k].desk} ${VARK_INFO[k].tips}`).join("\n");
      }
      this.speakText = head.replace("READ / WRITE", "read write").toLowerCase();
    }

    this.headText = makeText(this, cx, 384, head, { size: 11, color: "#8a5a30" }).setDepth(7).setAlpha(0);
    this.bodyText = makeText(this, cx, 436, body, { size: 8, color: css(COL.ink), wrap: 660, spacing: 8 }).setDepth(7).setAlpha(0);

    makeText(this, cx, 512, "Hasil ini gambaran dari permainan, bukan tes gaya belajar resmi.", { size: 7, color: css(COL.cream) })
      .setDepth(7)
      .setAlpha(0.75);

    createButton(this, cx, 548, 280, 40, "MENU UTAMA", { size: 11, palN: PAL.woodHover, palH: PAL.wood, onClick: () => this.toMenu() }).setDepth(8);

    this.time.delayedCall(1600, () => {
      this.tweens.add({ targets: [this.headText, this.bodyText], alpha: 1, duration: 400 });
      if (played.length) {
        SoundFX.win();
        burst(this, cx, 384, { count: 34, speed: 280, colors: [COL.gold, COL.leaf, COL.leafLight, COL.cream], depth: 50 });
        if (SoundFX.enabled && this.speakText) this.time.delayedCall(900, () => !this.leaving && SoundFX.speak(this.speakText));
      }
    });
  }

  toMenu() {
    if (this.leaving) return;
    this.leaving = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("MainMenuScene"));
  }
}
