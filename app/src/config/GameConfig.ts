import type { CourseConfig, HorseCondition, ConditionConfig } from '../types';

// ゲーム画面設定
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// コース設定（90秒以上のレース用）
export const COURSE_CONFIG: CourseConfig = {
  totalLength: 13500,     // コース全長（ピクセル）
  branchDensity: 0.7,     // 分岐の密度（増量）
  gimmickDensity: 0.4,    // ギミックの密度（増量）
  laneCount: 15,          // レーン数
  laneHeight: 60,         // レーン高さ
};

// 馬の設定
export const HORSE_CONFIG = {
  baseSpeed: 120,         // 基本速度（ピクセル/秒）
  size: 48,               // 馬のサイズ
  startX: 100,            // スタート位置X
  laneChangeSpeed: 300,   // レーン移動速度（ピクセル/秒）
};

// レース設定
export const RACE_CONFIG = {
  countdownSeconds: 3,    // カウントダウン秒数
  cameraLerpFactor: 0.05, // カメラ追従の滑らかさ
  cameraLeadOffset: 640,  // 先頭馬を画面左1/3に配置
};

// 実況設定
export const COMMENTARY_CONFIG = {
  maxMessages: 8,         // 表示する最大メッセージ数
  fadeTime: 5000,         // メッセージのフェード時間
  fontSize: 20,           // フォントサイズ
};

// UI設定
export const UI_CONFIG = {
  paddingX: 20,
  paddingY: 20,
  cardWidth: 180,
  cardHeight: 240,
  buttonWidth: 200,
  buttonHeight: 60,
};

// 色設定
export const COLORS = {
  background: 0x1a1a2e,
  track: 0x2d5a27,
  trackLine: 0xffffff,
  laneOdd: 0x3d6a37,
  laneEven: 0x2d5a27,
  startLine: 0xff0000,
  goalLine: 0xffd700,
  uiBackground: 0x000000,
  uiText: 0xffffff,
};

// シーンキー
export const SCENES = {
  TITLE: 'TitleScene',
  PADDOCK: 'PaddockScene',
  RACE: 'RaceScene',
  RESULT: 'ResultScene',
} as const;

// レースモード設定（距離はメートル表示、内部はピクセル）
// 1メートル = 3ピクセル として変換
export const PIXELS_PER_METER = 3;

export const RACE_MODES = {
  SHORT: {
    name: '1200〜1600m',
    minLength: 1200,
    maxLength: 1600,
    label: 'スプリント',
  },
  MEDIUM: {
    name: '1800〜2400m',
    minLength: 1800,
    maxLength: 2400,
    label: 'マイル',
  },
  LONG: {
    name: '2800〜3600m',
    minLength: 2800,
    maxLength: 3600,
    label: 'ステイヤー',
  },
} as const;

export type RaceMode = keyof typeof RACE_MODES;

// 調子設定
export const CONDITION_CONFIG: Record<HorseCondition, ConditionConfig> = {
  excellent: {
    name: '絶好調',
    emoji: '🔥',
    speedModifier: 1.15,
    color: '#FF4500',
  },
  good: {
    name: '好調',
    emoji: '😊',
    speedModifier: 1.07,
    color: '#32CD32',
  },
  normal: {
    name: '普通',
    emoji: '😐',
    speedModifier: 1.0,
    color: '#808080',
  },
  poor: {
    name: '不調',
    emoji: '😓',
    speedModifier: 0.93,
    color: '#4169E1',
  },
  terrible: {
    name: '絶不調',
    emoji: '😵',
    speedModifier: 0.85,
    color: '#8B008B',
  },
};

// 調子の確率分布
export const CONDITION_WEIGHTS: { condition: HorseCondition; weight: number }[] = [
  { condition: 'excellent', weight: 10 },
  { condition: 'good', weight: 25 },
  { condition: 'normal', weight: 35 },
  { condition: 'poor', weight: 20 },
  { condition: 'terrible', weight: 10 },
];

// 特別な日の設定
export type SpecialDayType = 'normal' | 'poop' | 'spring' | 'grass' | 'mud' | 'construction' | 'chaos';

export interface SpecialDayConfig {
  name: string;
  emoji: string;
  description: string;
  color: string;
  gimmickModifiers: {
    spring: number;
    construction: number;
    poop: number;
    mud: number;
    grass: number;
    carrot: number;
  };
}

export const SPECIAL_DAY_CONFIG: Record<SpecialDayType, SpecialDayConfig> = {
  normal: {
    name: '通常',
    emoji: '🏇',
    description: 'いつも通りのレース',
    color: '#808080',
    gimmickModifiers: {
      spring: 1,
      construction: 1,
      poop: 1,
      mud: 1,
      grass: 1,
      carrot: 1,
    },
  },
  poop: {
    name: 'うんこの日',
    emoji: '💩',
    description: 'うんこが大量発生！',
    color: '#8B4513',
    gimmickModifiers: {
      spring: 0.5,
      construction: 0.5,
      poop: 3.0,
      mud: 0.5,
      grass: 0.5,
      carrot: 0.5,
    },
  },
  spring: {
    name: 'ばねの日',
    emoji: '🌀',
    description: 'ばねだらけでピョンピョン！',
    color: '#00BFFF',
    gimmickModifiers: {
      spring: 3.0,
      construction: 0.5,
      poop: 0.5,
      mud: 0.5,
      grass: 0.5,
      carrot: 0.5,
    },
  },
  grass: {
    name: '芝生の日',
    emoji: '🌱',
    description: '芝生でみんな加速！',
    color: '#32CD32',
    gimmickModifiers: {
      spring: 0.5,
      construction: 0.5,
      poop: 0.5,
      mud: 0.5,
      grass: 3.0,
      carrot: 0.5,
    },
  },
  mud: {
    name: 'ぬかるみの日',
    emoji: '💧',
    description: '雨上がりでぬかるみ多発！',
    color: '#4169E1',
    gimmickModifiers: {
      spring: 0.5,
      construction: 0.5,
      poop: 0.5,
      mud: 3.0,
      grass: 0.5,
      carrot: 0.5,
    },
  },
  construction: {
    name: '工事の日',
    emoji: '🚧',
    description: '工事中だらけで迂回必須！',
    color: '#FF8C00',
    gimmickModifiers: {
      spring: 0.5,
      construction: 3.0,
      poop: 0.5,
      mud: 0.5,
      grass: 0.5,
      carrot: 0.5,
    },
  },
  chaos: {
    name: 'カオスの日',
    emoji: '🎲',
    description: '全ギミック大増量！',
    color: '#FF1493',
    gimmickModifiers: {
      spring: 2.0,
      construction: 2.0,
      poop: 2.0,
      mud: 2.0,
      grass: 2.0,
      carrot: 2.0,
    },
  },
};

// 特別な日の確率分布
export const SPECIAL_DAY_WEIGHTS: { day: SpecialDayType; weight: number }[] = [
  { day: 'normal', weight: 30 },
  { day: 'poop', weight: 12 },
  { day: 'spring', weight: 12 },
  { day: 'grass', weight: 12 },
  { day: 'mud', weight: 12 },
  { day: 'construction', weight: 12 },
  { day: 'chaos', weight: 10 },
];
