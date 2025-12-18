import Phaser from 'phaser';
import { Horse } from '../entities/Horse';
import { CourseGenerator } from '../systems/CourseGenerator';
import { RaceManager } from '../systems/RaceManager';
import { CommentarySystem } from '../systems/CommentarySystem';
import { HORSES, LANE_COLORS, GIMMICKS } from '../data/horses';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  COURSE_CONFIG,
  RACE_CONFIG,
  SCENES,
  RACE_MODES,
  RaceMode,
  SpecialDayType,
  SPECIAL_DAY_CONFIG,
} from '../config/GameConfig';
import type { CourseData, RaceResult, PlacedGimmick, HorseCondition } from '../types';

export class RaceScene extends Phaser.Scene {
  private horses: Horse[] = [];
  private courseData!: CourseData;
  private horseConditions: HorseCondition[] = [];
  private horseRiders: string[] = [];
  private specialDay: SpecialDayType = 'normal';
  private raceManager!: RaceManager;
  private commentarySystem!: CommentarySystem;
  private laneResults: string[] = [];
  private raceMode: RaceMode = 'LONG';

  private courseContainer!: Phaser.GameObjects.Container;
  private cameraX: number = 0;
  private raceStarted: boolean = false;
  private raceFinished: boolean = false;
  private countdown: number = RACE_CONFIG.countdownSeconds;
  private countdownText!: Phaser.GameObjects.Text;
  private countdownBg!: Phaser.GameObjects.Graphics;
  private raceTime: number = 0;
  private progressBar!: Phaser.GameObjects.Graphics;
  private rankingContainer!: Phaser.GameObjects.Container;
  private gimmickVisuals: Map<string, Phaser.GameObjects.GameObject[]> = new Map();

  private raceBgm!: Phaser.Sound.BaseSound;
  private neighSound!: Phaser.Sound.BaseSound;
  private raceCommentary!: Phaser.Sound.BaseSound;

  constructor() {
    super({ key: SCENES.RACE });
  }

  preload(): void {
    // レース用BGMをロード
    if (!this.cache.audio.exists('race-bgm')) {
      this.load.audio('race-bgm', '/horse-galloping-339737.mp3');
    }
    if (!this.cache.audio.exists('neigh')) {
      this.load.audio('neigh', '/horse-neigh-390297.mp3');
    }
    if (!this.cache.audio.exists('start-sound')) {
      this.load.audio('start-sound', '/ScreenRecording_12-18-2025 14-24-47_1.mp3');
    }
    if (!this.cache.audio.exists('race-commentary')) {
      this.load.audio('race-commentary', '/ScreenRecording_12-18-2025 14-33-24_1.mp3');
    }
    if (!this.cache.audio.exists('fanfare')) {
      this.load.audio('fanfare', '/slq3puyhb3h-fanfare-sfx-5.mp3');
    }
  }

  init(data: { laneResults: string[]; raceMode?: RaceMode; conditions?: HorseCondition[]; riders?: string[]; specialDay?: SpecialDayType }): void {
    this.laneResults = data.laneResults || [];
    this.raceMode = data.raceMode || 'LONG';
    this.horseConditions = data.conditions || [];
    this.horseRiders = data.riders || [];
    this.specialDay = data.specialDay || 'normal';
    this.horses = [];
    this.raceStarted = false;
    this.raceFinished = false;
    this.countdown = RACE_CONFIG.countdownSeconds;
    this.cameraX = 0;
    this.raceTime = 0;
    this.gimmickVisuals = new Map();
  }

  create(): void {
    // フェードイン
    this.cameras.main.fadeIn(300);

    // モードに応じたコース長を取得
    const modeConfig = RACE_MODES[this.raceMode];

    // コース生成
    this.courseData = CourseGenerator.generate({
      ...COURSE_CONFIG,
      totalLength: modeConfig.totalLength,
      laneResults: this.laneResults,
      specialDay: this.specialDay,
    });

    // コースコンテナ
    this.courseContainer = this.add.container(0, 0);

    // コース描画
    this.drawCourse();

    // 馬の生成
    this.createHorses();

    // システム初期化
    this.raceManager = new RaceManager(this, this.horses, this.courseData);
    this.commentarySystem = new CommentarySystem(this);

    // UI要素
    this.createUI();

    // カウントダウン背景
    this.countdownBg = this.add.graphics();
    this.countdownBg.fillStyle(0x000000, 0.7);
    this.countdownBg.fillRoundedRect(GAME_WIDTH / 2 - 120, GAME_HEIGHT / 2 - 100, 240, 200, 20);
    this.countdownBg.setScrollFactor(0).setDepth(999);

    // カウントダウンテキスト
    this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
      fontSize: '120px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1000);

    // イベントリスナー
    this.events.on('commentary', (message: string) => {
      this.commentarySystem.addMessage(message);
    });

    this.events.on('raceFinished', (results: RaceResult[]) => {
      this.raceFinished = true;

      // レース音を停止
      if (this.raceBgm) {
        this.raceBgm.stop();
      }
      if (this.neighSound) {
        this.neighSound.stop();
      }
      if (this.raceCommentary) {
        this.raceCommentary.stop();
      }

      // 音声読み上げを停止
      this.commentarySystem.stopSpeech();

      // ファンファーレを再生
      const fanfare = this.sound.add('fanfare', { volume: 0.8 });
      fanfare.play();

      this.showFinishOverlay();
      this.time.delayedCall(2500, () => {
        this.cameras.main.fadeOut(500);
        this.time.delayedCall(500, () => {
          this.scene.start(SCENES.RESULT, { results, riders: this.horseRiders });
        });
      });
    });

    // 💩設置イベント（ナイトメア・ハザード用）
    this.events.on('placePoopBehind', (horse: Horse) => {
      this.raceManager.placePoopBehind(horse);
    });

    // ギミック削除イベント
    this.events.on('removeGimmick', (gimmickId: string) => {
      this.removeGimmickVisual(gimmickId);
    });

    // カウントダウン開始
    this.startCountdown();
  }

  private createUI(): void {
    // 上部ヘッダー
    const header = this.add.graphics();
    header.fillStyle(0x000000, 0.6);
    header.fillRect(0, 0, GAME_WIDTH, 50);
    header.setScrollFactor(0).setDepth(100);

    // レースモード表示
    const modeNames: Record<RaceMode, string> = {
      'SHORT': '短距離',
      'MEDIUM': '中距離',
      'LONG': '長距離',
    };
    this.add.text(20, 25, `🏁 ${modeNames[this.raceMode]}レース`, {
      fontSize: '20px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

    // 進捗バー背景
    const progressBg = this.add.graphics();
    progressBg.fillStyle(0x333333, 0.8);
    progressBg.fillRoundedRect(GAME_WIDTH / 2 - 300, 15, 600, 20, 10);
    progressBg.setScrollFactor(0).setDepth(101);

    // 進捗バー
    this.progressBar = this.add.graphics();
    this.progressBar.setScrollFactor(0).setDepth(102);

    // 進捗ラベル
    this.add.text(GAME_WIDTH / 2 - 310, 25, 'START', {
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(101);

    this.add.text(GAME_WIDTH / 2 + 310, 25, 'GOAL', {
      fontSize: '12px',
      color: '#888888',
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(101);

    // ランキング表示エリア
    this.rankingContainer = this.add.container(GAME_WIDTH - 20, 70);
    this.rankingContainer.setScrollFactor(0).setDepth(100);

    const rankingBg = this.add.graphics();
    rankingBg.fillStyle(0x000000, 0.6);
    rankingBg.fillRoundedRect(-180, 0, 180, 200, 10);
    this.rankingContainer.add(rankingBg);

    this.add.text(GAME_WIDTH - 110, 85, '🏆 順位', {
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);
  }

  private showFinishOverlay(): void {
    // フィニッシュオーバーレイ
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setScrollFactor(0).setDepth(500);

    this.tweens.add({
      targets: overlay,
      alpha: 0.5,
      duration: 500,
    });

    // フィニッシュテキスト
    const finishText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '🏁 FINISH! 🏁', {
      fontSize: '80px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(501).setAlpha(0).setScale(0.5);

    this.tweens.add({
      targets: finishText,
      alpha: 1,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });
  }

  private drawCourse(): void {
    const totalHeight = COURSE_CONFIG.laneCount * COURSE_CONFIG.laneHeight;
    const startY = (GAME_HEIGHT - totalHeight) / 2;

    // 特別な日に基づく背景色を取得
    const bgColors = this.getBackgroundColorsForDay();

    // グラデーション風背景
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(bgColors.bg1, bgColors.bg1, bgColors.bg2, bgColors.bg2, 1);
    bgGraphics.fillRect(-200, 0, this.courseData.totalLength + 700, GAME_HEIGHT);
    this.courseContainer.add(bgGraphics);

    // レーン描画
    for (let i = 0; i < COURSE_CONFIG.laneCount; i++) {
      const y = startY + i * COURSE_CONFIG.laneHeight;
      const color = i % 2 === 0 ? bgColors.lane1 : bgColors.lane2;

      const lane = this.add.rectangle(
        this.courseData.totalLength / 2,
        y + COURSE_CONFIG.laneHeight / 2,
        this.courseData.totalLength + 500,
        COURSE_CONFIG.laneHeight,
        color
      );
      this.courseContainer.add(lane);

      // レーン境界線（グラデーション風）
      const lineGraphics = this.add.graphics();
      lineGraphics.lineStyle(1, bgColors.line, 0.5);
      lineGraphics.moveTo(-200, y);
      lineGraphics.lineTo(this.courseData.totalLength + 500, y);
      lineGraphics.strokePath();
      this.courseContainer.add(lineGraphics);

      // レーン番号（左端）- スタイリッシュに
      const laneBg = this.add.ellipse(35, y + COURSE_CONFIG.laneHeight / 2, 30, 30,
        Phaser.Display.Color.HexStringToColor(LANE_COLORS[i]).color, 0.8);
      this.courseContainer.add(laneBg);

      const laneLabel = this.add.text(35, y + COURSE_CONFIG.laneHeight / 2, `${i + 1}`, {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.courseContainer.add(laneLabel);
    }

    // スタートゾーン（グラデーション）
    const startZone = this.add.graphics();
    startZone.fillGradientStyle(0xff0000, 0x000000, 0xff0000, 0x000000, 0.3, 0, 0.3, 0);
    startZone.fillRect(this.courseData.startX - 50, startY, 50, totalHeight);
    this.courseContainer.add(startZone);

    // スタートライン
    const startLine = this.add.rectangle(
      this.courseData.startX,
      GAME_HEIGHT / 2,
      8,
      totalHeight,
      0xff4444
    );
    startLine.setStrokeStyle(2, 0xffffff);
    this.courseContainer.add(startLine);

    // スタートテキスト（装飾付き）
    const startBg = this.add.rectangle(this.courseData.startX, startY - 35, 100, 30, 0xff4444, 0.9);
    startBg.setStrokeStyle(2, 0xffffff);
    this.courseContainer.add(startBg);

    const startText = this.add.text(this.courseData.startX, startY - 35, '🚦 START', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.courseContainer.add(startText);

    // ゴールゾーン（グラデーション）
    const goalZone = this.add.graphics();
    goalZone.fillGradientStyle(0x000000, 0xffd700, 0x000000, 0xffd700, 0, 0.3, 0, 0.3);
    goalZone.fillRect(this.courseData.goalX, startY, 100, totalHeight);
    this.courseContainer.add(goalZone);

    // ゴールライン（チェッカーフラッグ風）
    for (let i = 0; i < COURSE_CONFIG.laneCount; i++) {
      const y = startY + i * COURSE_CONFIG.laneHeight;
      for (let j = 0; j < 4; j++) {
        const checkY = y + j * (COURSE_CONFIG.laneHeight / 4);
        const checkColor = (i + j) % 2 === 0 ? 0xffffff : 0x000000;
        const check = this.add.rectangle(
          this.courseData.goalX,
          checkY + COURSE_CONFIG.laneHeight / 8,
          10,
          COURSE_CONFIG.laneHeight / 4,
          checkColor
        );
        this.courseContainer.add(check);
      }
    }

    // ゴールテキスト（装飾付き）
    const goalBg = this.add.rectangle(this.courseData.goalX, startY - 35, 100, 30, 0xffd700, 0.9);
    goalBg.setStrokeStyle(2, 0x8b6914);
    this.courseContainer.add(goalBg);

    const goalText = this.add.text(this.courseData.goalX, startY - 35, '🏁 GOAL', {
      fontSize: '18px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    this.courseContainer.add(goalText);

    // ゴールレーン番号表示
    for (let i = 0; i < COURSE_CONFIG.laneCount; i++) {
      const y = startY + i * COURSE_CONFIG.laneHeight + COURSE_CONFIG.laneHeight / 2;
      const laneNumber = i + 1;

      const resultBg = this.add.ellipse(this.courseData.goalX + 50, y, 35, 35,
        Phaser.Display.Color.HexStringToColor(LANE_COLORS[i]).color, 0.8);
      resultBg.setStrokeStyle(2, 0xffffff);
      this.courseContainer.add(resultBg);

      const resultLabel = this.add.text(this.courseData.goalX + 50, y, `${laneNumber}`, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      this.courseContainer.add(resultLabel);
    }

    // あみだ分岐線描画
    this.courseData.branches.forEach(branch => {
      this.drawBranch(branch.x, branch.fromLane, branch.toLane, startY);
    });

    // ギミック描画
    this.courseData.gimmicks.forEach(gimmick => {
      this.drawGimmick(gimmick, startY);
    });
  }

  private drawBranch(x: number, fromLane: number, toLane: number, startY: number): void {
    const y1 = startY + fromLane * COURSE_CONFIG.laneHeight + COURSE_CONFIG.laneHeight / 2;
    const y2 = startY + toLane * COURSE_CONFIG.laneHeight + COURSE_CONFIG.laneHeight / 2;

    // グロー効果
    const glow = this.add.line(
      x, (y1 + y2) / 2,
      0, (y1 - y2) / 2,
      0, (y2 - y1) / 2,
      0x44ff44, 0.3
    );
    glow.setLineWidth(8);
    this.courseContainer.add(glow);

    // メインライン
    const line = this.add.line(
      x, (y1 + y2) / 2,
      0, (y1 - y2) / 2,
      0, (y2 - y1) / 2,
      0x88ff88, 0.9
    );
    line.setLineWidth(3);
    this.courseContainer.add(line);

    // 端点マーカー
    const marker1 = this.add.ellipse(x, y1, 8, 8, 0x88ff88, 0.8);
    const marker2 = this.add.ellipse(x, y2, 8, 8, 0x88ff88, 0.8);
    this.courseContainer.add(marker1);
    this.courseContainer.add(marker2);
  }

  private drawGimmick(gimmick: PlacedGimmick, startY: number): void {
    const y = startY + gimmick.lane * COURSE_CONFIG.laneHeight + COURSE_CONFIG.laneHeight / 2;
    const config = GIMMICKS[gimmick.type];

    // ギミック背景（グロー効果）
    const glowColors: Record<string, number> = {
      'spring': 0x00aaff,
      'construction': 0xff8800,
      'poop': 0x8B4513,
      'mud': 0x4169E1,
      'grass': 0x32CD32,
    };
    const glowColor = glowColors[gimmick.type] || 0xffffff;
    const glow = this.add.ellipse(gimmick.x, y, 40, 40, glowColor, 0.2);
    this.courseContainer.add(glow);

    const text = this.add.text(gimmick.x, y, config.emoji, {
      fontSize: '32px',
    }).setOrigin(0.5);
    this.courseContainer.add(text);

    // データを保存（衝突判定用）
    text.setData('gimmick', gimmick);

    // ギミックの視覚要素を保存（削除用）
    this.gimmickVisuals.set(gimmick.id, [glow, text]);
  }

  private removeGimmickVisual(gimmickId: string): void {
    const visuals = this.gimmickVisuals.get(gimmickId);
    if (visuals) {
      visuals.forEach(visual => {
        // フェードアウトアニメーション
        this.tweens.add({
          targets: visual,
          alpha: 0,
          scale: 0.5,
          duration: 300,
          onComplete: () => {
            visual.destroy();
          },
        });
      });
      this.gimmickVisuals.delete(gimmickId);
    }
  }

  private createHorses(): void {
    HORSES.forEach((horseData, index) => {
      const condition = this.horseConditions[index] || 'normal';
      const horse = new Horse(this, horseData, index, condition);
      this.horses.push(horse);
      this.courseContainer.add(horse);
    });
  }

  private startCountdown(): void {
    // 3, 2, 1, GO! の音声を先に再生（0.3秒後にカウントダウン表示開始）
    const startSound = this.sound.add('start-sound', { volume: 0.7 });
    startSound.play();

    // 0.2秒後にカウントダウン表示開始
    this.time.delayedCall(300, () => {
      this.countdownText.setText(this.countdown.toString());

      // カウントダウンアニメーション
      this.tweens.add({
        targets: this.countdownText,
        scale: { from: 1.5, to: 1 },
        duration: 300,
        ease: 'Back.easeOut',
      });

      const countdownTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          this.countdown--;
          if (this.countdown > 0) {
            this.countdownText.setText(this.countdown.toString());
            // パルスアニメーション
            this.tweens.add({
              targets: this.countdownText,
              scale: { from: 1.5, to: 1 },
              duration: 300,
              ease: 'Back.easeOut',
            });
          } else if (this.countdown === 0) {
            this.countdownText.setText('GO!');
            this.countdownText.setColor('#00FF00');
            this.tweens.add({
              targets: this.countdownText,
              scale: { from: 2, to: 1 },
              duration: 400,
              ease: 'Back.easeOut',
            });
            this.time.delayedCall(500, () => {
              this.tweens.add({
                targets: [this.countdownText, this.countdownBg],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  this.countdownText.setVisible(false);
                  this.countdownBg.setVisible(false);
                },
              });
              this.startRace();
            });
            countdownTimer.remove();
          }
        },
        repeat: RACE_CONFIG.countdownSeconds,
      });
    });
  }

  private startRace(): void {
    this.raceStarted = true;
    this.horses.forEach(horse => horse.startRace());
    this.commentarySystem.addMessage('レーススタート！15とうが一斉にゲートを飛び出した！');

    // 2つの音を交互に再生
    this.playAlternatingAudio();

    // レース実況音声を再生（ループ）
    this.raceCommentary = this.sound.add('race-commentary', { loop: true, volume: 0.25 });
    this.raceCommentary.play();
  }

  private playAlternatingAudio(): void {
    if (this.raceFinished) return;

    // 疾走音を再生
    this.raceBgm = this.sound.add('race-bgm', { volume: 0.2 });
    this.raceBgm.play();

    this.raceBgm.once('complete', () => {
      if (this.raceFinished) return;

      // いななき音を再生
      this.neighSound = this.sound.add('neigh', { volume: 0.3 });
      this.neighSound.play();

      this.neighSound.once('complete', () => {
        // 繰り返し
        this.playAlternatingAudio();
      });
    });
  }

  update(_time: number, delta: number): void {
    if (!this.raceStarted || this.raceFinished) return;

    this.raceTime += delta;

    // 馬の更新
    this.horses.forEach(horse => horse.update(delta));

    // レースマネージャーの更新
    this.raceManager.update(delta, this.raceTime);

    // カメラ追従
    this.updateCamera();

    // 実況システム更新
    this.commentarySystem.update(delta);

    // 進捗バー更新
    this.updateProgressBar();

    // ランキング表示更新
    this.updateRanking();
  }

  private updateProgressBar(): void {
    // 先頭馬の進捗を計算
    const leadHorse = this.horses
      .filter(h => h.state !== 'finished')
      .sort((a, b) => b.positionX - a.positionX)[0];

    if (!leadHorse) return;

    const progress = Math.min(1, (leadHorse.positionX - this.courseData.startX) /
      (this.courseData.goalX - this.courseData.startX));

    // 進捗バー描画
    this.progressBar.clear();
    this.progressBar.fillStyle(0x4CAF50, 1);
    this.progressBar.fillRoundedRect(
      GAME_WIDTH / 2 - 298,
      17,
      596 * progress,
      16,
      8
    );

    // グラデーション風のハイライト
    this.progressBar.fillStyle(0x81C784, 0.5);
    this.progressBar.fillRoundedRect(
      GAME_WIDTH / 2 - 298,
      17,
      596 * progress,
      8,
      { tl: 8, tr: 8, bl: 0, br: 0 }
    );
  }

  private updateRanking(): void {
    // 既存のランキングテキストを削除
    this.rankingContainer.each((child: Phaser.GameObjects.GameObject) => {
      if (child instanceof Phaser.GameObjects.Text) {
        child.destroy();
      }
    });

    // 現在の順位を計算（位置順）
    const sortedHorses = [...this.horses]
      .sort((a, b) => b.positionX - a.positionX)
      .slice(0, 5);

    sortedHorses.forEach((horse, index) => {
      const horseData = HORSES.find(h => h.id === horse.getData('horseId'));
      if (!horseData) return;

      const y = 30 + index * 32;
      const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
      const color = index < 3 ? '#FFD700' : '#cccccc';

      const rankText = this.add.text(-170, y, `${medalEmoji} ${index + 1}. ${horseData.name}`, {
        fontSize: '13px',
        color: color,
        fontStyle: index < 3 ? 'bold' : 'normal',
      });
      rankText.setScrollFactor(0);
      this.rankingContainer.add(rankText);
    });
  }

  private updateCamera(): void {
    // 走行中の馬を位置順でソート
    const runningHorses = this.horses
      .filter(h => h.state !== 'finished')
      .sort((a, b) => b.positionX - a.positionX);

    if (runningHorses.length === 0) return;

    // 3位の馬を追従（3位がいない場合は最後尾）
    const targetIndex = Math.min(2, runningHorses.length - 1);
    const targetHorse = runningHorses[targetIndex];

    // 目標カメラ位置（3位の馬が画面中央付近に来るように）
    const targetX = targetHorse.positionX - GAME_WIDTH / 2;

    // Lerp追従
    this.cameraX = Phaser.Math.Linear(this.cameraX, targetX, RACE_CONFIG.cameraLerpFactor);

    // カメラ位置を制限
    this.cameraX = Math.max(0, Math.min(this.cameraX, this.courseData.goalX - GAME_WIDTH + 300));

    // コンテナの位置を更新
    this.courseContainer.x = -this.cameraX;
  }

  addDynamicGimmick(gimmick: PlacedGimmick): void {
    const totalHeight = COURSE_CONFIG.laneCount * COURSE_CONFIG.laneHeight;
    const startY = (GAME_HEIGHT - totalHeight) / 2;
    this.drawGimmick(gimmick, startY);
    this.courseData.gimmicks.push(gimmick);
  }

  private getBackgroundColorsForDay(): { bg1: number; bg2: number; lane1: number; lane2: number; line: number } {
    // 特別な日に基づく背景色
    const colorSchemes: Record<SpecialDayType, { bg1: number; bg2: number; lane1: number; lane2: number; line: number }> = {
      normal: {
        bg1: 0x0a1a0a,
        bg2: 0x1a2a1a,
        lane1: 0x1a3a1a,
        lane2: 0x0f2a0f,
        line: 0x4a6a4a,
      },
      poop: {
        bg1: 0x1a140a,
        bg2: 0x2a1f0a,
        lane1: 0x3a2a1a,
        lane2: 0x2a1f0f,
        line: 0x6a5a3a,
      },
      spring: {
        bg1: 0x0a1a2a,
        bg2: 0x1a2a3a,
        lane1: 0x1a3a4a,
        lane2: 0x0f2a3a,
        line: 0x4a6a8a,
      },
      grass: {
        bg1: 0x0a2a0a,
        bg2: 0x1a3a1a,
        lane1: 0x2a4a2a,
        lane2: 0x1a3a1a,
        line: 0x5a8a5a,
      },
      mud: {
        bg1: 0x0a1020,
        bg2: 0x1a2030,
        lane1: 0x1a2a3a,
        lane2: 0x0f1a2a,
        line: 0x4a5a7a,
      },
      construction: {
        bg1: 0x1a1a0a,
        bg2: 0x2a2a1a,
        lane1: 0x3a3a1a,
        lane2: 0x2a2a0f,
        line: 0x6a6a3a,
      },
      chaos: {
        bg1: 0x1a0a1a,
        bg2: 0x2a1a2a,
        lane1: 0x3a1a3a,
        lane2: 0x2a0f2a,
        line: 0x6a4a6a,
      },
    };

    return colorSchemes[this.specialDay] || colorSchemes.normal;
  }
}
