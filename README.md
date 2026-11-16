# 人間筆記 v2

多頁靜態站（Cloudflare Pages，沿用 repo `lalawgwg99/renjianbiji`，不換框架）。

- 內容：`~/workspace/renjianbiji-v2-tools/data/articles.json`（22 篇，繁中＋英文全文）
- 產生器：`~/workspace/renjianbiji-v2-tools/build/build.py` → 本目錄
- 驗證：`~/workspace/renjianbiji-v2-tools/build/verify.py`（須 0 failures）
- 每小時新增文章流程：`~/workspace/renjianbiji-v2-tools/docs/hourly-workflow.md`

**部署**：把本目錄內容推到 repo 根目錄（不要推 `renjianbiji-v2-tools/`）。部署前先把每小時 cron 改成新流程（見 hourly-workflow.md 開頭警告），否則舊流程會把本站蓋回單頁版。

設計：暖白底、深墨綠、古銅金點綴、襯線標題。舊 `#art-<slug>` 錨點由首頁 JS 自動轉址到新文章頁。
