import Phaser from 'phaser';
import { HORSES } from '../data/horses';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SCENES,
} from '../config/GameConfig';
import type { RaceResult } from '../types';

export class ResultScene extends Phaser.Scene {
  private results: RaceResult[] = [];
  private bgm!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: SCENES.RESULT });
  }

  preload(): void {
    // BGMをロード
    if (!this.cache.audio.exists('result-bgm')) {
      this.load.audio('result-bgm', '/horse-racing-vip.mp3');
    }
    // ボタン音をロード
    if (!this.cache.audio.exists('button-click')) {
      this.load.audio('button-click', '/button.mp3');
    }
  }

  init(data: { results: RaceResult[] }): void {
    this.results = data.results || [];
  }

  create(): void {
    // BGM再生
    this.sound.stopAll();
    this.bgm = this.sound.add('result-bgm', { loop: true, volume: 0.5 });
    this.bgm.play();
    // フェードイン
    this.cameras.main.fadeIn(500);

    // グラデーション背景
    this.createBackground();

    // タイトル（装飾付き）
    this.createTitle();

    // 上位3頭を大きく表示
    this.displayTopThree();

    // 全順位表示
    this.displayAllResults();

    // ボタン群
    this.createButtons();

    // 紙吹雪エフェクト
    this.createConfetti();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();

    // 上部：ダークブルー
    graphics.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x1a1a4a, 0x1a1a4a, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT / 2);

    // 下部：ダークパープル
    graphics.fillGradientStyle(0x1a1a4a, 0x1a1a4a, 0x2a1a3a, 0x2a1a3a, 1);
    graphics.fillRect(0, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT / 2);

    // 中央のグロー
    const glow = this.add.ellipse(GAME_WIDTH / 2, 250, 1000, 500, 0xffd700, 0.08);
    this.tweens.add({
      targets: glow,
      alpha: 0.04,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createTitle(): void {
    const container = this.add.container(GAME_WIDTH / 2, 55);

    // 背景装飾
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000000, 0.4);
    titleBg.fillRoundedRect(-250, -35, 500, 70, 15);
    container.add(titleBg);

    // タイトルテキスト
    const shadow = this.add.text(3, 3, '🏆 レース結果 🏆', {
      fontSize: '48px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.5);
    container.add(shadow);

    const title = this.add.text(0, 0, '🏆 レース結果 🏆', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B6914',
      strokeThickness: 2,
    }).setOrigin(0.5);
    container.add(title);

    // タイトルアニメーション
    this.tweens.add({
      targets: container,
      y: 60,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createConfetti(): void {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];

    for (let i = 0; i < 30; i++) {
      const x = Math.random() * GAME_WIDTH;
      const confetti = this.add.text(x, -50, ['✦', '★', '●', '◆'][Math.floor(Math.random() * 4)], {
        fontSize: `${12 + Math.random() * 12}px`,
        color: colors[Math.floor(Math.random() * colors.length)],
      }).setAlpha(0.7);

      this.tweens.add({
        targets: confetti,
        y: GAME_HEIGHT + 50,
        x: x + (Math.random() - 0.5) * 200,
        rotation: Math.random() * Math.PI * 4,
        duration: 4000 + Math.random() * 3000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }
  }

  private displayTopThree(): void {
    const topThree = this.results.slice(0, 3);
    const positions = [
      { x: GAME_WIDTH / 2, y: 180, scale: 1.4, medal: '🥇', color: 0xffd700, podiumH: 80, rank: '1st' },
      { x: GAME_WIDTH / 2 - 300, y: 195, scale: 1.1, medal: '🥈', color: 0xc0c0c0, podiumH: 55, rank: '2nd' },
      { x: GAME_WIDTH / 2 + 300, y: 195, scale: 1.1, medal: '🥉', color: 0xcd7f32, podiumH: 40, rank: '3rd' },
    ];

    // 表彰台背景
    const podiumBg = this.add.graphics();
    podiumBg.fillStyle(0x000000, 0.4);
    podiumBg.fillRoundedRect(GAME_WIDTH / 2 - 480, 100, 960, 230, 15);

    topThree.forEach((result, index) => {
      const pos = positions[index];
      const horse = HORSES.find(h => h.id === result.horseId);
      if (!horse) return;

      const container = this.add.container(pos.x, pos.y);

      // 表彰台
      const podium = this.add.graphics();
      podium.fillStyle(pos.color, 0.3);
      podium.fillRoundedRect(-60, 60 * pos.scale, 120, pos.podiumH, { tl: 10, tr: 10, bl: 0, br: 0 });
      podium.lineStyle(2, pos.color, 0.8);
      podium.strokeRoundedRect(-60, 60 * pos.scale, 120, pos.podiumH, { tl: 10, tr: 10, bl: 0, br: 0 });
      container.add(podium);

      // メダル（アニメーション付き）
      const medal = this.add.text(0, -65 * pos.scale, pos.medal, {
        fontSize: `${48 * pos.scale}px`,
      }).setOrigin(0.5);
      container.add(medal);

      this.tweens.add({
        targets: medal,
        y: medal.y + 5,
        duration: 1000 + index * 200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // 馬の表示（グロー付き）
      const glow = this.add.ellipse(0, 0, 80 * pos.scale, 80 * pos.scale,
        Phaser.Display.Color.HexStringToColor(horse.color).color, 0.3);
      container.add(glow);

      const bg = this.add.ellipse(0, 0, 60 * pos.scale, 60 * pos.scale,
        Phaser.Display.Color.HexStringToColor(horse.color).color);
      bg.setStrokeStyle(4, 0xffffff);
      container.add(bg);

      const emoji = this.add.text(0, -2, '🐴', {
        fontSize: `${36 * pos.scale}px`,
      }).setOrigin(0.5);
      container.add(emoji);

      // 馬名（装飾付き）
      const nameBg = this.add.rectangle(0, 50 * pos.scale, 180, 35, 0x000000, 0.7);
      nameBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(horse.color).color);
      container.add(nameBg);

      const nameText = this.add.text(0, 50 * pos.scale, horse.name, {
        fontSize: `${18 * pos.scale}px`,
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(nameText);

      // 景品表示
      const prizeBg = this.add.rectangle(0, 85 * pos.scale, 200, 30, 0xffd700, 0.2);
      prizeBg.setStrokeStyle(2, 0xffd700);
      container.add(prizeBg);

      const prizeText = this.add.text(0, 85 * pos.scale, `🎁 ${result.result}`, {
        fontSize: `${14 * pos.scale}px`,
        color: '#FFD700',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(prizeText);

      // 登場アニメーション
      container.setAlpha(0).setScale(0.5);
      this.tweens.add({
        targets: container,
        alpha: 1,
        scale: 1,
        duration: 500,
        delay: index * 200,
        ease: 'Back.easeOut',
      });
    });
  }

  private displayAllResults(): void {
    const startY = 380;
    const cols = 3;
    const cellWidth = 550;
    const cellHeight = 55;

    // セクション背景
    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x000000, 0.4);
    sectionBg.fillRoundedRect(50, startY - 50, GAME_WIDTH - 100, 320, 15);

    // セクションタイトル
    this.add.text(GAME_WIDTH / 2, startY - 30, '📋 全順位・景品', {
      fontSize: '22px',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.results.forEach((result, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = GAME_WIDTH / 2 - (cols * cellWidth) / 2 + col * cellWidth + cellWidth / 2;
      const y = startY + 15 + row * cellHeight;

      const horse = HORSES.find(h => h.id === result.horseId);
      if (!horse) return;

      // 背景（グラデーション風）
      const bgColor = index < 3 ? 0x3a3a5a : 0x2a2a4a;
      const cellBg = this.add.rectangle(x, y, cellWidth - 15, cellHeight - 8, bgColor, 0.8);
      cellBg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(horse.color).color);

      // 順位メダル/数字
      const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '';
      const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#aaaaaa';

      if (rankEmoji) {
        this.add.text(x - cellWidth / 2 + 20, y, rankEmoji, {
          fontSize: '18px',
        }).setOrigin(0, 0.5);
      } else {
        this.add.text(x - cellWidth / 2 + 25, y, `${result.rank}位`, {
          fontSize: '15px',
          color: rankColor,
          fontStyle: 'bold',
        }).setOrigin(0, 0.5);
      }

      // 馬色インジケータ
      const colorIndicator = this.add.rectangle(x - cellWidth / 2 + 70, y, 22, 22,
        Phaser.Display.Color.HexStringToColor(horse.color).color);
      colorIndicator.setStrokeStyle(1, 0xffffff);

      // 馬名
      this.add.text(x - cellWidth / 2 + 95, y, horse.name, {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: index < 3 ? 'bold' : 'normal',
      }).setOrigin(0, 0.5);

      // 景品表示
      const prizeColor = index < 3 ? '#FFD700' : index < 6 ? '#90EE90' : index < 9 ? '#aaaaaa' : '#FF6B6B';
      this.add.text(x + cellWidth / 2 - 20, y, result.result, {
        fontSize: '14px',
        color: prizeColor,
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
    });
  }

  private createButtons(): void {
    const buttonY = GAME_HEIGHT - 50;

    // もう一度ボタン
    const retryButton = this.createButton(GAME_WIDTH / 2 - 150, buttonY, '🔄 もう一度', 0x228B22, 0x32CD32, () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start(SCENES.PADDOCK);
      });
    });

    // タイトルに戻るボタン
    const _titleButton = this.createButton(GAME_WIDTH / 2 + 150, buttonY, '🏠 タイトル', 0x2a4a8a, 0x4a6aaa, () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => {
        this.scene.start(SCENES.TITLE);
      });
    });

    // パルスアニメーション
    this.tweens.add({
      targets: retryButton,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    bgColor: number,
    hoverColor: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    // 影
    const shadow = this.add.rectangle(4, 4, 220, 55, 0x000000, 0.5);
    button.add(shadow);

    // 背景
    const bg = this.add.rectangle(0, 0, 220, 55, bgColor);
    bg.setStrokeStyle(3, hoverColor);
    button.add(bg);

    // ハイライト
    const highlight = this.add.rectangle(0, -10, 200, 20, hoverColor, 0.3);
    button.add(highlight);

    // テキスト
    const text = this.add.text(0, 0, label, {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5);
    button.add(text);

    // インタラクション
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Power2',
      });
      bg.setFillStyle(hoverColor);
    });

    bg.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2',
      });
      bg.setFillStyle(bgColor);
    });

    bg.on('pointerdown', () => {
      try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
      onClick();
    });

    return button;
  }
}
