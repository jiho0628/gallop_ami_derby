import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COMMENTARY_CONFIG } from '../config/GameConfig';
import type { CommentaryMessage } from '../types';

export class CommentarySystem {
  private scene: Phaser.Scene;
  private messages: CommentaryMessage[] = [];
  private container: Phaser.GameObjects.Container;
  private textObjects: Map<string, Phaser.GameObjects.Text> = new Map();
  private backgroundRect: Phaser.GameObjects.Rectangle;
  private speechEnabled: boolean = true;
  private speechQueue: string[] = [];
  private isSpeaking: boolean = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    // コンテナを作成（固定位置）
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    // 背景
    const bgWidth = 450;
    const bgHeight = COMMENTARY_CONFIG.maxMessages * 30 + 20;
    const bgX = GAME_WIDTH - bgWidth - 20;
    const bgY = GAME_HEIGHT - bgHeight - 20;

    this.backgroundRect = scene.add.rectangle(
      bgX + bgWidth / 2,
      bgY + bgHeight / 2,
      bgWidth,
      bgHeight,
      0x000000,
      0.7
    );
    this.backgroundRect.setStrokeStyle(2, 0x444444);
    this.container.add(this.backgroundRect);

    // タイトル
    const title = scene.add.text(bgX + 10, bgY + 5, '📢 実況', {
      fontSize: '16px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    this.container.add(title);
  }

  addMessage(text: string, type: CommentaryMessage['type'] = 'info'): void {
    const message: CommentaryMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      text,
      timestamp: this.scene.time.now,
      type,
    };

    this.messages.push(message);

    // 重要なメッセージのみ音声読み上げ
    if (this.speechEnabled && this.isImportantMessage(text, type)) {
      // ゴール結果は優先的に読み上げ
      const isPriority = text.includes('着') || text.includes('ゴール') || type === 'finish';
      this.speak(text, isPriority);
    }

    // 最大数を超えたら古いものを削除
    while (this.messages.length > COMMENTARY_CONFIG.maxMessages) {
      const removed = this.messages.shift();
      if (removed) {
        const textObj = this.textObjects.get(removed.id);
        if (textObj) {
          textObj.destroy();
          this.textObjects.delete(removed.id);
        }
      }
    }

    this.updateDisplay();
  }

  private isImportantMessage(text: string, type: CommentaryMessage['type']): boolean {
    // ゴール・順位確定は重要
    if (type === 'finish') return true;

    // 能力発動は重要
    if (type === 'ability') return true;

    // ギミック関連も読み上げ
    if (type === 'gimmick') return true;

    // レーススタートは重要
    if (text.includes('スタート')) return true;

    // ゴール関連は重要
    if (text.includes('着') || text.includes('ゴール')) return true;

    // 分岐移動
    if (text.includes('分岐')) return true;

    // ギミック接触
    if (text.includes('💩') || text.includes('🚧') || text.includes('🌀') || text.includes('💧') || text.includes('🌱')) return true;

    // その他は読み上げない
    return false;
  }

  private speak(text: string, priority: boolean = false): void {
    // 絵文字を除去してクリーンなテキストにする
    const cleanText = text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

    if (!cleanText) return;

    if (priority) {
      // 優先メッセージ: 現在の音声をキャンセルしてキューの先頭に追加
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      this.speechQueue.unshift(cleanText);
      this.isSpeaking = false;
      this.speakNext();
    } else {
      // 通常メッセージ: キューに追加
      this.speechQueue.push(cleanText);

      // 話していなければ次を話す
      if (!this.isSpeaking) {
        this.speakNext();
      }
    }
  }

  private speakNext(): void {
    if (this.speechQueue.length === 0) {
      this.isSpeaking = false;
      return;
    }

    const text = this.speechQueue.shift();
    if (!text) return;

    this.isSpeaking = true;

    // Web Speech API を使用
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 1.3; // 少し速めに
      utterance.pitch = 1.1; // 少し高めに（実況風）
      utterance.volume = 1.0; // 最大音量

      utterance.onend = () => {
        this.speakNext();
      };

      utterance.onerror = () => {
        this.speakNext();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      this.isSpeaking = false;
    }
  }

  stopSpeech(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.speechQueue = [];
    this.isSpeaking = false;
  }

  setSpeechEnabled(enabled: boolean): void {
    this.speechEnabled = enabled;
    if (!enabled) {
      this.stopSpeech();
    }
  }

  update(delta: number): void {
    const now = this.scene.time.now;

    // フェード処理
    this.messages.forEach(msg => {
      const age = now - msg.timestamp;
      const textObj = this.textObjects.get(msg.id);

      if (textObj && age > COMMENTARY_CONFIG.fadeTime - 1000) {
        const fadeProgress = (age - (COMMENTARY_CONFIG.fadeTime - 1000)) / 1000;
        textObj.setAlpha(Math.max(0, 1 - fadeProgress));
      }
    });

    // 古いメッセージを削除
    const expiredMessages = this.messages.filter(
      msg => now - msg.timestamp > COMMENTARY_CONFIG.fadeTime
    );

    expiredMessages.forEach(msg => {
      const textObj = this.textObjects.get(msg.id);
      if (textObj) {
        textObj.destroy();
        this.textObjects.delete(msg.id);
      }
    });

    this.messages = this.messages.filter(
      msg => now - msg.timestamp <= COMMENTARY_CONFIG.fadeTime
    );

    if (expiredMessages.length > 0) {
      this.updateDisplay();
    }
  }

  private updateDisplay(): void {
    const bgWidth = 450;
    const bgHeight = COMMENTARY_CONFIG.maxMessages * 30 + 20;
    const bgX = GAME_WIDTH - bgWidth - 20;
    const bgY = GAME_HEIGHT - bgHeight - 20;

    // 既存のテキストを再配置
    this.messages.forEach((msg, index) => {
      let textObj = this.textObjects.get(msg.id);

      if (!textObj) {
        // 新規作成
        const color = this.getColorForType(msg.type);
        textObj = this.scene.add.text(bgX + 10, 0, msg.text, {
          fontSize: `${COMMENTARY_CONFIG.fontSize}px`,
          color,
          wordWrap: { width: bgWidth - 20 },
        });
        textObj.setScrollFactor(0);
        textObj.setDepth(101);
        this.textObjects.set(msg.id, textObj);
        this.container.add(textObj);
      }

      // Y位置を更新（下から上に並べる）
      const y = bgY + bgHeight - 15 - (this.messages.length - index) * 28;
      textObj.setY(y);
    });
  }

  private getColorForType(type: CommentaryMessage['type']): string {
    switch (type) {
      case 'gimmick':
        return '#FF6B6B';
      case 'ability':
        return '#4ECDC4';
      case 'finish':
        return '#FFD700';
      default:
        return '#ffffff';
    }
  }

  clear(): void {
    this.textObjects.forEach(textObj => textObj.destroy());
    this.textObjects.clear();
    this.messages = [];
    this.stopSpeech();
  }
}
