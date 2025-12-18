import Phaser from 'phaser';
import { HORSES, LANE_COLORS } from '../data/horses';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COLORS,
  SCENES,
} from '../config/GameConfig';
import type { RaceResult } from '../types';

export class ResultScene extends Phaser.Scene {
  private results: RaceResult[] = [];
  private laneResults: string[] = [];

  constructor() {
    super({ key: SCENES.RESULT });
  }

  init(data: { results: RaceResult[]; laneResults: string[] }): void {
    this.results = data.results || [];
    this.laneResults = data.laneResults || [];
  }

  create(): void {
    // 背景
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLORS.background);

    // タイトル
    this.add.text(GAME_WIDTH / 2, 50, '🏆 レース結果 🏆', {
      fontSize: '56px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 上位3頭を大きく表示
    this.displayTopThree();

    // 全順位表示
    this.displayAllResults();

    // もう一度ボタン
    this.createRetryButton();
  }

  private displayTopThree(): void {
    const topThree = this.results.slice(0, 3);
    const positions = [
      { x: GAME_WIDTH / 2, y: 180, scale: 1.5, medal: '🥇' },
      { x: GAME_WIDTH / 2 - 250, y: 200, scale: 1.2, medal: '🥈' },
      { x: GAME_WIDTH / 2 + 250, y: 200, scale: 1.2, medal: '🥉' },
    ];

    topThree.forEach((result, index) => {
      const pos = positions[index];
      const horse = HORSES.find(h => h.id === result.horseId);
      if (!horse) return;

      const container = this.add.container(pos.x, pos.y);

      // メダル
      const medal = this.add.text(0, -60 * pos.scale, pos.medal, {
        fontSize: `${48 * pos.scale}px`,
      }).setOrigin(0.5);
      container.add(medal);

      // 馬の表示
      const bg = this.add.ellipse(0, 0, 60 * pos.scale, 60 * pos.scale,
        Phaser.Display.Color.HexStringToColor(horse.color).color);
      bg.setStrokeStyle(3, 0xffffff);
      container.add(bg);

      const emoji = this.add.text(0, -2, '🐴', {
        fontSize: `${36 * pos.scale}px`,
      }).setOrigin(0.5);
      container.add(emoji);

      // 馬名
      const nameText = this.add.text(0, 45 * pos.scale, horse.name, {
        fontSize: `${18 * pos.scale}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(nameText);

      // 結果
      const resultText = this.add.text(0, 70 * pos.scale, result.result, {
        fontSize: `${16 * pos.scale}px`,
        color: '#FFD700',
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 },
      }).setOrigin(0.5);
      container.add(resultText);
    });
  }

  private displayAllResults(): void {
    const startY = 350;
    const cols = 5;
    const cellWidth = 350;
    const cellHeight = 45;

    this.add.text(GAME_WIDTH / 2, startY - 30, '全順位', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.results.forEach((result, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = GAME_WIDTH / 2 - (cols * cellWidth) / 2 + col * cellWidth + cellWidth / 2;
      const y = startY + row * cellHeight;

      const horse = HORSES.find(h => h.id === result.horseId);
      if (!horse) return;

      // 背景
      const bgColor = index < 3 ? 0x444444 : 0x222222;
      this.add.rectangle(x, y, cellWidth - 10, cellHeight - 5, bgColor)
        .setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(horse.color).color);

      // 順位
      const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#ffffff';
      this.add.text(x - cellWidth / 2 + 15, y, `${result.rank}位`, {
        fontSize: '16px',
        color: rankColor,
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);

      // 馬色
      this.add.rectangle(x - cellWidth / 2 + 55, y, 16, 16,
        Phaser.Display.Color.HexStringToColor(horse.color).color);

      // 馬名
      this.add.text(x - cellWidth / 2 + 75, y, horse.name, {
        fontSize: '14px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);

      // 結果
      this.add.text(x + cellWidth / 2 - 15, y, result.result, {
        fontSize: '12px',
        color: '#FFD700',
      }).setOrigin(1, 0.5);
    });
  }

  private createRetryButton(): void {
    const button = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 60);

    const bg = this.add.rectangle(0, 0, 250, 50, 0x228B22);
    bg.setStrokeStyle(3, 0x32CD32);
    button.add(bg);

    const text = this.add.text(0, 0, '🔄 もう一度遊ぶ', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    button.add(text);

    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      bg.setFillStyle(0x32CD32);
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x228B22);
    });

    bg.on('pointerdown', () => {
      this.scene.start(SCENES.TITLE);
    });
  }
}
