import type { CourseConfig } from '../types';

// ゲーム画面設定
export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

// コース設定（90秒以上のレース用）
export const COURSE_CONFIG: CourseConfig = {
  totalLength: 9000,      // コース全長（ピクセル）
  branchDensity: 0.7,     // 分岐の密度（増量）
  gimmickDensity: 0.4,    // ギミックの密度（増量）
  laneCount: 15,          // レーン数
  laneHeight: 60,         // レーン高さ
};

// 馬の設定
export const HORSE_CONFIG = {
  baseSpeed: 80,          // 基本速度（ピクセル/秒）
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

// レースモード設定
export const RACE_MODES = {
  SHORT: {
    name: '30秒',
    totalLength: 3000,
    label: 'ショート',
  },
  MEDIUM: {
    name: '60秒',
    totalLength: 6000,
    label: 'ミディアム',
  },
  LONG: {
    name: '90秒',
    totalLength: 9000,
    label: 'ロング',
  },
} as const;

export type RaceMode = keyof typeof RACE_MODES;
