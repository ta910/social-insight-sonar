@AGENTS.md

# Project Rules

- モデルは `claude-sonnet-4-6` を使う
- max_tokens は 2048 以下に抑える
- 修正後は必ず `npm run build` で確認する
- エラーが出たら自分でビルドログを確認して修正する
- 完了後は `git add && git commit -m "説明" && git push && vercel --prod --force` まで実行する
