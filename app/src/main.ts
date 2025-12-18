import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { PaddockScene } from './scenes/PaddockScene';
import { RaceScene } from './scenes/RaceScene';
import { ResultScene } from './scenes/ResultScene';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/GameConfig';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: COLORS.background,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  dom: {
    createContainer: true,
  },
  scene: [TitleScene, PaddockScene, RaceScene, ResultScene],
};

new Phaser.Game(config);
