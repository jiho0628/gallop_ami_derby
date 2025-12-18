import Phaser from 'phaser';
import { HORSES, GIMMICKS } from '../data/horses';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  SCENES,
} from '../config/GameConfig';

export class TitleScene extends Phaser.Scene {
  private _particleEmitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private bgm!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: SCENES.TITLE });
  }

  preload(): void {
    // BGMをロード
    if (!this.cache.audio.exists('title-bgm')) {
      this.load.audio('title-bgm', '/christmas-happy-background-442036.mp3');
    }
    // ボタン音をロード
    if (!this.cache.audio.exists('button-click')) {
      this.load.audio('button-click', '/button.mp3');
    }
  }

  create(): void {
    // 他のBGMを停止
    this.sound.stopAll();

    // BGM再生（既に再生中でなければ）
    if (!this.sound.get('title-bgm')?.isPlaying) {
      this.bgm = this.sound.add('title-bgm', { loop: true, volume: 0.5 });
      this.bgm.play();
    }
    // フェードイン
    this.cameras.main.fadeIn(500);

    // 多層背景
    this.createBackground();

    // 装飾エフェクト
    this.createParticleEffects();

    // ロゴ・タイトル
    this.createLogo();

    // メインコンテンツ
    this.createMainContent();

    // ナビゲーション
    this.createNavigation();

    // フッター
    this.createFooter();
  }

  private createBackground(): void {
    // ベースグラデーション
    const graphics = this.add.graphics();

    // 深い宇宙的な背景
    graphics.fillGradientStyle(0x050510, 0x050510, 0x0a1428, 0x0a1428, 1);
    graphics.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT * 0.4);

    graphics.fillGradientStyle(0x0a1428, 0x0a1428, 0x0f2318, 0x0f2318, 1);
    graphics.fillRect(0, GAME_HEIGHT * 0.4, GAME_WIDTH, GAME_HEIGHT * 0.6);

    // レーストラック風の装飾ライン
    const trackLines = this.add.graphics();
    trackLines.lineStyle(2, 0x2a4a2a, 0.3);
    for (let i = 0; i < 20; i++) {
      const y = 100 + i * 45;
      trackLines.moveTo(0, y);
      trackLines.lineTo(GAME_WIDTH, y);
    }
    trackLines.strokePath();

    // 中央グロー（ゴールド）
    const goldGlow = this.add.ellipse(GAME_WIDTH / 2, 200, 800, 300, 0xffd700, 0.05);
    this.tweens.add({
      targets: goldGlow,
      alpha: 0.02,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 下部グロー（緑）
    const greenGlow = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 150, 1200, 400, 0x2ecc71, 0.06);
    this.tweens.add({
      targets: greenGlow,
      alpha: 0.03,
      duration: 2500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 装飾的なサイドライン
    const sideDecor = this.add.graphics();
    sideDecor.lineStyle(3, 0xffd700, 0.15);
    sideDecor.moveTo(50, 100);
    sideDecor.lineTo(50, GAME_HEIGHT - 100);
    sideDecor.moveTo(GAME_WIDTH - 50, 100);
    sideDecor.lineTo(GAME_WIDTH - 50, GAME_HEIGHT - 100);
    sideDecor.strokePath();
  }

  private createParticleEffects(): void {
    // 流れる星エフェクト
    for (let i = 0; i < 30; i++) {
      const star = this.add.text(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT,
        ['✦', '✧', '⋆', '·'][Math.floor(Math.random() * 4)],
        {
          fontSize: `${8 + Math.random() * 10}px`,
          color: '#FFD700',
        }
      ).setAlpha(0);

      this.tweens.add({
        targets: star,
        alpha: { from: 0, to: 0.4 + Math.random() * 0.3 },
        y: star.y + 30,
        duration: 2000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 3000,
        ease: 'Sine.easeInOut',
      });
    }

    // 浮遊する馬シルエット
    for (let i = 0; i < 8; i++) {
      const x = 100 + Math.random() * (GAME_WIDTH - 200);
      const y = 150 + Math.random() * (GAME_HEIGHT - 400);
      const horse = this.add.text(x, y, '🐴', {
        fontSize: `${30 + Math.random() * 25}px`,
      }).setAlpha(0.04);

      this.tweens.add({
        targets: horse,
        y: y + 15 + Math.random() * 20,
        x: x + (Math.random() - 0.5) * 30,
        duration: 4000 + Math.random() * 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createLogo(): void {
    const logoContainer = this.add.container(GAME_WIDTH / 2, 130);

    // タイトル背景装飾
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000000, 0.4);
    titleBg.fillRoundedRect(-500, -70, 1000, 140, 20);
    logoContainer.add(titleBg);

    // 光線エフェクト
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const ray = this.add.graphics();
      ray.fillStyle(0xffd700, 0.03);
      ray.beginPath();
      ray.moveTo(0, 0);
      ray.lineTo(Math.cos(angle) * 600, Math.sin(angle) * 200);
      ray.lineTo(Math.cos(angle + 0.15) * 600, Math.sin(angle + 0.15) * 200);
      ray.closePath();
      ray.fillPath();
      logoContainer.add(ray);
    }

    // 馬アイコン（左）
    const leftHorse = this.add.text(-480, 0, '🏇', { fontSize: '55px' }).setOrigin(0.5);
    logoContainer.add(leftHorse);
    this.tweens.add({
      targets: leftHorse,
      x: -470,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 馬アイコン（右）
    const rightHorse = this.add.text(480, 0, '🏇', { fontSize: '55px' }).setOrigin(0.5).setFlipX(true);
    logoContainer.add(rightHorse);
    this.tweens.add({
      targets: rightHorse,
      x: 470,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // メインタイトル（影）
    const titleShadow = this.add.text(4, 4, 'ギャロップあみだダービー', {
      fontSize: '72px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setAlpha(0.6);
    logoContainer.add(titleShadow);

    // メインタイトル
    const title = this.add.text(0, 0, 'ギャロップあみだダービー', {
      fontSize: '72px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#8B6914',
      strokeThickness: 4,
    }).setOrigin(0.5);
    logoContainer.add(title);

    // サブタイトル
    const subtitle = this.add.text(0, 65, '〜 Gallop Amida Derby 〜', {
      fontSize: '24px',
      color: '#88aaaa',
      fontStyle: 'italic',
    }).setOrigin(0.5);
    logoContainer.add(subtitle);

    // トロフィーアイコン
    const trophy = this.add.text(0, -55, '🏆', { fontSize: '35px' }).setOrigin(0.5);
    logoContainer.add(trophy);
    this.tweens.add({
      targets: trophy,
      y: -50,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ロゴ全体のアニメーション
    logoContainer.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: logoContainer,
      alpha: 1,
      scale: 1,
      duration: 800,
      ease: 'Back.easeOut',
    });
  }

  private createMainContent(): void {
    // コンセプトバナー
    this.createConceptBanner();

    // 2カラムレイアウト
    this.createRulesSection();
    this.createGimmicksSection();

    // 馬プレビュー
    this.createHorsePreview();
  }

  private createConceptBanner(): void {
    const bannerY = 230;

    const bannerBg = this.add.graphics();
    bannerBg.fillStyle(0xffd700, 0.15);
    bannerBg.fillRoundedRect(GAME_WIDTH / 2 - 400, bannerY - 25, 800, 50, 25);
    bannerBg.lineStyle(2, 0xffd700, 0.4);
    bannerBg.strokeRoundedRect(GAME_WIDTH / 2 - 400, bannerY - 25, 800, 50, 25);

    const concept = this.add.text(GAME_WIDTH / 2, bannerY, '🎯 あみだくじ × 競馬 = 予測不能なパーティゲーム！', {
      fontSize: '24px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // フェードインアニメーション
    bannerBg.setAlpha(0);
    concept.setAlpha(0);
    this.tweens.add({
      targets: [bannerBg, concept],
      alpha: 1,
      duration: 600,
      delay: 400,
    });
  }

  private createRulesSection(): void {
    const sectionX = GAME_WIDTH / 2 - 250;
    const sectionY = 290;
    const sectionWidth = 420;
    const sectionHeight = 220;

    // セクション背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(sectionX - sectionWidth / 2, sectionY, sectionWidth, sectionHeight, 12);
    bg.lineStyle(1, 0x4ECDC4, 0.5);
    bg.strokeRoundedRect(sectionX - sectionWidth / 2, sectionY, sectionWidth, sectionHeight, 12);

    // セクションヘッダー
    this.add.rectangle(sectionX, sectionY + 28, sectionWidth - 20, 40, 0x4ECDC4, 0.2);
    this.add.text(sectionX, sectionY + 28, '📋 遊び方', {
      fontSize: '24px',
      color: '#4ECDC4',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ルール一覧
    const rules = [
      { icon: '🐴', text: '15頭の個性豊かな馬がレース' },
      { icon: '🔀', text: 'あみだくじの分岐でレーン移動' },
      { icon: '⭐', text: '各馬は固有の特殊能力を持つ' },
      { icon: '🎁', text: 'ゴール結果を自由に設定可能' },
    ];

    rules.forEach((rule, i) => {
      const y = sectionY + 70 + i * 38;
      this.add.text(sectionX - sectionWidth / 2 + 25, y, rule.icon, { fontSize: '24px' }).setOrigin(0, 0.5);
      this.add.text(sectionX - sectionWidth / 2 + 60, y, rule.text, {
        fontSize: '18px',
        color: '#dddddd',
      }).setOrigin(0, 0.5);
    });

    // フェードインアニメーション
    bg.setAlpha(0);
    this.tweens.add({
      targets: bg,
      alpha: 1,
      duration: 500,
      delay: 600,
    });
  }

  private createGimmicksSection(): void {
    const sectionX = GAME_WIDTH / 2 + 250;
    const sectionY = 290;
    const sectionWidth = 420;
    const sectionHeight = 220;

    // セクション背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.5);
    bg.fillRoundedRect(sectionX - sectionWidth / 2, sectionY, sectionWidth, sectionHeight, 12);
    bg.lineStyle(1, 0xFF6B6B, 0.5);
    bg.strokeRoundedRect(sectionX - sectionWidth / 2, sectionY, sectionWidth, sectionHeight, 12);

    // セクションヘッダー
    this.add.rectangle(sectionX, sectionY + 28, sectionWidth - 20, 40, 0xFF6B6B, 0.2);
    this.add.text(sectionX, sectionY + 28, '⚡ ギミック', {
      fontSize: '24px',
      color: '#FF6B6B',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // ギミック一覧（効果説明付き）- 5つを2行に配置
    const gimmickData = [
      { type: 'spring', name: 'ばね', effect: '隣レーンへ', color: 0x00aaff },
      { type: 'construction', name: '工事中', effect: '停止＆迂回', color: 0xff8800 },
      { type: 'poop', name: 'うんこ', effect: '3秒スタン', color: 0x8B4513 },
      { type: 'mud', name: 'ぬかるみ', effect: '速度半減', color: 0x4169E1 },
      { type: 'grass', name: '芝生', effect: '速度UP', color: 0x32CD32 },
    ];

    gimmickData.forEach((g, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = sectionX - 130 + col * 130;
      const y = sectionY + 100 + row * 90;

      // カード背景
      const card = this.add.rectangle(x, y, 120, 80, 0x1a1a2e, 0.9);
      card.setStrokeStyle(2, g.color, 0.7);

      // 絵文字
      const gimmickConfig = GIMMICKS[g.type as keyof typeof GIMMICKS];
      this.add.text(x, y - 20, gimmickConfig?.emoji || '?', { fontSize: '32px' }).setOrigin(0.5);

      // 名前
      this.add.text(x, y + 12, g.name, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);

      // 効果説明
      this.add.text(x, y + 34, g.effect, {
        fontSize: '14px',
        color: '#cccccc',
      }).setOrigin(0.5);
    });

    // フェードインアニメーション
    bg.setAlpha(0);
    this.tweens.add({
      targets: bg,
      alpha: 1,
      duration: 500,
      delay: 700,
    });
  }

  private createHorsePreview(): void {
    const previewY = 540;

    // セクション背景
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(80, previewY - 15, GAME_WIDTH - 160, 120, 15);
    bg.lineStyle(1, 0xffd700, 0.3);
    bg.strokeRoundedRect(80, previewY - 15, GAME_WIDTH - 160, 120, 15);

    // ヘッダー
    this.add.text(GAME_WIDTH / 2, previewY + 8, '🐴 出走馬プレビュー', {
      fontSize: '22px',
      color: '#ffd700',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // 馬カードを横スクロール表示
    const horseContainer = this.add.container(0, previewY + 60);

    // 馬を表示
    HORSES.slice(0, 10).forEach((horse, i) => {
      const x = 180 + i * 170;
      const card = this.add.container(x, 0);

      // カード背景
      const cardBg = this.add.rectangle(0, 0, 155, 50, 0x1a2a3a, 0.8);
      cardBg.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(horse.color).color);
      card.add(cardBg);

      // 馬カラー
      const colorDot = this.add.ellipse(-60, 0, 28, 28,
        Phaser.Display.Color.HexStringToColor(horse.color).color);
      card.add(colorDot);

      // 馬名
      const nameText = this.add.text(-38, -8, horse.name, {
        fontSize: '14px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      card.add(nameText);

      // タイプ
      const typeText = this.add.text(-38, 12, horse.type, {
        fontSize: '12px',
        color: '#888888',
      }).setOrigin(0, 0.5);
      card.add(typeText);

      horseContainer.add(card);
    });

    // スクロールアニメーション
    this.tweens.add({
      targets: horseContainer,
      x: -250,
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    });

    // 「...他5頭」テキスト
    this.add.text(GAME_WIDTH - 120, previewY + 60, '...他5頭', {
      fontSize: '16px',
      color: '#888888',
    }).setOrigin(0.5);

    // フェードイン
    bg.setAlpha(0);
    this.tweens.add({
      targets: bg,
      alpha: 1,
      duration: 500,
      delay: 800,
    });
  }

  private createNavigation(): void {
    const navY = 680;

    // プレイボタン
    const playButton = this.createButton(
      GAME_WIDTH / 2,
      navY,
      '🎮  ゲームスタート',
      { bg: 0x1a6b1a, hover: 0x2ecc71, border: 0x3ddc84 },
      280,
      70,
      () => {
        this.cameras.main.fadeOut(400);
        this.time.delayedCall(400, () => {
          this.scene.start(SCENES.PADDOCK);
        });
      }
    );

    // パルスアニメーション
    this.tweens.add({
      targets: playButton,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ヒントテキスト
    const hint = this.add.text(GAME_WIDTH / 2, navY + 55, '▶ クリックしてスタート', {
      fontSize: '14px',
      color: '#666666',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: hint,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // 登場アニメーション
    playButton.setAlpha(0).setScale(0.8);
    this.tweens.add({
      targets: playButton,
      alpha: 1,
      scale: 1,
      duration: 600,
      delay: 900,
      ease: 'Back.easeOut',
    });
  }

  private createButton(
    x: number,
    y: number,
    label: string,
    colors: { bg: number; hover: number; border: number },
    width: number,
    height: number,
    onClick: () => void
  ): Phaser.GameObjects.Container {
    const button = this.add.container(x, y);

    // 影
    const shadow = this.add.rectangle(5, 5, width, height, 0x000000, 0.5);
    button.add(shadow);

    // メイン背景
    const bg = this.add.rectangle(0, 0, width, height, colors.bg);
    bg.setStrokeStyle(3, colors.border);
    button.add(bg);

    // ハイライト（上部）
    const highlight = this.add.rectangle(0, -height / 4, width - 20, height / 3, colors.hover, 0.3);
    button.add(highlight);

    // アイコン装飾
    const leftDecor = this.add.text(-width / 2 + 25, 0, '🏇', { fontSize: '24px' }).setOrigin(0.5).setAlpha(0.5);
    const rightDecor = this.add.text(width / 2 - 25, 0, '🏇', { fontSize: '24px' }).setOrigin(0.5).setAlpha(0.5).setFlipX(true);
    button.add(leftDecor);
    button.add(rightDecor);

    // テキスト
    const text = this.add.text(0, 0, label, {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    button.add(text);

    // インタラクション
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerover', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 100,
        ease: 'Power2',
      });
      bg.setFillStyle(colors.hover);
      leftDecor.setAlpha(1);
      rightDecor.setAlpha(1);
    });

    bg.on('pointerout', () => {
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Power2',
      });
      bg.setFillStyle(colors.bg);
      leftDecor.setAlpha(0.5);
      rightDecor.setAlpha(0.5);
    });

    bg.on('pointerdown', () => {
      try {
        this.sound.play('button-click', { volume: 0.7 });
      } catch (e) {
        // 音声エラーは無視
      }
      onClick();
    });

    return button;
  }

  private createFooter(): void {
    // 下部装飾ライン
    const footerLine = this.add.graphics();
    footerLine.lineStyle(1, 0x444444, 0.5);
    footerLine.moveTo(100, GAME_HEIGHT - 50);
    footerLine.lineTo(GAME_WIDTH - 100, GAME_HEIGHT - 50);
    footerLine.strokePath();

    // バージョン
    this.add.text(GAME_WIDTH - 40, GAME_HEIGHT - 25, 'v1.0.0', {
      fontSize: '12px',
      color: '#444444',
    }).setOrigin(1, 1);

    // クレジット
    this.add.text(40, GAME_HEIGHT - 25, '© 2025 Gallop Amida Derby', {
      fontSize: '12px',
      color: '#444444',
    }).setOrigin(0, 1);

    // 盛り上がりメッセージ
    const message = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, '🎉 みんなで盛り上がろう！ 🎉', {
      fontSize: '14px',
      color: '#FF69B4',
      fontStyle: 'bold',
    }).setOrigin(0.5, 1);

    this.tweens.add({
      targets: message,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });
  }
}
