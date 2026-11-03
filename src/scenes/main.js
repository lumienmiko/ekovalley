import Phaser from "phaser";

import BootScene from "./scenes/BootScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import IntroScene from "./scenes/IntroScene.js";
import Level1VScene from "./scenes/Level1VScene.js";
import Level2AScene from "./scenes/Level2AScene.js";
import Scene3Read from "./scenes/Scene3Read.js";
import OptionScene from "./scenes/OptionScene.js";
import ResultScene from "./scenes/ResultScene.js";

// ─── CEK NAMA KEY SETIAP SCENE ───
console.log("=========================================");
console.log("MENGECEK NAMA KEY SCENE:");
const scenesToTest = [
  ["BootScene", BootScene],
  ["MainMenuScene", MainMenuScene],
  ["IntroScene", IntroScene],
  ["Level1VScene", Level1VScene],
  ["Level2AScene", Level2AScene],
  ["Scene3Read", Scene3Read], // ← Ini yang kita pantau
  ["OptionScene", OptionScene],
  ["ResultScene", ResultScene],
];

for (const [namaImport, SceneClass] of scenesToTest) {
  try {
    const temp = new SceneClass();
    const keyAsli = temp.scene.key;
    if (namaImport === "Scene3Read") {
      console.log(`%c👉 FILE Scene3Read.js PUNYA KEY: "${keyAsli}"`, "color: yellow; font-weight: bold; font-size: 14px;");
    } else {
      console.log(`- ${namaImport} → key: "${keyAsli}"`);
    }
  } catch (e) {
    console.error(`❌ GAGAL LOAD ${namaImport}:`, e.message);
  }
}
console.log("=========================================");

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
  scene: [BootScene, MainMenuScene, IntroScene, Level1VScene, Level2AScene, Scene3Read, OptionScene, ResultScene],
};

new Phaser.Game(config);
