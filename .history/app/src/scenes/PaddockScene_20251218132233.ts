import Phaser from 'phaser';
import { HORSES } from '../data/horses';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COURSE_CONFIG,
  SCENES,
  RACE_MODES,
  RaceMode,
} from '../config/GameConfig';
import type { HorseData } from '../types';

export class PaddockScene extends Phaser.Scene {
  private selectedMode: RaceMode = 'LONG';
  private modeButtons: Map<RaceMode, { bg: Phaser.GameObjects.Rectangle; inner: Phaser.GameObjects.Rectangle }> = new Map();
  private currentPage: number = 0;
  private totalPages: number = 3;
  private cardContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: SCENES.PADDOCK });
  }

  create(): void {
    this.cameras.main.fadeIn(300);
    this.currentPage = 0;

    // 背景
    this.createBackground();

    // ヘッダー
    this.createHeader();

    // 馬カードギャラリー
    this.createHorseGallery();

    // ページネーション
    this.createPagination();

    // モード選択
    this.createModeSelection();

    // スタートボタン
    this.createStartButton();
  }

  private createBackground(): void {
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a2a1a, 0x1a2a1a, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createHeader(): void {
    // ヘッダー背景
    const headerBg = this.add.graphics();
    headerBg.fillStyle(0x000000, 0.6);
    headerBg.fillRect(0, 0, GAME_WIDTH, 90);

    // タイトル
    this.add.text(GAME_WIDTH / 2, 30, '🏇 パドック - 出走馬一覧', {
      fontSize: '42px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 68, '出走馬を確認してレースを開始しよう', {
      fontSize: '20px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // 戻るボタン
    const backBtn = this.add.container(100, 45);
    const backBg = this.add.rectangle(0, 0, 120, 50, 0x444444, 0.9);
    backBg.setStrokeStyle(2, 0x666666);
    backBtn.add(backBg);
    backBtn.add(this.add.text(0, 0, '← 戻る', {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    backBg.setInteractive({ useHandCursor: true });
    backBg.on('pointerover', () => backBg.setFillStyle(0x555555));
    backBg.on('pointerout', () => backBg.setFillStyle(0x444444));
    backBg.on('pointerdown', () => {
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start(SCENES.TITLE));
    });
  }

  private createHorseGallery(): void {
    // ギャラリーエリア背景
    const galleryBg = this.add.graphics();
    galleryBg.fillStyle(0x000000, 0.3);
    galleryBg.fillRoundedRect(20, 95, GAME_WIDTH - 40, 460, 15);

    // カードコンテナ
    this.cardContainer = this.add.container(0, 0);
    this.showPage(0);
  }

  private showPage(page: number): void {
    this.currentPage = page;
    this.cardContainer.removeAll(true);

    const horsesPerPage = 5;
    const startIndex = page * horsesPerPage;
    const endIndex = Math.min(startIndex + horsesPerPage, HORSES.length);

    const cardWidth = 320;
    const cardHeight = 420;
    const gap = 20;
    const totalWidth = 5 * cardWidth + 4 * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    for (let i = startIndex; i < endIndex; i++) {
      const col = i - startIndex;
      const x = startX + col * (cardWidth + gap);
      const y = 340;

      const card = this.createHorseCard(HORSES[i], x, y, cardWidth, cardHeight);
      this.cardContainer.add(card);
    }
  }

  private createHorseCard(horse: HorseData, x: number, y: number, cardWidth: number, cardHeight: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // カード影
    const shadow = this.add.rectangle(5, 5, cardWidth, cardHeight, 0x000000, 0.6);
    container.add(shadow);

    // カード背景（より濃い色で読みやすく）
    const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0x0d0d1a, 0.98);
    bg.setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(horse.color).color);
    container.add(bg);

    // カラーアクセント（上部）- より目立つように
    const accent = this.add.rectangle(0, -cardHeight / 2 + 35, cardWidth - 6, 68,
      Phaser.Display.Color.HexStringToColor(horse.color).color, 0.5);
    container.add(accent);

    // 番号バッジ
    const badge = this.add.ellipse(-cardWidth / 2 + 40, -cardHeight / 2 + 35, 50, 50,
      Phaser.Display.Color.HexStringToColor(horse.color).color);
    badge.setStrokeStyle(3, 0xffffff);
    container.add(badge);
    container.add(this.add.text(-cardWidth / 2 + 40, -cardHeight / 2 + 35, `${horse.id}`, {
      fontSize: '26px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5));

    // 馬アイコン
    container.add(this.add.text(cardWidth / 2 - 40, -cardHeight / 2 + 35, '🐴', {
      fontSize: '38px',
    }).setOrigin(0.5));

    // 馬名（より大きく、読みやすく）
    container.add(this.add.text(0, -cardHeight / 2 + 85, horse.name, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5));

    // タイプ
    const typeBg = this.add.rectangle(0, -cardHeight / 2 + 115, 130, 26,
      Phaser.Display.Color.HexStringToColor(horse.color).color, 0.7);
    typeBg.setStrokeStyle(2, 0xffffff);
    container.add(typeBg);
    container.add(this.add.text(0, -cardHeight / 2 + 115, horse.type, {
      fontSize: '15px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1,
    }).setOrigin(0.5));

    // ステータスセクション（コンパクトに）
    const statsY = -cardHeight / 2 + 145;
    const barWidth = 130;
    const stats = [
      { label: 'SPD', value: horse.stats.speed, max: 1.5, color: 0xFF6B6B },
      { label: 'INT', value: horse.stats.intelligence, max: 2.0, color: 0x4ECDC4 },
      { label: 'POW', value: horse.stats.power, max: 2.5, color: 0xFFD93D },
    ];

    stats.forEach((stat, i) => {
      const statY = statsY + i * 28;

      // ラベル（より見やすく）
      container.add(this.add.text(-cardWidth / 2 + 20, statY, stat.label, {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0, 0.5));

      // バー背景
      const barBg = this.add.rectangle(10, statY, barWidth, 12, 0x222233);
      barBg.setStrokeStyle(1, 0x444455);
      container.add(barBg);

      // バー値
      const fillWidth = (stat.value / stat.max) * barWidth;
      const barFill = this.add.rectangle(10 - barWidth / 2 + fillWidth / 2, statY, fillWidth, 10, stat.color);
      container.add(barFill);

      // 数値（より見やすく）
      container.add(this.add.text(cardWidth / 2 - 20, statY, stat.value.toFixed(1), {
        fontSize: '15px',
        color: '#ffffff',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(1, 0.5));
    });

    // 能力セクション（ステータスの下に配置）
    const abilityY = statsY + 120;
    const abilityBgHeight = 95;
    const abilityBg = this.add.rectangle(0, abilityY, cardWidth - 20, abilityBgHeight, 0x1a1a3a, 0.95);
    abilityBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(horse.color).color, 0.6);
    container.add(abilityBg);

    // 能力ラベル
    container.add(this.add.text(0, abilityY - 32, '⭐ 特殊能力', {
      fontSize: '13px',
      color: '#88aacc',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    // 能力名（より目立つように）
    container.add(this.add.text(0, abilityY - 10, horse.ability.name, {
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5));

    // 能力説明（読みやすく、カード内に収まるように）
    container.add(this.add.text(0, abilityY + 10, horse.ability.description, {
      fontSize: '11px',
      color: '#dddddd',
      wordWrap: { width: cardWidth - 35 },
      align: 'center',
      lineSpacing: 1,
    }).setOrigin(0.5, 0));

    return container;
  }

  private createPagination(): void {
    const paginationY = 580;

    // 左矢印
    const leftBtn = this.add.container(GAME_WIDTH / 2 - 150, paginationY);
    const leftBg = this.add.rectangle(0, 0, 60, 50, 0x444444, 0.9);
    leftBg.setStrokeStyle(2, 0x666666);
    leftBtn.add(leftBg);
    leftBtn.add(this.add.text(0, 0, '◀', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5));

    leftBg.setInteractive({ useHandCursor: true });
    leftBg.on('pointerover', () => leftBg.setFillStyle(0x555555));
    leftBg.on('pointerout', () => leftBg.setFillStyle(0x444444));
    leftBg.on('pointerdown', () => {
      if (this.currentPage > 0) {
        this.showPage(this.currentPage - 1);
        this.updatePageIndicator();
      }
    });

    // ページ番号
    this.add.text(GAME_WIDTH / 2, paginationY, '', {
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5).setName('pageIndicator');
    this.updatePageIndicator();

    // 右矢印
    const rightBtn = this.add.container(GAME_WIDTH / 2 + 150, paginationY);
    const rightBg = this.add.rectangle(0, 0, 60, 50, 0x444444, 0.9);
    rightBg.setStrokeStyle(2, 0x666666);
    rightBtn.add(rightBg);
    rightBtn.add(this.add.text(0, 0, '▶', {
      fontSize: '28px',
      color: '#ffffff',
    }).setOrigin(0.5));

    rightBg.setInteractive({ useHandCursor: true });
    rightBg.on('pointerover', () => rightBg.setFillStyle(0x555555));
    rightBg.on('pointerout', () => rightBg.setFillStyle(0x444444));
    rightBg.on('pointerdown', () => {
      if (this.currentPage < this.totalPages - 1) {
        this.showPage(this.currentPage + 1);
        this.updatePageIndicator();
      }
    });
  }

  private updatePageIndicator(): void {
    const indicator = this.children.getByName('pageIndicator') as Phaser.GameObjects.Text;
    if (indicator) {
      indicator.setText(`${this.currentPage + 1} / ${this.totalPages}`);
    }
  }

  private createModeSelection(): void {
    const startY = 640;

    // セクション背景
    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x000000, 0.4);
    sectionBg.fillRoundedRect(GAME_WIDTH / 2 - 400, startY - 10, 800, 100, 15);

    this.add.text(GAME_WIDTH / 2, startY + 10, '⏱ レース時間を選択', {
      fontSize: '24px',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const modes: RaceMode[] = ['SHORT', 'MEDIUM', 'LONG'];
    const buttonWidth = 200;
    const gap = 30;
    const totalWidth = modes.length * buttonWidth + (modes.length - 1) * gap;
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + buttonWidth / 2;

    modes.forEach((mode, index) => {
      const x = startX + index * (buttonWidth + gap);
      const modeConfig = RACE_MODES[mode];
      const isSelected = mode === this.selectedMode;

      const container = this.add.container(x, startY + 55);

      // 影
      const shadow = this.add.rectangle(4, 4, buttonWidth, 55, 0x000000, 0.4);
      container.add(shadow);

      // ボタン背景
      const bg = this.add.rectangle(0, 0, buttonWidth, 55,
        isSelected ? 0x2a5a8a : 0x2a2a3a);
      bg.setStrokeStyle(3, isSelected ? 0x4a9aca : 0x3a3a4a);
      container.add(bg);

      // 内側のハイライト
      const inner = this.add.rectangle(0, -5, buttonWidth - 10, 40,
        isSelected ? 0x3a7aba : 0x3a3a4a);
      container.add(inner);

      // テキスト
      container.add(this.add.text(0, -8, modeConfig.name, {
        fontSize: '26px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5));

      container.add(this.add.text(0, 18, modeConfig.label, {
        fontSize: '14px',
        color: isSelected ? '#aaccee' : '#888888',
      }).setOrigin(0.5));

      this.modeButtons.set(mode, { bg, inner });

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => this.selectMode(mode));
      bg.on('pointerover', () => {
        if (mode !== this.selectedMode) {
          bg.setFillStyle(0x3a3a4a);
        }
      });
      bg.on('pointerout', () => {
        if (mode !== this.selectedMode) {
          bg.setFillStyle(0x2a2a3a);
        }
      });
    });
  }

  private selectMode(mode: RaceMode): void {
    this.selectedMode = mode;

    this.modeButtons.forEach((buttons, m) => {
      const isSelected = m === mode;
      buttons.bg.setFillStyle(isSelected ? 0x2a5a8a : 0x2a2a3a);
      buttons.bg.setStrokeStyle(3, isSelected ? 0x4a9aca : 0x3a3a4a);
      buttons.inner.setFillStyle(isSelected ? 0x3a7aba : 0x3a3a4a);
    });
  }

  private createStartButton(): void {
    const button = this.add.container(GAME_WIDTH / 2, 820);

    // 影
    const shadow = this.add.rectangle(6, 6, 350, 85, 0x000000, 0.5);
    button.add(shadow);

    // ボタン外枠
    const bgOuter = this.add.rectangle(0, 0, 350, 85, 0x1a6b1a);
    bgOuter.setStrokeStyle(4, 0x2ecc71);
    button.add(bgOuter);

    // ボタン内側
    const bgInner = this.add.rectangle(0, -5, 330, 65, 0x27ae60);
    button.add(bgInner);

    // テキスト
    const text = this.add.text(0, 0, '🏁  レーススタート', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    button.add(text);

    bgOuter.setInteractive({ useHandCursor: true });

    bgOuter.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
      bgOuter.setFillStyle(0x2ecc71);
      bgInner.setFillStyle(0x3ddc84);
    });

    bgOuter.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
      bgOuter.setFillStyle(0x1a6b1a);
      bgInner.setFillStyle(0x27ae60);
    });

    bgOuter.on('pointerdown', () => {
      this.startRace();
    });

    // パルス
    this.tweens.add({
      targets: button,
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ヒント
    this.add.text(GAME_WIDTH / 2, 885, '15頭の馬が順位を競います', {
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);
  }

  private startRace(): void {
    // 順位をレーン結果として設定
    const laneResults: string[] = [];
    for (let i = 0; i < COURSE_CONFIG.laneCount; i++) {
      laneResults.push(`${i + 1}位`);
    }

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.RACE, {
        laneResults: laneResults,
        raceMode: this.selectedMode,
      });
    });
  }
}
