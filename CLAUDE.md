# Fillr — 詳細設計書

> **キャッチフレーズ**: 必要なサイズのファイルを、安全・瞬時・無制限に — ブラウザ完結だから、プライベート・高速・いつでも利用可能

---

## 1. 概要

Fillrは、ブラウザだけで動作し、ユーザーが指定した**バイト数ぴったり**のダミーファイルを即座に生成してダウンロードできるサービスです。サーバーを介さないため低コストでスケーラブル。開発者やテスターがファイルサイズ条件のある動作検証やパフォーマンステストを行うためのツールを目指します。

### 現在の実装状況
- **言語**: TypeScript完全移行済み
- **フレームワーク**: React 18 + Vite
- **UI**: Tailwind CSS
- **国際化**: react-i18next（日本語/英語対応）
- **状態**: 本番稼働中

---

## 2. 実装済み機能

### 必須機能 ✅
- ユーザーがファイルサイズをバイト単位で指定（入力：数値 + 単位B/KB/MB/GB/KiB/MiB/GiB）
- 拡張子／フォーマット選択（TXT, CSV, PNG, PDF, MP3, MP4）
- クライアントサイドでファイル生成し即ダウンロード
- 指定バイト数と**完全一致**するファイルを生成
- 各フォーマット専用の生成アルゴリズム

### 拡張機能 ✅
- 動的アルゴリズム表示（選択したフォーマットに応じて生成方法を説明）
- 生成中プログレス表示、キャンセル機能
- リアルタイムバリデーション（フォーム風インラインエラー）
- 多言語対応（日本語/英語）
- レスポンシブデザイン

### 非機能要件 ✅
- メモリ効率的なチャンク生成（大ファイル対応）
- セキュリティ：生成データはクライアント限定、サーバ保存なし
- 対応ブラウザ：最新のChromium系、Firefox、Safari
- アクセシビリティ準拠（キーボード操作、スクリーンリーダー）

---

## 3. ユーザーフロー（実装済み）

1. ユーザーがトップページでファイルサイズと形式を選択
2. **動的アルゴリズム表示**：選択した形式に応じて生成方法が表示
3. **リアルタイムバリデーション**：入力値エラーが即座に表示
4. "ファイル生成" ボタン押下 → 生成開始、進捗表示
5. 生成完了後、自動ダウンロード開始
6. **エラーハンドリング**：問題発生時はインラインメッセージで通知

---

## 4. 現在のアーキテクチャ

### 技術スタック
```
Frontend: React 18 + TypeScript
Build: Vite
Styling: Tailwind CSS
i18n: react-i18next
Icons: Lucide React
```

### ディレクトリ構造
```
src/
├── components/           # UIコンポーネント
│   ├── ErrorBoundary.tsx
│   ├── FormatSelector.tsx
│   ├── InlineMessage.tsx
│   ├── LanguageSelector.tsx
│   ├── ProgressBar.tsx
│   └── SizeInput.tsx
├── utils/               # ユーティリティ
│   ├── generators/      # ファイル生成器
│   │   ├── csvGenerator.ts
│   │   ├── mp3Generator.ts
│   │   ├── mp4Generator.ts
│   │   ├── pdfGenerator.ts
│   │   └── pngGenerator.ts
│   ├── downloadHandler.ts
│   ├── fileGenerator.ts
│   └── sizeParser.ts
├── i18n/               # 国際化
│   └── locales/
│       ├── en.json
│       └── ja.json
└── App.tsx             # メインアプリケーション
```

### 主要モジュール
- **UI層**: React コンポーネント（フォーム、プログレス、エラー表示）
- **生成コア**: フォーマット別生成ロジック（utils/generators/）
- **バリデーション**: リアルタイム入力検証
- **ダウンロードハンドラ**: Blob生成、object URL管理
- **エラーハンドリング**: ErrorBoundary + InlineMessage
- **国際化**: i18next による多言語対応

---

## 5. ファイル生成アルゴリズム実装詳細

### 5.1 TXT ファイル（ランダムテキスト生成）
```typescript
// 実装方式：ランダム印刷可能文字
function generateTXT(size: number): Blob {
  const chars = [];
  for (let i = 0; i < size; i++) {
    // 0x20-0x7E範囲の印刷可能ASCII文字
    chars.push(String.fromCharCode(0x20 + Math.floor(Math.random() * (0x7E - 0x20 + 1))));
  }
  return new Blob([chars.join('')], { type: 'text/plain' });
}
```

### 5.2 CSV ファイル（構造化ダミーデータ）
```typescript
// ヘッダー
const header = 'ID,Name,Email,Phone,Address,City,Country\n';

// データ行パターン
const row = `${id},User${id.padStart(4, '0')},user${id}@example.com,555-${phone},${id} Main Street,City${id%100},${country}\n`;

// サイズぴったりになるまで行を追加、最後は部分行で調整
```

### 5.3 PNG ファイル（コメントチャンク調整）
```typescript
// 基本戦略
1. Canvas で 1x1 透明PNG生成
2. PNG チャンク構造を解析
3. tEXt コメントチャンクを追加してサイズ調整
4. CRC計算で整合性維持
```

### 5.4 PDF ファイル（コメント行パディング）
```typescript
// PDF構造
1. 最小限のPDF文書作成
2. ファイル末尾に % コメント行追加
3. 正確なバイト数まで調整
```

### 5.5 MP3/MP4（メタデータ調整）
- **MP3**: 無音WAVをMP3エンコード、ID3タグで調整
- **MP4**: 1x1黒画面動画、メタデータボックスで調整

---

## 6. UI/UX設計実装

### 6.1 動的アルゴリズム表示
```typescript
// フォーマット選択に応じて説明が変わる
<p className="text-sm text-gray-600">
  {t(`formats.${format}.algorithm`)}
</p>
```

### 6.2 リアルタイムバリデーション
```typescript
const getValidationError = useCallback(() => {
  if (!sizeValue || sizeValue.trim() === '') return '';
  if (isNaN(parseFloat(sizeValue))) return '無効なサイズです';
  if (parseFloat(sizeValue) <= 0) return 'サイズは0より大きい値を入力してください';
  if (totalBytes === 0 && parseFloat(sizeValue) > 0) return 'ファイルサイズが大きすぎます';
  return '';
}, [sizeValue, totalBytes]);
```

### 6.3 インラインエラー表示
- フォームバリデーション風デザイン
- エラータイプ別カラーリング（赤：エラー、オレンジ：警告、緑：成功）
- アイコン付きでわかりやすい表示

### 6.4 ヘッダー機能
- **GitHubアイコン**: リポジトリへの直接アクセス
- **言語選択**: 国旗なしのシンプルデザイン

---

## 7. エラーハンドリング戦略

### 7.1 段階的エラー処理
1. **入力バリデーション**: リアルタイムチェック
2. **生成前バリデーション**: 厳密チェック
3. **生成中エラー**: try-catch でキャッチ

### 7.2 エラー表示方式
```typescript
// 削除された機能：大容量警告
// 現在：10GiB制限でハードストップ

// エラーメッセージ簡素化
showInlineError(`生成エラー: ${error.message}`);
```

---

## 8. パフォーマンス最適化

### 8.1 メモリ効率化
- チャンク生成（デフォルト4MB）
- Blob URLの適切な開放
- 大容量ファイル対応

### 8.2 レンダリング最適化
- useCallback による関数メモ化
- 必要最小限の状態更新
- エラー発生時の安全な状態復帰

### 8.3 バンドルサイズ最適化
- Vite による最適化
- Tree Shaking
- 必要な依存関係のみ

---

## 9. 国際化実装

### 9.1 サポート言語
- 日本語（デフォルト）
- 英語

### 9.2 実装方式
```typescript
// react-i18next
const { t } = useTranslation();

// 動的翻訳
{t(`formats.${format}.algorithm`)}
```

### 9.3 自動言語検出
ブラウザの言語設定から自動判定、手動切り替え可能

---

## 10. テスト戦略

### 10.1 現在の状況
- 手動テスト中心
- ブラウザ互換性テスト実施済み
- 大容量ファイル生成テスト済み

### 10.2 今後の改善予定
- ユニットテスト追加
- E2Eテスト導入
- パフォーマンステスト自動化

---

## 11. デプロイ・運用

### 11.1 ビルド設定
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx,ts,tsx --report-unused-disable-directives --max-warnings 0",
    "type-check": "tsc --noEmit",
    "preview": "vite preview"
  }
}
```

### 11.2 デプロイ環境
- **本番**: Netlify（filler.netlify.app）
- **ビルドコマンド**: `npm run build`
- **公開ディレクトリ**: `dist`

---

## 12. セキュリティ対策

### 12.1 クライアントサイド限定
- サーバーへのデータ送信なし
- ローカル処理のみ
- プライバシー保護

### 12.2 入力サニタイゼーション
- 数値入力の厳密検証
- XSS対策（React標準）
- CSP設定済み

---

## 13. 今後の改善予定

### 13.1 機能拡張
- [ ] JPEG, GIF画像対応
- [ ] ZIP, RAR圧縮ファイル対応
- [ ] カスタムテンプレート機能
- [ ] バッチ生成機能

### 13.2 技術改善
- [ ] WebWorker による並列処理
- [ ] Service Worker によるオフライン対応
- [ ] Progressive Web App化
- [ ] テストカバレッジ向上

### 13.3 UI/UX改善
- [ ] ダークモード対応
- [ ] ドラッグ&ドロップUI
- [ ] 生成履歴機能
- [ ] プリセット機能

---

## 14. 制限事項

### 14.1 技術的制限
- **最大ファイルサイズ**: 10 GiB（ブラウザメモリ依存）
- **対応フォーマット**: 6種類（TXT, CSV, PNG, PDF, MP3, MP4）
- **ブラウザ依存**: モダンブラウザのみ

### 14.2 パフォーマンス制限
- 大容量ファイル生成時のメモリ使用量
- モバイル端末での制限
- ブラウザクラッシュリスク（極大ファイル）

---

## 15. 開発ワークフロー

### 15.1 開発環境
```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# ESLint
npm run lint

# 本番ビルド
npm run build
```

### 15.2 コード品質
- TypeScript による型安全性
- ESLint による静的解析
- Prettier による整形（設定済み）
- Git hooks による品質チェック

---

## 16. 参考実装のポイント

### 16.1 Blob API活用
```typescript
// 正確なサイズ制御
const blob = new Blob([uint8Array], { type: 'application/octet-stream' });
console.log(blob.size); // 指定バイト数と一致
```

### 16.2 チャンク生成パターン
```typescript
// 大容量対応
function generateByChunks(size: number, chunkSize = 4 * 1024 * 1024) {
  const chunks = [];
  let remaining = size;
  while (remaining > 0) {
    const currentChunk = Math.min(remaining, chunkSize);
    chunks.push(new Uint8Array(currentChunk));
    remaining -= currentChunk;
  }
  return new Blob(chunks);
}
```

---

以上が現在のFillrの詳細実装状況です。TypeScript完全移行と主要機能実装が完了し、安定運用段階にあります。

---

## 17. Claude Code による開発・保守指針

### 17.1 コード品質管理
- **不要機能の処理**: 実装してしまった不要な機能は、完全にrollbackして綺麗に削除する
- **一貫性の維持**: UIデザイン、コーディングスタイルは既存ファイルを参照してズレを最小限に抑える
- **段階的実装**: 大きな変更は小さく分割し、各段階で動作確認を行う

### 17.2 設計一貫性
```typescript
// 既存パターンに従う例
// ✅ Good: 既存のuseCallbackパターンに従う
const handleSizeValueChange = useCallback((value: string) => {
  if (/^\d*$/.test(value)) {
    setSizeValue(value);
    setInlineMessage(null);
  }
}, []);

// ❌ Bad: 一貫性のない新パターン
const handleChange = (value) => { /* 新しい処理方式 */ };
```
- generatorに関してはminfilesizeを極力下げるようなアルゴリズムを生成すること

### 17.3 UI/UXデザイン指針
- **既存コンポーネントの踏襲**: InlineMessage、SizeInput等の既存デザインパターンを維持
- **Tailwind CSS**: 既存のクラス構成とカラーパレットに従う
- **レスポンシブ対応**: 既存の`max-w-2xl mx-auto`等のレイアウトパターンを継承
- useEffectは極力使わない、使う理由は明記すること

### 17.4 ドキュメント更新義務
大きな変化があった場合の即座更新対象：
1. **CLAUDE.md**: 設計仕様・アーキテクチャ変更
2. **README.md / README.ja.md**: 機能追加・削除、使用方法変更
3. **CONTRIBUTING.md / CONTRIBUTING.ja.md**: 開発環境・プロセス変更
4. **i18n files**: UI文言・メッセージ変更

### 17.5 変更管理プロセス
```bash
# 変更前: 現在の動作確認
npm run dev
npm run type-check
npm run lint

# 実装: 既存パターンを参照しながら実装
# 参考ファイル: 同じ種類のコンポーネントや機能

# 変更後: 動作確認・ドキュメント更新
# 1. 機能テスト
# 2. 型チェック・リンティング 
# 3. 該当ドキュメントの更新
# 4. 不要なコード・機能があれば完全削除
```

### 17.6 rollback指針
不要機能を作成してしまった場合：
1. **完全削除**: 関連するすべてのファイル、import、型定義を削除
2. **依存関係クリーンアップ**: package.jsonの不要な依存関係も削除
3. **コミット整理**: 必要に応じてコミット履歴を整理
4. **ドキュメント同期**: 削除した機能に関する記述をドキュメントからも削除

### 17.7 既存ファイル参照による一貫性確保
新しい実装を行う際の参照優先順位：
1. **同種の既存コンポーネント**: 同じ目的のコンポーネントのパターンを踏襲
2. **App.tsx**: 状態管理・イベントハンドリングのパターン
3. **utils/**: ユーティリティ関数の命名・構造規則
4. **i18n**: 多言語対応の実装パターン
5. **既存のTailwind CSS**: 使用されているクラス・スタイリングパターン

---

（今後の機能追加や改善についてのご相談、コントリビューションを歓迎します！）
