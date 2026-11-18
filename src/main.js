import Phaser from "phaser";

import BootScene from "./scenes/BootScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import IntroScene from "./scenes/IntroScene.js";
import Level1VScene from "./scenes/Level1VScene.js"; // Sesi 1 : Visual (drag & drop)
import Level2AScene from "./scenes/Level2AScene.js"; // Sesi 2 : Auditory
import Scene3Read from "./scenes/Scene3Read.js"; // Sesi 3 : Read/Write
import Level4KScene from "./scenes/Level4KScene.js"; // Sesi 4 : Kinestetik
import ResultScene from "./scenes/ResultScene.js"; // Hasil Sesi 4
import HasilVARKScene from "./scenes/HasilVARKScene.js"; // Hasil akhir VARK
import OptionScene from "./scenes/OptionScene.js";

// Alur: Boot → Menu → Intro → Visual → Auditory → Read → Kinestetik → Result → Hasil VARK
const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#10251f",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  render: {
    antialias: true,
    pixelArt: true,
    roundPixels: true,
  },
  scene: [BootScene, MainMenuScene, IntroScene, OptionScene, Level1VScene, Level2AScene, Scene3Read, Level4KScene, ResultScene, HasilVARKScene],
};

const game = new Phaser.Game(config);

// Untuk uji coba di Console (F12) saat `npm run dev`: window.ekoGame.scene.start("NamaScene")
if (import.meta.env.DEV) window.ekoGame = game;
