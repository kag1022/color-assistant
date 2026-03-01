# Progress / Roadmap

最終更新: 2026-03-01

## 現在地サマリ
- 初期環境構築フェーズは **実装完了**。
- モノレポ（`frontend` / `backend` / `packages/api-client` / `infra`）で起動・開発・検証が可能。
- 主要コマンドは通過済み:
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm test`
  - `pnpm migrate`（`20260301_0001` 適用確認済み）

## 進捗（機能別）
### 1) 基盤構築（完了: 100%）
- `pnpm workspace` 構成
- ルートスクリプト整備（`dev`, `migrate`, `generate:client`, `lint`, `test`）
- Docker Compose（PostgreSQL 16）
- Alembic + 初期マイグレーション
- DB待機スクリプト（`backend/scripts/wait_for_db.py`）

### 2) Backend API（完了: 100% / 初期版）
- FastAPIエントリ + CORS（dev=`*`, prod=allowlist想定）
- JWT認証API: `POST /api/v1/auth/login`
- ヘルスチェック: `GET /api/v1/health/live`, `GET /api/v1/health/ready`
- 色分析API: `POST /api/v1/color/analyze`（multipart + Bearer）
- OpenAPI出力スクリプト
- テスト（auth/health/color）7件

### 3) Frontend（完了: 90% / 初期版）
- Expo Router構成
- 画面: `capture`, `result`, `settings`
- カメラ撮影、色判定API呼び出し、音声読み上げ
- `generated` 優先 + `manual` fallback のmultipart送信
- 環境変数で接続先とアップロードモード切替
- 既知の残件:
  - 画面UIのアクセシビリティ最適化（実運用向けの文言・視認性）
  - エラーハンドリングのUX改善（ネットワーク断/再試行導線）

### 4) API契約・クライアント生成（完了: 100%）
- `backend/openapi.json` 生成
- `@hey-api/openapi-ts` による `packages/api-client/src/generated` 生成
- CIで契約差分検知（drift check）

### 5) CI（完了: 95%）
- GitHub Actions: frontend / backend / contract jobs
- lint/typecheck/test/contract drift を自動チェック
- 残件:
  - PRテンプレート + 必須チェック運用ルール
  - キャッシュ最適化、実行時間短縮

## ロードマップ（次の実装順）
### Phase 1: PoC品質の実利用検証（次スプリント）
目標:
- 現場テストで「撮影→判定→読み上げ」の操作成立率を安定化。

タスク:
- [ ] 低照度/逆光時の再撮影ガイド改善
- [ ] 色分類12種の閾値チューニング
- [ ] フロントのエラー文言・再試行導線改善
- [ ] 施設向け設定（音声速度・読み上げON/OFF）の永続化

完了条件:
- 実機テストで主要シナリオ成功率 95% 以上

### Phase 2: SaaS最小運用（MVP）
目標:
- 1施設での継続利用に耐える管理機能を追加。

タスク:
- [ ] ユーザー管理（作成/無効化/パスワード更新）
- [ ] 施設・作業者単位の分析ログ検索API
- [ ] 監査ログとエラー集計ダッシュボード（最小版）
- [ ] バックアップ/リストア手順整備

完了条件:
- 単一施設の運用で、日次利用と障害時復旧手順が回る

### Phase 3: 本番運用準備
目標:
- セキュアかつ監視可能な本番リリース体制を構築。

タスク:
- [ ] 本番環境IaC（VPC, DB, App, Secret管理）
- [ ] CORS/セキュリティヘッダ/レート制限の本番設定
- [ ] Sentry等の監視とアラート設計
- [ ] 負荷試験・性能基準（API応答、画像処理時間）

完了条件:
- 本番移行チェックリストを満たし、段階リリース可能

## 既知リスク
- 色判定ロジックは初期アルゴリズム（厳密なMLモデルではない）
- ネットワーク条件が悪い現場ではアップロード失敗率が上がる
- 端末差分（Android/iOS/実機）でカメラ挙動に差異が出る可能性

## メモ
- 接続先の既定値:
  - Android Emulator: `http://10.0.2.2:8000`
  - iOS Simulator: `http://127.0.0.1:8000`
  - 実機: `http://<PCのLAN IP>:8000`
