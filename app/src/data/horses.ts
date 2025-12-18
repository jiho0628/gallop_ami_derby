import type { HorseData, GimmickConfig } from '../types';

// 15頭の馬データ
export const HORSES: HorseData[] = [
  {
    id: 1,
    name: 'ゴールデンバレット',
    type: 'スピード特化',
    stats: { speed: 1.2, intelligence: 0.8, power: 0.5 },
    ability: {
      name: '芝生超加速',
      description: '芝生での加速率が2倍。\nただし💩とぬかるみに弱い。',
    },
    color: '#FFD700',
  },
  {
    id: 2,
    name: 'アイアンタフネス',
    type: 'パワー型',
    stats: { speed: 0.8, intelligence: 0.6, power: 1.8 },
    ability: {
      name: '重装甲',
      description: '🚧を停止せず破壊。\n💩スタン時間70%カット。',
    },
    color: '#708090',
  },
  {
    id: 3,
    name: 'プロフェッサーP',
    type: '知性派',
    stats: { speed: 1.0, intelligence: 2.0, power: 0.8 },
    ability: {
      name: '最適解選択',
      description: '悪いギミックがある分岐を\n100%曲がって回避する。',
    },
    color: '#4169E1',
  },
  {
    id: 4,
    name: 'スプリングホッパー',
    type: '跳躍特化',
    stats: { speed: 1.1, intelligence: 1.0, power: 1.0 },
    ability: {
      name: 'ハイジャンプ',
      description: '🌀で2レーン分跳び、\n着地後2秒間加速する。',
    },
    color: '#32CD32',
  },
  {
    id: 5,
    name: 'カオス・ジョーカー',
    type: 'ギャンブル',
    stats: { speed: 1.0, intelligence: 1.0, power: 1.0 },
    ability: {
      name: '効果反転',
      description: 'ギミック効果を確率で反転\n（💩で加速、芝生で減速等）',
    },
    color: '#9400D3',
  },
  {
    id: 6,
    name: 'マッドスライマー',
    type: '泥専門',
    stats: { speed: 0.9, intelligence: 0.8, power: 1.5 },
    ability: {
      name: '泥遊び',
      description: '💧（ぬかるみ）に入ると\nSpeedが1.5倍になる。',
    },
    color: '#8B4513',
  },
  {
    id: 7,
    name: 'グラス・イーター',
    type: '芝専門',
    stats: { speed: 1.0, intelligence: 0.7, power: 1.2 },
    ability: {
      name: '常時ブースト',
      description: '🌱の効果時間が\nエリア外でも3倍持続。',
    },
    color: '#228B22',
  },
  {
    id: 8,
    name: 'ミスター・セーフティ',
    type: '防御支援',
    stats: { speed: 0.9, intelligence: 1.2, power: 1.3 },
    ability: {
      name: '安全圏',
      description: '自身の周囲にいる他馬も含め\n💩の判定を無効化する。',
    },
    color: '#00CED1',
  },
  {
    id: 9,
    name: 'ゴースト・ライダー',
    type: '透過型',
    stats: { speed: 1.1, intelligence: 0.5, power: 1.0 },
    ability: {
      name: '透過',
      description: '🚧および他馬と衝突しない。\nただし芝生の恩恵も無効。',
    },
    color: '#E6E6FA',
  },
  {
    id: 10,
    name: 'ナイトメア・ハザード',
    type: '妨害魔',
    stats: { speed: 1.2, intelligence: 1.1, power: 0.9 },
    ability: {
      name: 'トラップ配置',
      description: 'ギミック接触時、\n自分の真後ろに💩を設置。',
    },
    color: '#800080',
  },
  {
    id: 11,
    name: 'ミラクル・ダイス',
    type: '不確定型',
    stats: { speed: 1.0, intelligence: 1.0, power: 1.0 },
    ability: {
      name: 'ステータス・シャッフル',
      description: '5秒ごとに全ステータスが\n0.7〜1.5倍の間で変動。',
    },
    color: '#FF69B4',
  },
  {
    id: 12,
    name: 'ヘヴィ・メタル・ベア',
    type: '重量級',
    stats: { speed: 0.95, intelligence: 0.5, power: 2.5 },
    ability: {
      name: 'ヘヴィ・ウェイト',
      description: '💧🚧を粉砕。\nただし🌀が反応しない。',
    },
    color: '#2F4F4F',
  },
  {
    id: 13,
    name: 'ドリーム・クリーナー',
    type: '掃除屋',
    stats: { speed: 1.1, intelligence: 1.2, power: 0.8 },
    ability: {
      name: 'クリーン・ラン',
      description: '前方の💩を食べて無効化、\n1秒間Speed1.8倍。',
    },
    color: '#87CEEB',
  },
  {
    id: 14,
    name: 'サイド・スライダー',
    type: '移動特化',
    stats: { speed: 1.0, intelligence: 1.5, power: 1.0 },
    ability: {
      name: 'ラテラル・アクセル',
      description: 'レーン移動の速度が3倍。\n移動中は無敵。',
    },
    color: '#FF6347',
  },
  {
    id: 15,
    name: 'アンラッキー・バニー',
    type: '逆転型',
    stats: { speed: 1.2, intelligence: 0.5, power: 0.5 },
    ability: {
      name: 'リベンジ・ダッシュ',
      description: '💩🚧💧を喰らうたびに\n3秒間Speed加算。',
    },
    color: '#FFC0CB',
  },
];

// 5大ギミック設定
export const GIMMICKS: Record<string, GimmickConfig> = {
  spring: {
    type: 'spring',
    emoji: '🌀',
    name: 'ばね',
    effect: {
      laneShift: 1,
    },
  },
  construction: {
    type: 'construction',
    emoji: '🚧',
    name: '工事中',
    effect: {
      stopTime: 1000,
      laneShift: 1,
    },
  },
  poop: {
    type: 'poop',
    emoji: '💩',
    name: 'うんこ',
    effect: {
      duration: 3000,
    },
  },
  mud: {
    type: 'mud',
    emoji: '💧',
    name: 'ぬかるみ',
    effect: {
      speedModifier: 0.5,
      duration: 2000,
    },
  },
  grass: {
    type: 'grass',
    emoji: '🌱',
    name: '芝生',
    effect: {
      speedModifier: 1.5,
      duration: 2000,
    },
  },
};

// レーンの色（15色）
export const LANE_COLORS = [
  '#FF6B6B', // 赤
  '#4ECDC4', // ターコイズ
  '#45B7D1', // 水色
  '#96CEB4', // 薄緑
  '#FFEAA7', // 黄
  '#DDA0DD', // プラム
  '#98D8C8', // ミント
  '#F7DC6F', // ゴールド
  '#BB8FCE', // 紫
  '#85C1E9', // スカイブルー
  '#F8B500', // オレンジ
  '#82E0AA', // ライトグリーン
  '#F1948A', // サーモン
  '#AED6F1', // ライトブルー
  '#D7BDE2', // ラベンダー
];
