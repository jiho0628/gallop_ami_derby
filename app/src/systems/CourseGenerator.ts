import type { CourseData, AmidaBranch, PlacedGimmick, GimmickType, Lane } from '../types';
import { COURSE_CONFIG, HORSE_CONFIG, SPECIAL_DAY_CONFIG, SpecialDayType } from '../config/GameConfig';
import { LANE_COLORS } from '../data/horses';

interface GenerateConfig {
  totalLength: number;
  branchDensity: number;
  gimmickDensity: number;
  laneCount: number;
  laneHeight: number;
  laneResults?: string[];
  specialDay?: SpecialDayType;
}

export class CourseGenerator {
  static generate(config: GenerateConfig): CourseData {
    const {
      totalLength,
      branchDensity,
      gimmickDensity,
      laneCount,
      laneResults = [],
      specialDay = 'normal',
    } = config;

    const startX = HORSE_CONFIG.startX;
    const goalX = startX + totalLength;

    // レーン生成
    const lanes: Lane[] = [];
    for (let i = 0; i < laneCount; i++) {
      lanes.push({
        id: i,
        result: laneResults[i] || `レーン${i + 1}`,
        color: LANE_COLORS[i],
      });
    }

    // あみだ分岐生成
    const branches = this.generateBranches(startX, goalX, laneCount, branchDensity);

    // ギミック生成（特別な日に応じて確率を調整）
    const gimmicks = this.generateGimmicks(startX, goalX, laneCount, gimmickDensity, branches, specialDay);

    return {
      lanes,
      branches,
      gimmicks,
      totalLength,
      startX,
      goalX,
    };
  }

  private static generateBranches(
    startX: number,
    goalX: number,
    laneCount: number,
    density: number
  ): AmidaBranch[] {
    const branches: AmidaBranch[] = [];
    const sectionWidth = 120; // セクション幅（狭くして分岐を増やす）

    // コースを複数セクションに分割
    const numSections = Math.floor((goalX - startX - 200) / sectionWidth);

    for (let section = 0; section < numSections; section++) {
      const sectionStart = startX + 100 + section * sectionWidth;

      // 各セクションで確率的に分岐を配置
      if (Math.random() < density) {
        // このセクションに配置する分岐の数（増量: 1-5本）
        const numBranches = Math.floor(Math.random() * 5) + 1;
        const usedLanes = new Set<number>();

        for (let b = 0; b < numBranches; b++) {
          // ランダムなレーンを選択（隣接レーンが使用されていない）
          let attempts = 0;
          let fromLane: number;

          do {
            fromLane = Math.floor(Math.random() * (laneCount - 1));
            attempts++;
          } while (
            (usedLanes.has(fromLane) || usedLanes.has(fromLane + 1)) &&
            attempts < 15
          );

          if (attempts >= 15) continue;

          const toLane = fromLane + 1;
          const x = sectionStart + Math.random() * (sectionWidth - 30);

          branches.push({
            id: `branch-${section}-${b}`,
            x,
            fromLane,
            toLane,
          });

          usedLanes.add(fromLane);
          usedLanes.add(toLane);
        }
      }
    }

    // X座標でソート
    branches.sort((a, b) => a.x - b.x);

    return branches;
  }

  private static generateGimmicks(
    startX: number,
    goalX: number,
    laneCount: number,
    density: number,
    branches: AmidaBranch[],
    specialDay: SpecialDayType
  ): PlacedGimmick[] {
    const gimmicks: PlacedGimmick[] = [];
    const gimmickTypes: GimmickType[] = ['spring', 'construction', 'poop', 'mud', 'grass'];
    const baseWeights = [0.18, 0.18, 0.22, 0.21, 0.21]; // 基本配置確率

    // 特別な日に応じて重みを調整
    const dayConfig = SPECIAL_DAY_CONFIG[specialDay];
    const gimmickWeights = baseWeights.map((weight, index) => {
      const gimmickType = gimmickTypes[index];
      const modifier = dayConfig.gimmickModifiers[gimmickType];
      return weight * modifier;
    });

    const minGap = 60;   // ギミック間の最小距離（縮小）
    const branchBuffer = 50; // 分岐からの最小距離（縮小）

    // グリッドベースで配置（グリッドを細かく）
    const gridX = 150;
    const numGridX = Math.floor((goalX - startX - 200) / gridX);

    for (let gx = 0; gx < numGridX; gx++) {
      for (let lane = 0; lane < laneCount; lane++) {
        if (Math.random() > density) continue;

        const x = startX + 120 + gx * gridX + (Math.random() - 0.5) * 80;

        // 分岐との距離チェック
        const tooCloseToB = branches.some(b =>
          Math.abs(b.x - x) < branchBuffer &&
          (b.fromLane === lane || b.toLane === lane)
        );
        if (tooCloseToB) continue;

        // 他のギミックとの距離チェック
        const tooCloseToGimmick = gimmicks.some(g =>
          Math.abs(g.x - x) < minGap && g.lane === lane
        );
        if (tooCloseToGimmick) continue;

        // ギミックタイプを重み付けランダムで選択
        const type = this.weightedRandom(gimmickTypes, gimmickWeights);

        gimmicks.push({
          id: `gimmick-${gx}-${lane}-${Math.random().toString(36).substring(2, 7)}`,
          type,
          x,
          lane,
          active: true,
        });
      }
    }

    return gimmicks;
  }

  private static weightedRandom<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }

    return items[items.length - 1];
  }
}
