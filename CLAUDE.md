# Fillr — 詳細設計書

> **キャッチフレーズ**: 必要なサイズのファイルを、必要なだけ — クライアントサイド完結のダミーファイル生成サービス

---

## 1. 概要

Fillrは、ブラウザだけで動作し、ユーザーが指定した**バイト数ぴったり**のダミーファイルを即座に生成してダウンロードできるサービスです。サーバーを介さないため低コストでスケーラブル。開発者やテスターがファイルサイズ条件のある動作検証やパフォーマンステストを行うためのツールを目指します。

---

## 2. 目標要件

### 機能要件（必須）

* ユーザーがファイルサイズをバイト単位で指定（入力：数値 + 単位B/KB/MB/GB/KiB/MiB/GiB）
* 拡張子／フォーマット選択（.txt, .bin/.dat）
* クライアントサイドでファイル生成し即ダウンロード
* 指定バイト数と**完全一致**するファイルを生成
* ランダムデータ／ゼロ埋めなど生成オプション

### 機能要件（拡張）

* 画像（PNG/JPEG）、PDF、動画（MP4/WebM）などフォーマット対応（生成後サイズ調整で「ぴったり」に近づける）
* 生成中プログレス表示、キャンセル機能
* プレビュー（テキスト・画像）

### 非機能要件

* メモリ使用量は可能な限り小さく（大きなファイルはチャンク生成）
* セキュリティ：生成データはクライアント限定、サーバ保存しない
* 対応ブラウザ：最新のChromium系、Firefox、Safari（Feature Detectionあり）
* アクセシビリティ準拠（キーボード操作、スクリーンリーダー）

---

## 3. ユーザーフロー

1. ユーザーがトップページでファイルサイズ（例: 512 MB）とフォーマット（例: .bin）を選択
2. 生成オプションを選択（ランダム/ゼロ/特定バイト）
3. "Generate" ボタン押下 → 生成開始、進捗表示
4. 生成完了後、自動的にダウンロードが開始 or ダウンロードリンクを表示
5. ユーザーが保存

---

## 4. アーキテクチャ（フロントエンドのみ）

* シングルページアプリケーション（プレーンJSまたは軽量フレームワーク）
* 主要モジュール

  * UI 層（フォーム、プログレス、設定）
  * 生成コア（バイト生成ロジック、フォーマット別調整）
  * ダウンロードハンドラ（Blob生成、object URL 管理）
  * ストレージ（ブラウザ内一時保管は行わない）

---

## 5. 重要設計 — 指定バイト数を“ぴったり”にする手法

### 5.1 基本原則

* ブラウザで作るファイルは`Blob`/`File`を介してダウンロードする。
* バイト列は`Uint8Array(n)`で正確な長さを持つ配列を生成してから`new Blob([uint8arr], { type })`に渡すと、そのバイト長がファイルサイズになる。
* ただし**フォーマットが持つヘッダや圧縮、メタ情報**を含む場合は、生成バイト列にヘッダ分を考慮して調整する必要がある。

### 5.2 純バイナリ / テキスト（最も簡単）

* 要求サイズが `N` バイトなら、`Uint8Array(N)` を用意し、内容を埋める。例:

  * ゼロ埋め: `arr.fill(0)`
  * ランダム: `crypto.getRandomValues(arr)`
  * ASCII テキスト: generate bytes within printable range (0x20–0x7E)
* `Blob` に渡すと**正確に N バイト**のファイルが得られる。

#### サンプル関数（JS）

```js
function generateRawBytes(size, mode = 'random') {
  const arr = new Uint8Array(size);
  if (mode === 'zero') {
    // デフォルトで 0
  } else if (mode === 'random') {
    crypto.getRandomValues(arr);
  } else if (mode === 'ascii') {
    for (let i = 0; i < size; i++) arr[i] = 0x20 + Math.floor(Math.random() * (0x7E - 0x20 + 1));
  }
  return new Blob([arr]);
}
```

### 5.3 フォーマット付きファイル（PNG, PDF, MP4 等）

フォーマット付きファイルはヘッダやチャンクが存在し、単純にバイト列を詰めてもフォーマットとして破綻する可能性がある。

**基本戦略**

1. まず“有効な最小構成”でファイルを生成（例: 単一色の PNG を canvas → toBlob で生成）
2. 生成されたバイナリのサイズ `S0` を取得
3. 目標サイズ `N` と比較し、`N - S0 = D` を計算
4. D ≥ 0 の場合：フォーマットに応じた無害な領域（非表示なコメント、カスタムチャンク、nullバイトの埋め込み）を追加して調整

   * PNG: `tEXt` または `zTXt` / カスタム `iTXt` チャンクを挿入（ただしチャンク整合性（CRC）を再計算）
   * PDF: ファイル末尾に `%` で始まるコメント行を追加（PDFリーダはコメントを無視）。直接バイト追加可能。
   * JPEG: APPn マーカーに任意データを挿入
   * MP4/WebM: コンテナに非再生データを付加（トラック追加や無害なメタデータ） — ブラウザ側で安全に実行するのは難易度が高い
5. D < 0 の場合：元の生成方法の品質や圧縮を下げる（例: PNG の圧縮率を低くする、canvas サイズを増やす）か、より大きな有効コンテンツを生成して増やす。

> 注意: ブラウザだけでチャンクの CRC を計算・挿入することでPNG等の調整は可能だが、実装はやや複雑。

### 5.4 実用的な妥協案（推奨）

* **バイナリ/テキスト**は厳密一致を保証。
* **画像/PDF**は「フォーマット互換性を維持しつつ、指定サイズ±数バイト」もしくはコメントチャンクで**完全一致**を狙う。まずはPDFとPNGの調整機能を優先実装。
* **動画**はブラウザで作る場合、完全一致は困難。目標に近づける（±数KB〜数10KB）を図る。

---

## 6. 実装詳細（技術仕様）

### 6.1 UI コンポーネント

* サイズ入力（数値 + 単位セレクト）
* 拡張子選択（ドロップダウン）
* オプション

  * 填充方式: `zero` / `random` / `ascii` / `pattern`
  * ファイル名
  * 生成チャンクサイズ（大ファイル用、デフォルト 4MB）
* 進捗バー + ログ（生成速度, 推定残り時間）
* ダウンロードボタン / 自動ダウンロードトグル

### 6.2 コア API（内部関数）

* `parseSizeInput(strOrNum)` -> returns bytes
* `generateBlobByFormat(format, size, options)` -> returns Promise<Blob>

  * internally calls `generateRawBytes` or `generatePNG/PDF/...`調整ロジック
* `streamedUint8ToBlob(streamIterator)` -> Blob (using intermediate chunks)
* `downloadBlob(blob, filename)`

### 6.3 チャンク生成（大容量対応）

* メモリ枯渇を避けるため、`Uint8Array(chunkSize)` を繰り返し生成して `new Blob(chunks)` に渡す。Blobはブラウザ側で効率的に扱われる。
* 例: 1GB 生成時、chunkSize = 4MB => 256 回ループ

### 6.4 PNG へのパディング（設計案）

* 手順

  1. canvas サイズ 1x1（単色）で toBlob('image/png') して基礎 PNG を得る
  2. そのバイト列をパースして PNG チャンク境界（IHDR, IDAT, IEND）を特定
  3. `tEXt` カスタムチャンク（有効な CRC を持つ）を IEND の前に挿入してバイト数を増やす
  4. 最終バイナリを Blob にして返す
* 実装の難易度: 中〜高（PNG 仕様の理解と CRC 計算が必要）

### 6.5 PDF へのパディング（実装が簡単）

* 手順

  1. 最小構成の PDF を生成（たとえば `jsPDF` を使うか、自前の簡易 PDF テンプレート）
  2. 生成されたバイナリの末尾に `\n%` で始まるコメント行を繰り返し追加して目標サイズにする
  3. Blob を返す
* 実装の難易度: 低〜中

---

## 7. サンプル実装（擬似コード）

### 7.1 サイズパース

```js
function parseSizeInput(value, unit) {
  const n = Number(value);
  const mul = { B:1, KB:1024, MB:1024**2, GB:1024**3 }[unit];
  return Math.max(0, Math.floor(n * mul));
}
```

### 7.2 チャンク生成とダウンロード

```js
async function generateAndDownload(format, sizeBytes, options) {
  const blob = await generateBlobByFormat(format, sizeBytes, options);
  const name = options.filename || `ghost.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a);
  a.click(); a.remove(); URL.revokeObjectURL(url);
}
```

### 7.3 大容量向けチャンク生成（raw binary）

```js
function generateRawBlobByChunks(size, chunkSize = 4*1024*1024, mode='random'){
  const chunks = [];
  let remaining = size;
  while (remaining > 0) {
    const cur = Math.min(remaining, chunkSize);
    const arr = new Uint8Array(cur);
    if (mode === 'random') crypto.getRandomValues(arr);
    chunks.push(arr);
    remaining -= cur;
  }
  return new Blob(chunks);
}
```

---

## 8. テスト計画

* **ユニットテスト**

  * `parseSizeInput` の境界値（0, 1B, 1KBなど）
  * `generateRawBytes` が常に指定長を返す
  * チャンク生成が合計サイズを正しく満たす
* **統合テスト**

  * 小〜中〜大ファイル（例: 1KB, 1MB, 500MB）の生成とダウンロードを手動/自動で検証
  * PNG/PDF の互換性検証（生成ファイルが主要ビューワで開くか）
* **負荷テスト**

  * 連続生成（複数タブ）でブラウザ安定性を確認

---

## 9. パフォーマンスと制約

* ブラウザのメモリ上限に注意。推奨最大生成サイズはブラウザ依存（テストで決める）。
* 1GB 以上を狙う場合はユーザーへ警告し、チャンク生成推奨。
* モバイル端末はメモリやCPUが厳しいため上限を低めに設定。

---

## 10. セキュリティ／プライバシー

* 生成データは**クライアントのみ**で処理、サーバーへ送信しない。

---

## 11. アクセシビリティ

* フォームはラベルと`aria-*`を適切に付与
* キーボードでサイズ入力・生成・ダウンロードが可能
* ステータスメッセージをスクリーンリーダー向けにアナウンス

---

## 12. UI/UX 提案（ワイヤー）

* シンプルな1カラムフォーム

  * 上部: サービス名ロゴ（Fillr）とキャッチフレーズ
  * メインフォーム: サイズ入力（大きな数値フィールド）→ 単位セレクト → フォーマット選択
  * オプション折りたたみ（高度設定）
  * 生成ボタン（大）→ 生成中は進捗とキャンセル
  * 生成完了でダウンロード

---

## 13. 開発・リリースロードマップ（短期）

1. M1: コア機能 — テキスト/.bin の正確生成、UI 基本実装
2. M2: 大容量チャンク生成、進捗表示、キャンセル
3. M3: PNG と PDF の調整アルゴリズム（コメント/チャンク挿入）
4. M4: テスト、ドキュメント、ブラウザ互換性チェック
5. M5: UI 改良、OSS公開 or SaaS化

---

## 14. 将来の拡張案

* サーバーサイドオプション（ファイルを一時保管・共有）
* 生成テンプレート（特定のメタデータを含んだダミーファイル）
* コマンドラインツール（npm パッケージ）

---

## 15. 参考実装のヒントと注意点

* ブラウザのBlob実装は効率的だが、メモリ使用の観測と回収（`URL.revokeObjectURL`）を忘れない
* `crypto.getRandomValues` は `Uint8Array` でしか受け取れない
* PNG チャンク編集はバイナリ編集の知識が必要。まずは PDF → PNG の順で実装するのが得策

---

### 付録: もっと踏み込んだ「PNG に tEXt を挿入してサイズを増やす」アルゴリズム（概要）

1. basePNG = canvas.toBlob('image/png') → ArrayBuffer
2. parse basePNG のチャンク列（シグネチャ後に 4byte length, 4byte type, data, 4byte CRC が続く）
3. 作成したい `tEXt` チャンクを作る（keyword\0text）
4. CRC を `crc32` ライブラリで計算して 4byte を付与
5. `IEND` の前に挿入し、新ArrayBufferを組み立てる
6. Blob を返す

---

以上です。

（ドキュメントの追加・修正、単体のコード実装（例: React コンポーネントでのプロトタイプ）など、次の作業に進めます。どれを先に実装しましょうか？）
