import Phaser from 'phaser';
import { Horse } from '../entities/Horse';
import type { CourseData, RaceResult, PlacedGimmick, GimmickType, AmidaBranch } from '../types';

export class RaceManager {
  private scene: Phaser.Scene;
  private horses: Horse[];
  private courseData: CourseData;
  private finishOrder: Horse[] = [];
  private processedGimmicks: Set<string> = new Set();
  private processedBranches: Map<number, Set<string>> = new Map(); // horseId -> Set<branchId>

  constructor(scene: Phaser.Scene, horses: Horse[], courseData: CourseData) {
    this.scene = scene;
    this.horses = horses;
    this.courseData = courseData;

    // 各馬の処理済み分岐を初期化
    horses.forEach(horse => {
      this.processedBranches.set(horse.horseData.id, new Set());
    });
  }

  update(delta: number, raceTime: number): void {
    this.horses.forEach(horse => {
      if (horse.state === 'finished' || horse.state === 'waiting') return;

      // ゴール判定
      if (horse.positionX >= this.courseData.goalX) {
        this.onHorseFinish(horse, raceTime);
        return;
      }

      // 分岐判定
      this.checkBranches(horse);

      // ギミック判定
      this.checkGimmicks(horse);
    });

    // レース終了判定
    if (this.finishOrder.length === this.horses.length) {
      this.onRaceFinished();
    }
  }

  private checkBranches(horse: Horse): void {
    if (horse.state === 'jumping' || horse.state === 'stunned') return;

    const processedSet = this.processedBranches.get(horse.horseData.id)!;
    const hitRange = 20;

    for (const branch of this.courseData.branches) {
      // 既に処理済みならスキップ
      if (processedSet.has(branch.id)) continue;

      // 位置が分岐に達したか
      if (Math.abs(horse.positionX - branch.x) > hitRange) continue;

      // 現在のレーンが分岐に関係あるか
      const isOnFromLane = horse.currentLane === branch.fromLane;
      const isOnToLane = horse.currentLane === branch.toLane;

      if (!isOnFromLane && !isOnToLane) continue;

      // 処理済みにマーク
      processedSet.add(branch.id);

      // 分岐判定
      const shouldTurn = this.shouldTurnAtBranch(horse, branch);

      if (shouldTurn) {
        const targetLane = isOnFromLane ? branch.toLane : branch.fromLane;
        horse.changeLane(targetLane);

        this.scene.events.emit('commentary',
          `${horse.horseData.name}が分岐で${targetLane > horse.currentLane ? '下' : '上'}へ！`
        );
      }
    }
  }

  private shouldTurnAtBranch(horse: Horse, branch: AmidaBranch): boolean {
    const intelligence = horse.horseData.stats.intelligence;

    // プロフェッサーP: 前方の悪いギミックを検知して回避
    if (horse.horseData.id === 3) {
      const gimmicksAhead = this.getGimmicksAhead(horse.positionX, 500);
      if (horse.shouldAvoidBranch(branch.x, gimmicksAhead)) {
        return true;
      }
    }

    // 知性値に基づく確率で曲がる
    // INT 1.0 = 50%, INT 2.0 = 100%, INT 0.5 = 25%
    const turnProbability = Math.min(1, intelligence * 0.5);
    return Math.random() < turnProbability;
  }

  private getGimmicksAhead(currentX: number, range: number): { type: GimmickType; lane: number }[] {
    return this.courseData.gimmicks
      .filter(g => g.x > currentX && g.x < currentX + range && g.active)
      .map(g => ({ type: g.type, lane: g.lane }));
  }

  private checkGimmicks(horse: Horse): void {
    if (horse.state === 'stunned' || horse.state === 'jumping') return;

    const hitRange = 30;

    for (const gimmick of this.courseData.gimmicks) {
      if (!gimmick.active) continue;

      // 位置とレーンの判定
      if (Math.abs(horse.positionX - gimmick.x) > hitRange) continue;
      if (horse.currentLane !== gimmick.lane) continue;

      // ギミック固有のIDを生成（馬ごとに1回だけ処理）
      const gimmickHorseKey = `${gimmick.id}-${horse.horseData.id}`;
      if (this.processedGimmicks.has(gimmickHorseKey)) continue;
      this.processedGimmicks.add(gimmickHorseKey);

      // ミスター・セーフティによる保護判定
      if (this.isProtectedBySafety(horse, gimmick.type)) {
        this.scene.events.emit('commentary',
          `${horse.horseData.name}はミスター・セーフティの安全圏で${gimmick.type}を回避！`
        );
        continue;
      }

      // ギミック効果を適用
      const result = horse.applyGimmickEffect(gimmick.type);

      if (result.message) {
        this.scene.events.emit('commentary', result.message);
      }

      // うんこと工事中は当たったら消える
      if (gimmick.type === 'poop' || gimmick.type === 'construction') {
        gimmick.active = false;
        this.scene.events.emit('removeGimmick', gimmick.id);
      }
    }
  }

  private isProtectedBySafety(horse: Horse, gimmickType: GimmickType): boolean {
    // 💩のみ保護対象
    if (gimmickType !== 'poop') return false;

    // ミスター・セーフティ自身は自分で保護される必要はない（自身の能力で処理）
    if (horse.horseData.id === 8) return false;

    // ミスター・セーフティを探す
    const safety = this.horses.find(h => h.horseData.id === 8 && h.state !== 'finished');
    if (!safety) return false;

    // 近くにいるか判定
    return safety.isNearby(horse, 150);
  }

  private onHorseFinish(horse: Horse, raceTime: number): void {
    horse.finish(raceTime);
    this.finishOrder.push(horse);

    const rank = this.finishOrder.length;

    // 順位ベースで景品を割り振り（1位→lanes[0], 2位→lanes[1], ...）
    const result = this.courseData.lanes[rank - 1]?.result || '';

    let message = '';
    if (rank === 1) {
      message = `🏆 ${horse.horseData.name}が1着でゴール！結果は「${result}」！`;
    } else if (rank <= 3) {
      message = `${horse.horseData.name}が${rank}着！結果は「${result}」`;
    } else {
      message = `${horse.horseData.name}がゴール（${rank}着）`;
    }

    this.scene.events.emit('commentary', message);
  }

  private onRaceFinished(): void {
    const results: RaceResult[] = this.finishOrder.map((horse, index) => {
      const rank = index + 1;
      // 順位ベースで景品を割り振り（1位→lanes[0], 2位→lanes[1], ...）
      return {
        rank: rank,
        horseId: horse.horseData.id,
        horseName: horse.horseData.name,
        result: this.courseData.lanes[index]?.result || '',
        finishTime: horse.finishTime,
      };
    });

    this.scene.events.emit('raceFinished', results);
  }

  // ナイトメア・ハザード用: 💩を設置
  placePoopBehind(horse: Horse): void {
    const poopX = horse.positionX - 50;
    if (poopX < this.courseData.startX) return;

    const newPoop: PlacedGimmick = {
      id: `dynamic-poop-${Date.now()}-${Math.random()}`,
      type: 'poop',
      x: poopX,
      lane: horse.currentLane,
      active: true,
    };

    this.courseData.gimmicks.push(newPoop);

    // シーンにギミックを追加
    (this.scene as any).addDynamicGimmick?.(newPoop);

    this.scene.events.emit('commentary',
      `${horse.horseData.name}が後方に💩を設置！`
    );
  }
}
