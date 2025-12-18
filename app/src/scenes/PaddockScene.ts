import Phaser from 'phaser';
import { HORSES } from '../data/horses';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COURSE_CONFIG,
  SCENES,
  RACE_MODES,
  RaceMode,
  CONDITION_CONFIG,
  CONDITION_WEIGHTS,
  SPECIAL_DAY_CONFIG,
  SPECIAL_DAY_WEIGHTS,
  SpecialDayType,
} from '../config/GameConfig';
import type { HorseData, HorseCondition } from '../types';

export class PaddockScene extends Phaser.Scene {
  private selectedMode: RaceMode = 'LONG';
  private modeButtons: Map<RaceMode, { bg: Phaser.GameObjects.Rectangle; inner: Phaser.GameObjects.Rectangle }> = new Map();
  private currentPage: number = 0;
  private totalPages: number = 3;
  private cardContainer!: Phaser.GameObjects.Container;
  private loadedPrizes: string[] = [];
  private prizesContainer!: Phaser.GameObjects.Container;
  private fileInput!: HTMLInputElement;
  private horseConditions: HorseCondition[] = [];
  private riderPreset: string[] = [];
  private horseRiders: string[] = [];
  private riderSelects: HTMLSelectElement[] = [];
  private specialDay: SpecialDayType = 'normal';

  constructor() {
    super({ key: SCENES.PADDOCK });
  }

  init(data: { riderPreset?: string[] }): void {
    this.riderPreset = data.riderPreset || [];
  }

  preload(): void {
    // BGMをロード（まだロードされていなければ）
    if (!this.cache.audio.exists('paddock-bgm')) {
      this.load.audio('paddock-bgm', '/christmas-happy-background-442036.mp3');
    }
    // ボタン音をロード
    if (!this.cache.audio.exists('button-click')) {
      this.load.audio('button-click', '/button.mp3');
    }
  }

  create(): void {
    // タイトル画面のBGMを停止し、パドックBGMを再生
    this.sound.stopAll();
    const bgm = this.sound.add('paddock-bgm', { loop: true, volume: 0.5 });
    bgm.play();
    this.cameras.main.fadeIn(300);
    this.currentPage = 0;
    this.loadedPrizes = [];
    // riderPresetはinit()で設定済み
    this.horseRiders = new Array(HORSES.length).fill('');
    this.riderSelects = [];

    // 調子を生成
    this.generateConditions();

    // 特別な日を生成
    this.generateSpecialDay();

    // 背景
    this.createBackground();

    // ヘッダー
    this.createHeader();

    // 特別な日を右上に表示
    this.createSpecialDayDisplay();

    // 馬カードギャラリー
    this.createHorseGallery();

    // ページネーション
    this.createPagination();

    // JSON読み込みセクション
    this.createJsonLoadSection();

    // モード選択
    this.createModeSelection();

    // スタートボタン
    this.createStartButton();

    // シーン終了時にHTML要素を削除
    this.events.on('shutdown', () => {
      if (this.fileInput) {
        this.fileInput.remove();
      }
      this.cleanupRiderSelects();
    });
  }

  private cleanupRiderSelects(): void {
    this.riderSelects.forEach(select => select.remove());
    this.riderSelects = [];
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
      try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
      this.cameras.main.fadeOut(300);
      this.time.delayedCall(300, () => this.scene.start(SCENES.TITLE));
    });
  }

  private createHorseGallery(): void {
    // ギャラリーエリア背景
    const galleryBg = this.add.graphics();
    galleryBg.fillStyle(0x000000, 0.3);
    galleryBg.fillRoundedRect(20, 95, GAME_WIDTH - 40, 490, 15);

    // カードコンテナ
    this.cardContainer = this.add.container(0, 0);
    this.showPage(0);
  }

  private showPage(page: number): void {
    this.currentPage = page;
    this.cardContainer.removeAll(true);

    // 既存の乗馬者選択セレクトを削除
    this.cleanupRiderSelects();

    const horsesPerPage = 5;
    const startIndex = page * horsesPerPage;
    const endIndex = Math.min(startIndex + horsesPerPage, HORSES.length);

    const cardWidth = 320;
    const cardHeight = 450;
    const gap = 20;
    const totalWidth = 5 * cardWidth + 4 * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    // HTML要素の位置計算用
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvasRect.width / GAME_WIDTH;
    const scaleY = canvasRect.height / GAME_HEIGHT;

    for (let i = startIndex; i < endIndex; i++) {
      const col = i - startIndex;
      const x = startX + col * (cardWidth + gap);
      const y = 340;

      const card = this.createHorseCard(HORSES[i], x, y, cardWidth, cardHeight, i);
      this.cardContainer.add(card);

      // 乗馬者選択用セレクトボックスを作成
      this.createRiderSelect(i, x, y + cardHeight / 2 - 15, scaleX, scaleY, canvasRect);
    }
  }

  private createRiderSelect(horseIndex: number, x: number, y: number, scaleX: number, scaleY: number, canvasRect: DOMRect): void {
    const select = document.createElement('select');
    select.style.position = 'absolute';
    select.style.left = `${canvasRect.left + (x - 70) * scaleX}px`;
    select.style.top = `${canvasRect.top + y * scaleY}px`;
    select.style.width = `${140 * scaleX}px`;
    select.style.height = `${24 * scaleY}px`;
    select.style.fontSize = `${12 * scaleY}px`;
    select.style.padding = '2px';
    select.style.borderRadius = '4px';
    select.style.border = '1px solid #4a4a6a';
    select.style.backgroundColor = '#2a2a4a';
    select.style.color = '#ffffff';
    select.style.zIndex = '100';

    // 空のオプション
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.text = '-- 選択 --';
    select.appendChild(emptyOption);

    // プリセットからオプションを追加
    this.riderPreset.forEach(rider => {
      const option = document.createElement('option');
      option.value = rider;
      option.text = rider;
      if (this.horseRiders[horseIndex] === rider) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // 選択済みの値を復元
    if (this.horseRiders[horseIndex]) {
      select.value = this.horseRiders[horseIndex];
    }

    select.addEventListener('change', () => {
      this.horseRiders[horseIndex] = select.value;
    });

    document.body.appendChild(select);
    this.riderSelects.push(select);
  }

  private createHorseCard(horse: HorseData, x: number, y: number, cardWidth: number, cardHeight: number, horseIndex: number): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);
    const condition = this.horseConditions[horseIndex] || 'normal';
    const conditionConfig = CONDITION_CONFIG[condition];

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

    // 調子表示（番号バッジの右）
    const conditionBg = this.add.rectangle(-cardWidth / 2 + 110, -cardHeight / 2 + 35, 70, 24,
      Phaser.Display.Color.HexStringToColor(conditionConfig.color).color, 0.9);
    conditionBg.setStrokeStyle(1, 0xffffff);
    container.add(conditionBg);
    container.add(this.add.text(-cardWidth / 2 + 110, -cardHeight / 2 + 35, `${conditionConfig.emoji}${conditionConfig.name}`, {
      fontSize: '13px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 1,
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
      { label: 'STA', value: horse.stats.stamina, max: 2.0, color: 0x9B59B6 },
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
    const abilityY = statsY + 205;
    const abilityBgHeight = 115;
    const abilityBg = this.add.rectangle(0, abilityY, cardWidth - 16, abilityBgHeight, 0x1a1a3a, 0.95);
    abilityBg.setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(horse.color).color, 0.6);
    container.add(abilityBg);

    // 能力ラベル
    container.add(this.add.text(0, abilityY - 42, '⭐ 特殊能力', {
      fontSize: '14px',
      color: '#88aacc',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    // 能力名（より目立つように）
    container.add(this.add.text(0, abilityY - 18, horse.ability.name, {
      fontSize: '18px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5));

    // 能力説明（大きく読みやすく）
    container.add(this.add.text(0, abilityY + 5, horse.ability.description, {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: cardWidth - 30 },
      align: 'center',
      lineSpacing: 3,
    }).setOrigin(0.5, 0));

    // 乗馬者選択セクション
    const riderY = cardHeight / 2 - 35;
    container.add(this.add.text(0, riderY, '👤 乗馬者', {
      fontSize: '12px',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    return container;
  }

  private createPagination(): void {
    const paginationY = 605;

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
        try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
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
        try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
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

  private createJsonLoadSection(): void {
    const sectionY = 640;

    // セクション背景
    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x000000, 0.4);
    sectionBg.fillRoundedRect(20, sectionY, GAME_WIDTH - 40, 120, 15);

    // タイトル
    this.add.text(40, sectionY + 15, '🎁 景品/罰ゲーム設定', {
      fontSize: '22px',
      color: '#FFD700',
      fontStyle: 'bold',
    });

    // JSON読み込みボタン
    const loadBtn = this.add.container(200, sectionY + 75);
    const loadBg = this.add.rectangle(0, 0, 180, 45, 0x4a4a6a, 0.9);
    loadBg.setStrokeStyle(2, 0x6a6a8a);
    loadBtn.add(loadBg);
    loadBtn.add(this.add.text(0, 0, '📂 JSONを読み込む', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    loadBg.setInteractive({ useHandCursor: true });
    loadBg.on('pointerover', () => loadBg.setFillStyle(0x5a5a7a));
    loadBg.on('pointerout', () => loadBg.setFillStyle(0x4a4a6a));
    loadBg.on('pointerdown', () => {
      try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
      this.openFileDialog();
    });

    // デフォルト読み込みボタン
    const defaultBtn = this.add.container(400, sectionY + 75);
    const defaultBg = this.add.rectangle(0, 0, 180, 45, 0x2a5a4a, 0.9);
    defaultBg.setStrokeStyle(2, 0x3a7a6a);
    defaultBtn.add(defaultBg);
    defaultBtn.add(this.add.text(0, 0, '🔄 デフォルト', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5));

    defaultBg.setInteractive({ useHandCursor: true });
    defaultBg.on('pointerover', () => defaultBg.setFillStyle(0x3a6a5a));
    defaultBg.on('pointerout', () => defaultBg.setFillStyle(0x2a5a4a));
    defaultBg.on('pointerdown', () => {
      try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
      this.loadDefaultPrizes();
    });

    // 景品表示コンテナ
    this.prizesContainer = this.add.container(600, sectionY + 20);
    this.updatePrizesDisplay();

    // 隠しファイル入力を作成
    this.createFileInput();
  }

  private createFileInput(): void {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = '.json';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        this.loadJsonFile(file);
      }
      target.value = '';
    });
  }

  private openFileDialog(): void {
    this.fileInput.click();
  }

  private loadJsonFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.prizes && Array.isArray(json.prizes)) {
          this.loadedPrizes = json.prizes
            .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
            .map((p: { prize: string }) => p.prize);
          this.updatePrizesDisplay();
        } else {
          console.error('Invalid JSON format');
        }
      } catch (err) {
        console.error('Failed to parse JSON:', err);
      }
    };
    reader.readAsText(file);
  }

  private loadDefaultPrizes(): void {
    // public/prizes-sample.json からデフォルト景品を読み込む
    fetch('/prizes-sample.json')
      .then(response => response.json())
      .then(json => {
        if (json.prizes && Array.isArray(json.prizes)) {
          this.loadedPrizes = json.prizes
            .sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank)
            .map((p: { prize: string }) => p.prize);
          this.updatePrizesDisplay();
        }
      })
      .catch(err => {
        console.error('Failed to load default prizes:', err);
      });
  }

  private updatePrizesDisplay(): void {
    this.prizesContainer.removeAll(true);

    if (this.loadedPrizes.length === 0) {
      this.prizesContainer.add(this.add.text(0, 40, '景品未設定（デフォルト: 1位〜15位）', {
        fontSize: '16px',
        color: '#888888',
      }));
      return;
    }

    // 読み込み済み表示
    this.prizesContainer.add(this.add.text(0, 5, '✅ 景品読み込み済み', {
      fontSize: '18px',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }));

    // 景品プレビュー（最初の3つ + 最後）
    const preview: string[] = [];
    if (this.loadedPrizes.length >= 3) {
      preview.push(`1位: ${this.loadedPrizes[0]}`);
      preview.push(`2位: ${this.loadedPrizes[1]}`);
      preview.push(`3位: ${this.loadedPrizes[2]}`);
      if (this.loadedPrizes.length > 3) {
        preview.push('...');
        preview.push(`${this.loadedPrizes.length}位: ${this.loadedPrizes[this.loadedPrizes.length - 1]}`);
      }
    } else {
      this.loadedPrizes.forEach((p, i) => preview.push(`${i + 1}位: ${p}`));
    }

    this.prizesContainer.add(this.add.text(0, 35, preview.join('  |  '), {
      fontSize: '14px',
      color: '#aaaaaa',
      wordWrap: { width: 700 },
    }));
  }

  private createModeSelection(): void {
    const startY = 780;

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
    try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
    this.selectedMode = mode;

    this.modeButtons.forEach((buttons, m) => {
      const isSelected = m === mode;
      buttons.bg.setFillStyle(isSelected ? 0x2a5a8a : 0x2a2a3a);
      buttons.bg.setStrokeStyle(3, isSelected ? 0x4a9aca : 0x3a3a4a);
      buttons.inner.setFillStyle(isSelected ? 0x3a7aba : 0x3a3a4a);
    });
  }

  private createStartButton(): void {
    const button = this.add.container(GAME_WIDTH / 2, 920);

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
      try { this.sound.play('button-click', { volume: 0.7 }); } catch (e) { /* ignore */ }
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
    this.add.text(GAME_WIDTH / 2, 985, '15頭の馬が順位を競います', {
      fontSize: '18px',
      color: '#888888',
    }).setOrigin(0.5);
  }

  private generateConditions(): void {
    this.horseConditions = [];
    const totalWeight = CONDITION_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);

    for (let i = 0; i < HORSES.length; i++) {
      const random = Math.random() * totalWeight;
      let cumulative = 0;
      let selectedCondition: HorseCondition = 'normal';

      for (const { condition, weight } of CONDITION_WEIGHTS) {
        cumulative += weight;
        if (random < cumulative) {
          selectedCondition = condition;
          break;
        }
      }

      this.horseConditions.push(selectedCondition);
    }
  }

  private generateSpecialDay(): void {
    const totalWeight = SPECIAL_DAY_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);
    const random = Math.random() * totalWeight;
    let cumulative = 0;

    for (const { day, weight } of SPECIAL_DAY_WEIGHTS) {
      cumulative += weight;
      if (random < cumulative) {
        this.specialDay = day;
        break;
      }
    }
  }

  private createSpecialDayDisplay(): void {
    const dayConfig = SPECIAL_DAY_CONFIG[this.specialDay];
    const x = GAME_WIDTH - 180;
    const y = 45;

    // 背景
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 300, 70, 0x000000, 0.7);
    bg.setStrokeStyle(3, Phaser.Display.Color.HexStringToColor(dayConfig.color).color);
    container.add(bg);

    // タイトル
    container.add(this.add.text(0, -18, '📅 今日は...', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5));

    // 日の名前
    container.add(this.add.text(0, 8, `${dayConfig.emoji} ${dayConfig.name}`, {
      fontSize: '26px',
      color: dayConfig.color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5));

    // 説明
    container.add(this.add.text(0, 32, dayConfig.description, {
      fontSize: '12px',
      color: '#cccccc',
    }).setOrigin(0.5));

    // アニメーション
    if (this.specialDay !== 'normal') {
      this.tweens.add({
        targets: container,
        scaleX: 1.03,
        scaleY: 1.03,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private startRace(): void {
    // 景品設定: JSONから読み込んだものがあればそれを使う、なければデフォルト
    let laneResults: string[];
    if (this.loadedPrizes.length > 0) {
      laneResults = [...this.loadedPrizes];
      // 15個に満たない場合は「なし」で埋める
      while (laneResults.length < COURSE_CONFIG.laneCount) {
        laneResults.push('なし');
      }
    } else {
      // デフォルト: 順位表示
      laneResults = [];
      for (let i = 0; i < COURSE_CONFIG.laneCount; i++) {
        laneResults.push(`${i + 1}位`);
      }
    }

    // BGMを停止
    this.sound.stopAll();

    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.time.delayedCall(300, () => {
      this.scene.start(SCENES.RACE, {
        laneResults: laneResults,
        raceMode: this.selectedMode,
        conditions: this.horseConditions,
        riders: this.horseRiders,
        specialDay: this.specialDay,
      });
    });
  }
}
