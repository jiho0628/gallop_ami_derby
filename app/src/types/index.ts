// ========================================
// 馬関連の型定義
// ========================================

export interface HorseStats {
  speed: number;        // SPD: 基本速度倍率 (0.7-1.5)
  intelligence: number; // INT: 分岐判断 (0.5-2.0)
  power: number;        // POW: 障害物耐性 (0.5-2.5)
  stamina: number;      // STA: 体力・持久力 (0.5-2.0) 高いほど疲れにくい
}

export interface HorseAbility {
  name: string;         // 特殊能力名
  description: string;  // 説明
}

export interface HorseData {
  id: number;           // 1-15
  name: string;         // 馬名
  type: string;         // タイプ（スピード特化、パワー型等）
  stats: HorseStats;
  ability: HorseAbility;
  color: string;        // 識別色
}

export type HorseState =
  | 'waiting'    // スタート前
  | 'running'    // 走行中
  | 'stunned'    // スタン状態
  | 'jumping'    // ジャンプ中
  | 'boosted'    // 加速中
  | 'finished';  // ゴール済み

// 馬の調子
export type HorseCondition = 'excellent' | 'good' | 'normal' | 'poor' | 'terrible';

export interface ConditionConfig {
  name: string;
  emoji: string;
  speedModifier: number;
  color: string;
}

// ========================================
// ギミック関連の型定義
// ========================================

export type GimmickType = 'spring' | 'construction' | 'poop' | 'mud' | 'grass' | 'carrot';

export interface GimmickConfig {
  type: GimmickType;
  emoji: string;
  name: string;
  effect: {
    duration?: number;       // 効果時間（ms）
    speedModifier?: number;  // 速度倍率
    laneShift?: number;      // レーン移動量
    stopTime?: number;       // 停止時間（ms）
    staminaRestore?: number; // スタミナ回復量（0-1の割合）
  };
}

export interface PlacedGimmick {
  id: string;
  type: GimmickType;
  x: number;
  lane: number;
  active: boolean;
}

// ========================================
// コース関連の型定義
// ========================================

export interface Lane {
  id: number;           // 0-14 (15レーン)
  result: string;       // ゴール時の結果テキスト
  color: string;        // レーン色
}

export interface AmidaBranch {
  id: string;
  x: number;            // X座標
  fromLane: number;     // 元レーン
  toLane: number;       // 移動先レーン（常に fromLane ± 1）
}

export interface CourseData {
  lanes: Lane[];
  branches: AmidaBranch[];
  gimmicks: PlacedGimmick[];
  totalLength: number;
  startX: number;
  goalX: number;
}

export interface CourseConfig {
  totalLength: number;      // コース全長（ピクセル）
  branchDensity: number;    // 分岐の密度 (0-1)
  gimmickDensity: number;   // ギミックの密度 (0-1)
  laneCount: number;        // レーン数
  laneHeight: number;       // レーン高さ
}

// ========================================
// レース関連の型定義
// ========================================

export interface RaceResult {
  rank: number;
  horseId: number;
  horseName: string;
  result: string;       // 順位に対応する景品/罰ゲーム
  finishTime: number;
}

export interface CommentaryMessage {
  id: string;
  text: string;
  timestamp: number;
  horseId?: number;
  type: 'info' | 'gimmick' | 'ability' | 'finish';
}

// ========================================
// 能力発動コンテキスト
// ========================================

export interface AbilityContext {
  gimmickType?: GimmickType;
  nearbyHorses?: number[];
  distanceToGoal?: number;
  currentLane?: number;
}
