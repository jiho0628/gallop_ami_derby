import Phaser from 'phaser';
import type { HorseData, HorseState, GimmickType, HorseCondition } from '../types';
import { HORSE_CONFIG, COURSE_CONFIG, CONDITION_CONFIG } from '../config/GameConfig';
import { GIMMICKS } from '../data/horses';

export class Horse extends Phaser.GameObjects.Container {
  public horseData: HorseData;
  public currentLane: number;
  public state: HorseState = 'waiting';
  public currentSpeed: number;
  public positionX: number = 0;
  public finishTime: number = 0;
  public condition: HorseCondition = 'normal';
  private conditionModifier: number = 1;

  // 状態管理
  private stunTimer: number = 0;
  private boostTimer: number = 0;
  private boostMultiplier: number = 1;
  private isChangingLane: boolean = false;
  private targetLane: number = 0;
  private _laneChangeProgress: number = 0;

  // 固有能力用
  public revengeStack: number = 0;        // アンラッキー・バニー用
  public grassEffectRemaining: number = 0; // グラス・イーター用
  public lastShuffleTime: number = 0;      // ミラクル・ダイス用
  public currentStatsMultiplier: number = 1; // ミラクル・ダイス用

  // ビジュアル要素
  private background: Phaser.GameObjects.Ellipse;
  private emoji: Phaser.GameObjects.Text;
  private label: Phaser.GameObjects.Text;
  private stateIndicator: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, horseData: HorseData, lane: number, condition: HorseCondition = 'normal') {
    super(scene, HORSE_CONFIG.startX, 0);

    this.horseData = horseData;
    this.currentLane = lane;
    this.targetLane = lane;
    this.condition = condition;
    this.conditionModifier = CONDITION_CONFIG[condition].speedModifier;
    this.currentSpeed = HORSE_CONFIG.baseSpeed * horseData.stats.speed * this.conditionModifier;
    this.positionX = HORSE_CONFIG.startX;

    // Y座標を計算
    this.updateYPosition();

    // 背景円
    this.background = scene.add.ellipse(0, 0, HORSE_CONFIG.size, HORSE_CONFIG.size,
      Phaser.Display.Color.HexStringToColor(horseData.color).color);
    this.background.setStrokeStyle(2, 0xffffff);
    this.add(this.background);

    // 馬の絵文字
    this.emoji = scene.add.text(0, -2, '🐴', {
      fontSize: `${HORSE_CONFIG.size * 0.6}px`,
    }).setOrigin(0.5);
    this.add(this.emoji);

    // 番号ラベル
    this.label = scene.add.text(0, HORSE_CONFIG.size * 0.5 + 5, `${horseData.id}`, {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5, 0);
    this.add(this.label);

    // 状態インジケーター（スタン時など）
    this.stateIndicator = scene.add.text(0, -HORSE_CONFIG.size * 0.5 - 10, '', {
      fontSize: '20px',
    }).setOrigin(0.5, 1);
    this.add(this.stateIndicator);

    scene.add.existing(this);
  }

  private updateYPosition(): void {
    const laneY = this.calculateLaneY(this.currentLane);
    this.y = laneY;
  }

  private calculateLaneY(lane: number): number {
    const totalHeight = COURSE_CONFIG.laneCount * COURSE_CONFIG.laneHeight;
    const startY = (1080 - totalHeight) / 2;
    return startY + lane * COURSE_CONFIG.laneHeight + COURSE_CONFIG.laneHeight / 2;
  }

  update(delta: number): void {
    if (this.state === 'waiting' || this.state === 'finished') {
      return;
    }

    const deltaSeconds = delta / 1000;

    // スタンタイマー処理
    if (this.stunTimer > 0) {
      this.stunTimer -= delta;
      if (this.stunTimer <= 0) {
        this.stunTimer = 0;
        this.state = 'running';
        this.stateIndicator.setText('');
      }
      return;
    }

    // ブーストタイマー処理
    if (this.boostTimer > 0) {
      this.boostTimer -= delta;
      if (this.boostTimer <= 0) {
        this.boostTimer = 0;
        this.boostMultiplier = 1;
        this.state = 'running';
      }
    }

    // 芝生効果の残り時間（グラス・イーター用）
    if (this.grassEffectRemaining > 0) {
      this.grassEffectRemaining -= delta;
    }

    // ミラクル・ダイス: 5秒ごとにステータス変動
    if (this.horseData.id === 11) {
      const now = this.scene.time.now;
      if (now - this.lastShuffleTime > 5000) {
        this.lastShuffleTime = now;
        this.currentStatsMultiplier = 0.7 + Math.random() * 0.8; // 0.7〜1.5の範囲に調整
      }
    }

    // レーン移動処理
    if (this.isChangingLane) {
      this.processLaneChange(deltaSeconds);
      return;
    }

    // 移動処理
    let speedMultiplier = this.boostMultiplier;

    // ミラクル・ダイスの変動
    if (this.horseData.id === 11) {
      speedMultiplier *= this.currentStatsMultiplier;
    }

    // グラス・イーターの持続効果
    if (this.grassEffectRemaining > 0) {
      speedMultiplier *= 1.5;
    }

    const moveDistance = this.currentSpeed * speedMultiplier * deltaSeconds;
    this.positionX += moveDistance;
    this.x = this.positionX;
  }

  private processLaneChange(deltaSeconds: number): void {
    const currentY = this.y;
    const targetY = this.calculateLaneY(this.targetLane);
    const direction = targetY > currentY ? 1 : -1;

    // サイド・スライダーは移動速度3倍
    let laneChangeSpeed = HORSE_CONFIG.laneChangeSpeed;
    if (this.horseData.id === 14) {
      laneChangeSpeed *= 3;
    }

    const moveY = laneChangeSpeed * deltaSeconds * direction;
    this.y += moveY;

    // 移動完了チェック
    if ((direction > 0 && this.y >= targetY) || (direction < 0 && this.y <= targetY)) {
      this.y = targetY;
      this.currentLane = this.targetLane;
      this.isChangingLane = false;
      this.state = 'running';
    }
  }

  startRace(): void {
    this.state = 'running';
  }

  finish(time: number): void {
    this.state = 'finished';
    this.finishTime = time;
  }

  changeLane(targetLane: number): void {
    if (targetLane < 0 || targetLane >= COURSE_CONFIG.laneCount) {
      return;
    }
    if (this.state === 'finished' || this.isChangingLane) {
      return;
    }

    this.targetLane = targetLane;
    this.isChangingLane = true;
    this.state = 'jumping';
  }

  applyGimmickEffect(gimmickType: GimmickType): { blocked: boolean; message?: string } {
    const gimmick = GIMMICKS[gimmickType];
    if (!gimmick) return { blocked: false };

    // 固有能力による特殊処理
    const abilityResult = this.processAbility(gimmickType);
    if (abilityResult.blocked) {
      return abilityResult;
    }

    switch (gimmickType) {
      case 'spring':
        return this.handleSpring();

      case 'construction':
        return this.handleConstruction();

      case 'poop':
        return this.handlePoop();

      case 'mud':
        return this.handleMud();

      case 'grass':
        return this.handleGrass();

      default:
        return { blocked: false };
    }
  }

  private handleSpring(): { blocked: boolean; message?: string } {
    // ヘヴィ・メタル・ベア: ばねが反応しない
    if (this.horseData.id === 12) {
      return { blocked: true, message: `${this.horseData.name}は重すぎてばねが反応しない！` };
    }

    // スプリングホッパー: 2レーン跳ぶ + 加速
    let laneShift = 1;
    if (this.horseData.id === 4) {
      laneShift = 2;
      this.boostTimer = 2000;
      this.boostMultiplier = 1.5;
      this.state = 'boosted';
    }

    const direction = Math.random() < 0.5 ? -1 : 1;
    const targetLane = Math.max(0, Math.min(COURSE_CONFIG.laneCount - 1,
      this.currentLane + direction * laneShift));

    this.changeLane(targetLane);

    const message = this.horseData.id === 4
      ? `${this.horseData.name}が大ジャンプ！2レーン移動して加速！`
      : `${this.horseData.name}がばねで跳んだ！`;

    return { blocked: false, message };
  }

  private handleConstruction(): { blocked: boolean; message?: string } {
    // プロフェッサーP: 悪いギミックを事前回避
    if (this.horseData.id === 3) {
      return { blocked: true, message: `${this.horseData.name}が工事中を華麗に回避！` };
    }

    // ゴースト・ライダー: 工事中をすり抜け
    if (this.horseData.id === 9) {
      return { blocked: true, message: `${this.horseData.name}が工事中をすり抜けた！` };
    }

    // アイアンタフネス & ヘヴィ・メタル・ベア: 破壊
    if (this.horseData.id === 2 || this.horseData.id === 12) {
      return { blocked: false, message: `${this.horseData.name}が工事中を破壊！` };
    }

    // カオス・ジョーカー: 50%で効果反転（工事中を加速に）
    if (this.horseData.id === 5 && Math.random() < 0.5) {
      this.boostTimer = 2000;
      this.boostMultiplier = 1.5;
      this.state = 'boosted';
      return { blocked: false, message: `${this.horseData.name}の効果反転！🚧で加速！` };
    }

    // 通常処理: 1秒停止後、隣のレーンへ
    this.stunTimer = 1000;
    this.state = 'stunned';
    this.stateIndicator.setText('💥');

    const direction = Math.random() < 0.5 ? -1 : 1;
    const targetLane = Math.max(0, Math.min(COURSE_CONFIG.laneCount - 1,
      this.currentLane + direction));

    // 停止後にレーン移動
    this.scene.time.delayedCall(1000, () => {
      this.changeLane(targetLane);
    });

    // アンラッキー・バニー: リベンジスタック
    if (this.horseData.id === 15) {
      this.revengeStack++;
    }

    return { blocked: false, message: `${this.horseData.name}が工事中に衝突！` };
  }

  private handlePoop(): { blocked: boolean; message?: string } {
    // プロフェッサーP: 悪いギミックを事前回避
    if (this.horseData.id === 3) {
      return { blocked: true, message: `${this.horseData.name}が💩を華麗に回避！` };
    }

    // ミスター・セーフティ: 💩を完全無効化
    if (this.horseData.id === 8) {
      return { blocked: true, message: `${this.horseData.name}が安全圏で💩を無効化！` };
    }

    // ミスター・セーフティの近くにいる馬は無効
    // (RaceManagerで処理)

    // ドリーム・クリーナー: 💩を食べて加速
    if (this.horseData.id === 13) {
      this.boostTimer = 1000;
      this.boostMultiplier = 1.8;
      this.state = 'boosted';
      return { blocked: false, message: `${this.horseData.name}が💩を食べて加速！` };
    }

    // アイアンタフネス: 💩を破壊して無効化
    if (this.horseData.id === 2) {
      return { blocked: false, message: `${this.horseData.name}が💩を粉砕！` };
    }

    // カオス・ジョーカー: 50%で効果反転
    if (this.horseData.id === 5 && Math.random() < 0.5) {
      this.boostTimer = 1500;
      this.boostMultiplier = 1.5;
      this.state = 'boosted';
      return { blocked: false, message: `${this.horseData.name}の効果反転！💩で加速！` };
    }

    // スタン時間計算
    let stunDuration = 3000;

    // ゴールデンバレット: 2倍
    if (this.horseData.id === 1) {
      stunDuration *= 2;
    }

    this.stunTimer = stunDuration;
    this.state = 'stunned';
    this.stateIndicator.setText('💩');

    // アンラッキー・バニー: リベンジスタック
    if (this.horseData.id === 15) {
      this.revengeStack++;
      this.scene.time.delayedCall(stunDuration, () => {
        this.boostTimer = 3000;
        this.boostMultiplier = 1 + this.revengeStack * 0.2;
        this.state = 'boosted';
      });
    }

    return { blocked: false, message: `${this.horseData.name}が💩を踏んだ！` };
  }

  private handleMud(): { blocked: boolean; message?: string } {
    // プロフェッサーP: 悪いギミックを事前回避
    if (this.horseData.id === 3) {
      return { blocked: true, message: `${this.horseData.name}がぬかるみを華麗に回避！` };
    }

    // ミスター・セーフティ: 💧を完全無効化
    if (this.horseData.id === 8) {
      return { blocked: true, message: `${this.horseData.name}が安全圏で💧を無効化！` };
    }

    // ヘヴィ・メタル・ベア: 粉砕
    if (this.horseData.id === 12) {
      return { blocked: false, message: `${this.horseData.name}がぬかるみを粉砕！` };
    }

    // アイアンタフネス: 💧を破壊して無効化
    if (this.horseData.id === 2) {
      return { blocked: false, message: `${this.horseData.name}が💧を粉砕！` };
    }

    // マッドスライマー: 逆に加速
    if (this.horseData.id === 6) {
      this.boostTimer = 2000;
      this.boostMultiplier = 1.5;
      this.state = 'boosted';
      return { blocked: false, message: `${this.horseData.name}がぬかるみで加速！` };
    }

    // カオス・ジョーカー: 50%で効果反転
    if (this.horseData.id === 5 && Math.random() < 0.5) {
      this.boostTimer = 2000;
      this.boostMultiplier = 1.5;
      this.state = 'boosted';
      return { blocked: false, message: `${this.horseData.name}の効果反転！ぬかるみで加速！` };
    }

    // 通常: 減速
    let slowDuration = 2000;

    // ゴールデンバレット: 2倍
    if (this.horseData.id === 1) {
      slowDuration *= 2;
    }

    this.boostTimer = slowDuration;
    this.boostMultiplier = 0.5;
    this.stateIndicator.setText('💧');

    // アンラッキー・バニー: リベンジスタック
    if (this.horseData.id === 15) {
      this.revengeStack++;
    }

    this.scene.time.delayedCall(slowDuration, () => {
      this.stateIndicator.setText('');
    });

    return { blocked: false, message: `${this.horseData.name}がぬかるみに突入！` };
  }

  private handleGrass(): { blocked: boolean; message?: string } {
    // ゴースト・ライダー: 芝生の恩恵を受けない
    if (this.horseData.id === 9) {
      return { blocked: true, message: `${this.horseData.name}は芝生の恩恵を受けない...` };
    }

    // カオス・ジョーカー: 50%で効果反転
    if (this.horseData.id === 5 && Math.random() < 0.5) {
      this.boostTimer = 2000;
      this.boostMultiplier = 0.5;
      return { blocked: false, message: `${this.horseData.name}の効果反転！芝生で減速！` };
    }

    // 加速倍率計算
    let speedMultiplier = 1.5;
    let duration = 2000;

    // ゴールデンバレット: 2倍
    if (this.horseData.id === 1) {
      speedMultiplier = 2.0;
    }

    // グラス・イーター: 効果時間3倍持続
    if (this.horseData.id === 7) {
      this.grassEffectRemaining = duration * 3;
    }

    this.boostTimer = duration;
    this.boostMultiplier = speedMultiplier;
    this.state = 'boosted';
    this.stateIndicator.setText('🌱');

    this.scene.time.delayedCall(duration, () => {
      if (this.grassEffectRemaining <= 0) {
        this.stateIndicator.setText('');
      }
    });

    return { blocked: false, message: `${this.horseData.name}が芝生で加速！` };
  }

  private processAbility(_gimmickType: GimmickType): { blocked: boolean; message?: string } {
    // ナイトメア・ハザード: ギミック接触時に後方に💩を設置
    if (this.horseData.id === 10) {
      // RaceManagerで処理（💩設置）
      this.scene.events.emit('placePoopBehind', this);
    }

    return { blocked: false };
  }

  // プロフェッサーP用: 前方のギミックを検知
  shouldAvoidBranch(_branchX: number, gimmicksAhead: { type: GimmickType; lane: number }[]): boolean {
    if (this.horseData.id !== 3) return false;

    const badGimmicks: GimmickType[] = ['poop', 'mud', 'construction'];

    // 現在のレーンの前方に悪いギミックがあるかチェック
    const hasBadGimmickAhead = gimmicksAhead.some(
      g => badGimmicks.includes(g.type) && g.lane === this.currentLane
    );

    return hasBadGimmickAhead;
  }

  // ミスター・セーフティ用: 近くの馬を保護
  isNearby(other: Horse, range: number = 100): boolean {
    const dx = Math.abs(this.positionX - other.positionX);
    const dy = Math.abs(this.y - other.y);
    return dx < range && dy < COURSE_CONFIG.laneHeight * 2;
  }

  isProtectedBySafety(): boolean {
    // RaceManagerから呼ばれる
    return false; // 実際の判定はRaceManagerで行う
  }
}
