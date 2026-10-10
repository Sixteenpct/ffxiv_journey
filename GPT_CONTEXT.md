# 工程開機入口
狀態：CURRENT / WEB SOURCE AUTHORITY
本 repo 是 FF14 Journey 全系列公開網頁原始碼與 Pages 的唯一主庫。先讀 README.md → DEVELOPMENT.md，再按任務讀相關分館程式，不掃全部資料。
嚴禁將 Collection／PvE／Lore 私人資料整包複製到此公開 repo；資料主來源保留原處。工坊既有私人測試的取檔規則見 DEVELOPMENT.md。
所有後續網頁修改直接在此 repo 完成；不要復活 ffxiv_collection/docs/ 或維護 ffxiv_workbench 第二份功能程式。
三館及同層入口等權陳列；自然繁體中文；既有個人存檔與正式課號保留。變更遵循本人授權及 dev_garden 全域工作／Git 規則。

## 全站瀏覽器分頁小圖示（favicon）｜硬規則
- LiouLiou 所稱「瀏覽器縮圖」指瀏覽器分頁、書籤可辨識的 favicon，不可留下預設無圖示狀態。**從現在起新建的每一個公開 HTML 頁面**，都必須在 `<head>` 明確加入 `<link rel="icon" type="image/svg+xml" href="...">` 並設定正確的相對路徑；搬家、改版、移動目錄也要一併驗收。不得僅替總首頁設定。
- 依分館／主題挑選有辨識度的小圖示：主要入口可沿用分館 icon，獨立職業或內容頁優先使用主題專屬 favicon。SVG 優先使用本站 `assets/` 的自有靜態檔；既有頁面採有效 inline SVG favicon 可保留，避免不穩定的外站依賴。
- 發布之前**必跑 `node scripts/check-favicons.mjs`**（無需安裝 npm 依賴），確認所有 `*.html` 均有 icon 且本地檔案路徑存在。發布後再讀回網頁 `<head>` 與圖示 URL；不能只因 Git 提交成功就宣稱瀏覽器縮圖正常。若有漏項先修復，不帶病交付。
- 這是 Git canonical 的永久網頁施工要求；不可因模型記憶或換聊天消失。社群分享預覽 `og:image` 與分頁 favicon 是不同東西，不得混稱已完成。

## 全站頁尾一致性｜硬規則
- **所有 FF14 Journey 網站公開 HTML 頁面**的 footer 必須忠於 Journey 入口網站和素材製作工坊的正式三行小字樣式：`footer-credit`／`footer-brand`／`footer-rights`，順序不變；信用與商標聲明不能省略。底部置中、低彩度、間距精簡，不得因頁面正文、表格、卡片字級調整而被放大。
- 新館／新職業／新課程頁一律採 `<footer class="site-footer">...`，並引用 `assets/site-footer.css`（依頁深度使用正確相對路徑）；此檔以入口／工坊共同規格 11.48px（手機 10px）、第三行 10px 為 canonical。入口首頁和既有工坊已有同等樣式，保持原有 CSS，不因共享樣式而冒險重構既有功能。
- 每次增修 HTML 或 footer 必須執行 `node scripts/check-site-footers.mjs` 和現行 favicon 檢查，確認三行內容、標籤、後續頁面對共用樣式的有效引用。再讀回 Git 與 Pages 驗證，不可只說「已規定」卻沒實作。
