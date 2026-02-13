# PowerShellスクリプト: 開発サーバーを起動（バッチジョブ確認メッセージを抑制）
# 注意: バッチジョブの確認メッセージはCMDの動作のため、完全に抑制するのは困難です
# このスクリプトは、可能な限りメッセージを抑制するための設定を行います

# バッチジョブの確認を自動的にYで応答するための設定
$ConfirmPreference = 'None'
$ErrorActionPreference = 'Continue'

# 環境変数を設定して、可能な限りメッセージを抑制
$env:CI = 'true'
$env:FORCE_COLOR = '0'

# pnpm run devを実行（直接実行することでバッチファイルのラッパーを回避）
try {
    # pnpmの実行ファイルを直接呼び出す
    $pnpmPath = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($pnpmPath) {
        & $pnpmPath.Path run dev
    } else {
        # pnpmが見つからない場合は、通常の方法で実行
        pnpm run dev
    }
} catch {
    Write-Host "エラーが発生しました: $_" -ForegroundColor Red
    exit 1
}
