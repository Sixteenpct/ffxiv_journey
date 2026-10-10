# 網頁原始碼與資料分工

## 唯一網頁主來源
Sixteenpct/ffxiv_journey 保存所有可公開的 HTML、CSS、JavaScript、SVG 及公開靜態資料。修改此 repo 即修改正式網站來源；main 根目錄是 Pages 發布位置，不設第二份前端維護副本。

新工具按分館放在 collection/、pve/、lore/ 的功能子目錄中，首頁 index.html 保持三館等權、六個入口。尚未開放館藏以提示說明，不能產生假路由。共用資源在實際有共用需要時才放 assets/，不先搭空框架。

## 私人資料與驗證
Collection 資料、規則、資料整備腳本與既有回歸測試仍在私人 Sixteenpct/ffxiv_collection。PvE、Lore、繁中名稱依各自資料主庫維護；不搬遷 Notion、Sheet、個人進度或私人歷史。
僅經核准的公開靜態資料可輸出到本 repo；私有資料產生流程不得因目標 repo 公開而整包複製。

工坊既有測試在 ffxiv_collection/workbench/ 執行。將兩個 repo 並排 checkout，執行 npm install 與 npm test；其他位置使用 FF14_JOURNEY_ROOT 指向本 repo 根目錄。測試必須讀取本 repo 的 collection/workbench/，不使用舊 docs/ 副本。
catalog.js 的公開快照維持既有内容，本次不重建配方。

## 保存與發布
先讀最新 main 與相關交接文件，完成適用驗證後以非強制更新提交；核對讀回版本及同 commit 的 Pages 結果。全域工作流程與 Git 安全規則依私人 dev_garden 中 CHATGPT_GLOBAL_WORKFLOW_RULES.md、CHATGPT_GIT_GLOBAL_RULES.md 執行。
本次整理只改維護位置及測試取檔路徑，不改網站執行檔、網址、儲存鍵或資料格式。個人存檔仍保存在使用者瀏覽器，不提交 Git。
ffxiv_workbench 舊 repo 與網址保留為相容版本，後續不再作為功能維護目標；本次不改名、不刪除、不修改它的執行檔。

## 2026-10-10 搬移 checkpoint
Journey 與工坊原始碼已先完整發布於本 repo（82bc19d721be038a70317f171e355915cf479b0e），本次將它提升為唯一原始碼主來源；私人 Collection 的重複 docs/ runtime 與 docs/journey/index.html 在確認檔案一致、測試通過後移除。舊版本可由 Git 歷史還原。

## 2026-10-10｜Notion → Website：PvE 職業圖鑑試作
本批已建立網站原生 `pve/jobs/index.html`、`pve/jobs/ninja/index.html` 與共用 `pve/reader.css`，並將 Journey 首頁「職業圖鑑」開通到網站站內路徑（新分頁）。
- 職業選擇頁承接已確認的五職能 21 職雙欄排序：左側坦克／近戰 DPS；右側治療／遠程物理／遠程魔法。只有忍者可點，20 職不產生空白頁。
- 忍者閱讀頁搬入 Notion 五階段 Lv50～90 的核心說明、十張繁中官方技能圖示及跨等級同步提醒；黃色等級標題意象保留，符合網站戰鬥分館視覺。
- Notion 原頁保持歷史來源；Git／Sheet 個人進度、熟練度與私人內容未搬到公開 repo。R005／R022 等完整課堂正文尚未在網站重建，關聯課號只作後續位置提示。
下一個獨立 checkpoint：按課號完整回搬 R005／R022 課堂講義至 `pve/courses/`，讀回核對後再從忍者內頁開通課程連結，避免假路由與重複內容。
