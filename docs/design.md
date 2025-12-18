# ギャロップあみだダービー - 設計書

## 0. ユーザー選択事項

| 項目 | 選択 |
|------|------|
| 馬のグラフィック | 絵文字/アイコン（🐴） |
| 実況表示 | ログ表示（画面右下） |
| コース長 | 長め（90秒以上） |

## 1. ディレクトリ構造

```
app/src/
├── main.ts                 # エントリポイント
├── config/
│   └── GameConfig.ts       # Phaser設定、定数
├── types/
│   └── index.ts            # 型定義（Horse, Gimmick, Lane等）
├── data/
│   └── horses.ts           # 15頭の馬データ
├── entities/
│   ├── Horse.ts            # 馬クラス（Phaser.GameObjects.Sprite継承）
│   └── Gimmick.ts          # ギミック基底クラス
├── scenes/
│   ├── PaddockScene.ts     # エントリー画面（馬選択・結果入力）
│   ├── RaceScene.ts        # レース画面（メインゲーム）
│   └── ResultScene.ts      # リザルト画面
├── systems/
│   ├── CourseGenerator.ts  # あみだコース生成
│   ├── RaceManager.ts      # レース進行管理
│   └── CommentarySystem.ts # 実況システム
└── utils/
    └── helpers.ts          # ユーティリティ関数
```

## 2. 型定義 (types/index.ts)

### 2.1 馬の型

```typescript
interface HorseStats {
  speed: number;      // SPD: 基本速度倍率 (0.7-1.5)
  intelligence: number; // INT: 分岐判断 (0.5-2.0)
  power: number;      // POW: 障害物耐性 (0.5-2.5)
}

interface HorseData {
  id: number;         // 1-15
  name: string;       // 馬名
  type: string;       // タイプ（スピード特化、パワー型等）
  stats: HorseStats;
  ability: {
    name: string;     // 特殊能力名
    description: string;
  };
}

type HorseState = 'running' | 'stunned' | 'jumping' | 'boosted' | 'finished';
```

### 2.2 ギミックの型

```typescript
type GimmickType = 'spring' | 'construction' | 'poop' | 'mud' | 'grass';

interface GimmickData {
  type: GimmickType;
  emoji: string;      // 🌀🚧💩💧🌱
  effect: {
    duration?: number;  // 効果時間（ms）
    speedModifier?: number; // 速度倍率
    laneShift?: number; // レーン移動量
  };
}
```

### 2.3 コースの型

```typescript
interface Lane {
  id: number;         // 0-14 (15レーン)
  result: string;     // ゴール時の結果テキスト
}

interface AmidaBranch {
  x: number;          // X座標
  fromLane: number;   // 元レーン
  toLane: number;     // 移動先レーン
}

interface CourseData {
  lanes: Lane[];
  branches: AmidaBranch[];
  gimmicks: PlacedGimmick[];
  totalLength: number;
}

interface PlacedGimmick {
  type: GimmickType;
  x: number;
  lane: number;
}
```

## 3. コアクラス設計

### 3.1 Horse クラス (entities/Horse.ts)

```typescript
class Horse extends Phaser.GameObjects.Container {
  // Properties
  data: HorseData;
  currentLane: number;
  state: HorseState;
  currentSpeed: number;
  positionX: number;

  // Visual (絵文字ベース)
  // - 🐴 馬本体
  // - 背景色で馬を区別（15色）
  // - 番号ラベル表示

  // Methods
  update(delta: number): void;           // 毎フレーム更新
  applyGimmickEffect(gimmick: GimmickData): void;
  changeLane(targetLane: number): void;
  applyAbility(context: AbilityContext): void; // 固有能力発動
}
```

### 3.2 RaceManager (systems/RaceManager.ts)

```typescript
class RaceManager {
  horses: Horse[];
  course: CourseData;
  finishOrder: Horse[];

  startRace(): void;
  update(delta: number): void;
  checkCollisions(): void;
  checkBranches(): void;
  checkGimmicks(): void;
  onHorseFinish(horse: Horse): void;
}
```

### 3.3 CourseGenerator (systems/CourseGenerator.ts)

```typescript
class CourseGenerator {
  static generate(config: CourseConfig): CourseData;

  // あみだくじ生成ルール:
  // - 縦線（分岐）は一定間隔でランダム配置
  // - 同じX座標に隣接する縦線は配置しない
  // - ギミックは分岐と重ならないように配置
}

// コース設定（90秒以上のレース）
interface CourseConfig {
  totalLength: 9000;      // ピクセル長（約90-120秒想定）
  branchDensity: 0.3;     // 分岐の密度
  gimmickDensity: 0.2;    // ギミックの密度
  laneCount: 15;
}
```

## 4. シーン設計

### 4.1 PaddockScene（エントリー画面）

**レイアウト:**
```
[馬カード x 15（横スクロール可能）]
[結果入力エリア: 1等〜15等のテキスト入力]
[START ボタン]
```

**機能:**
- 15頭の馬ステータス表示（SPD/INT/POW + 特殊能力）
- 各レーンの結果入力（景品・罰ゲーム等）
- START押下でRaceSceneへ遷移

### 4.2 RaceScene（レース画面）

**レイアウト:**
```
[コース表示（横スクロール）]
  - 15レーン（色分け）
  - あみだ分岐線
  - ギミックアイコン
  - 馬スプライト x 15
[実況ログ（右下）]
```

**カメラ:**
- Lerp追従（先頭馬が画面左1/3に来るよう）
- ゴール付近で固定

### 4.3 ResultScene（リザルト画面）

**表示:**
- 順位表（1位〜15位）
- 各馬の結果（景品/罰ゲーム）
- 「もう一度」ボタン

## 5. 15頭の固有能力実装方針

各馬の能力は `applyAbility()` メソッドでフック:

| # | 馬名 | 実装ポイント |
|---|------|-------------|
| 01 | ゴールデンバレット | grass時speedModifier=2.0, poop/mud時duration*2 |
| 02 | アイアンタフネス | construction破壊, poop.duration*0.3 |
| 03 | プロフェッサーP | 前方ギミック検知→分岐100%曲がる |
| 04 | スプリングホッパー | spring.laneShift=2, 着地後boost |
| 05 | カオス・ジョーカー | ギミック効果50%反転 |
| 06 | マッドスライマー | mud時speedModifier=1.5 |
| 07 | グラス・イーター | grass効果持続時間*3 |
| 08 | ミスター・セーフティ | 周囲馬のpoop/banana無効化 |
| 09 | ゴースト・ライダー | construction/馬衝突無効, grass無効 |
| 10 | ナイトメア・ハザード | ギミック通過時、後方にpoop設置 |
| 11 | ミラクル・ダイス | 5秒毎stats変動(0.5-2.5) |
| 12 | ヘヴィ・メタル・ベア | mud/construction破壊, spring無効 |
| 13 | ドリーム・クリーナー | poop食べて1秒speed*1.8 |
| 14 | サイド・スライダー | レーン移動速度*3, 移動中無敵 |
| 15 | アンラッキー・バニー | 被弾蓄積→3秒間speedボーナス |

## 6. 実装フェーズ

### Phase 1: 基盤構築
- [ ] 型定義 (types/index.ts)
- [ ] 馬データ (data/horses.ts)
- [ ] Horseクラス基本実装
- [ ] シーン骨格（3画面遷移）

### Phase 2: コース・レース
- [ ] CourseGenerator実装
- [ ] あみだ分岐ロジック
- [ ] RaceManager実装
- [ ] カメラ追従

### Phase 3: ギミック
- [ ] 5大ギミック実装
- [ ] 衝突判定
- [ ] エフェクト表現

### Phase 4: 固有能力
- [ ] 15頭の特殊能力実装
- [ ] 能力発動エフェクト

### Phase 5: 演出・UI
- [ ] PaddockScene UI
- [ ] 実況システム
- [ ] ResultScene UI
- [ ] サウンド（オプション）

## 7. 作成ファイル一覧

| パス | 説明 |
|------|------|
| `app/src/main.ts` | エントリポイント（更新） |
| `app/src/config/GameConfig.ts` | ゲーム設定・定数 |
| `app/src/types/index.ts` | 型定義 |
| `app/src/data/horses.ts` | 15頭の馬データ |
| `app/src/entities/Horse.ts` | 馬クラス |
| `app/src/entities/Gimmick.ts` | ギミッククラス |
| `app/src/scenes/PaddockScene.ts` | パドック画面 |
| `app/src/scenes/RaceScene.ts` | レース画面 |
| `app/src/scenes/ResultScene.ts` | リザルト画面 |
| `app/src/systems/CourseGenerator.ts` | コース生成 |
| `app/src/systems/RaceManager.ts` | レース管理 |
| `app/src/systems/CommentarySystem.ts` | 実況システム |
