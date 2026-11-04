import Phaser from "phaser";

import BootScene from "./scenes/BootScene.js";
import MainMenuScene from "./scenes/MainMenuScene.js";
import IntroScene from "./scenes/IntroScene.js";
import Level1VScene from "./scenes/Level1VScene.js";
import Level2AScene from "./scenes/Level2AScene.js";
import Scene3Read from "./scenes/Scene3Read.js";
import OptionScene from "./scenes/OptionScene.js";
import ResultScene from "./scenes/ResultScene.js";

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
  scene: [BootScene, MainMenuScene, IntroScene, OptionScene, Level1VScene, Level2AScene, Scene3Read, ResultScene],
};

new Phaser.Game(config);
