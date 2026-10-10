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

## 2026-10-10｜PvE 緊湊視覺基線＋全站 favicon 驗收
- 已開放的 `pve/jobs/index.html` 與 `pve/jobs/ninja/index.html` 以素材製作工坊 Sky Atlas 為字級／密度參考：一般字約 14px，縮短標題區、卡片行距、間隙與邊界留白；仍以實際閱讀舒適度、手機版與 WCAG 可用性為限，不一味縮小到難讀。忍者既定黃色等級章節保留。
- 職業選擇頁五大職能依天空藍、珊瑚橘、薄荷綠、暖金、薰衣草紫分別柔和識別，保留本人核定的職能排列與 21 職；尚未開放的 20 職不造假頁。
- **每個公開 HTML 頁都要有 favicon（瀏覽器分頁／書籤的小圖示）**。本站總首頁與工坊既有 inline SVG；戰鬥分館新增 `assets/favicon-pve.svg`，忍者新增 `assets/favicon-ninja.svg`。每頁 `<head>` 須有實際 `rel="icon"`，路徑依目錄深度寫對；新主題優先製作辨識度高的主題 icon。
- 每次新增／搬移 HTML 頁面，提交前必執行 `node scripts/check-favicons.mjs`，失敗即阻擋該批發佈；上線後再確認 GitHub Pages 的 favicon 連結實際可取。此規則與詳細例外以 `GPT_CONTEXT.md` 為準。

## 2026-10-10｜職業圖鑑可讀性與工坊麵包屑一致化
LiouLiou 新裁決：**職業圖鑑是文字教材，不是工坊密集表格，不可把工坊的約 14px 主字級直接當成教材標準**。首頁與職業閱讀頁正文桌面版改為約 17px、手機版至少約 16px；子標題、說明、卡片文字與進度提示一併放大至少兩級。保留已核准的卡片 padding／區塊間距及黃底職業等級標題，避免反向把版面撐鬆；麵包屑因需忠實於工坊實際規格，維持工坊的 11.48px（手機 10.66px）獨立基線。

**頁首麵包屑統一採工坊現行設計**：獨立於 hero 的短列、金棕色 `FF14 JOURNEY`（點開新分頁回 Journey 首頁）、藍色 `PVE / 職業圖鑑`（站內回分類頁）、一般色的目前位置，分隔符使用半形 ` / `，連結 hover 顏色與工坊一致；不得再退回全部同色的舊式全形分隔 breadcrumb。

**職業圖鑑首頁**：五大職能共 21 職和既定左右排列不動；任何可點選的職業圖鑑連結都用 `target="_blank" rel="noopener noreferrer"` 新開分頁，未開放的 20 職保持純文字；頁首不再放無意義的「職」字圓圈。職能配色：坦克天空藍、近戰 DPS **紅色系**、治療薄荷綠、遠程物理暖金、遠程魔法 **原近戰 DPS 珊瑚橘色系**；五職能一律使用真正彩色 emoji 圖示（治療🩹、遠程魔法🪄，其餘維持🛡️／⚔️／🏹），不用黑白字元取代。

**個別職業頁**：右上角改為正式職業圖示或職業水晶，尺寸配合版面；已完成的忍者示範使用繁中服官方忍者職業指南內的 `jobicon_d3_org.png`（來源頁 `https://www.ffxiv.com.tw/web/intro/guide/battle/ninja/`），不再誤用不相干的宣傳圖。頁面僅顯示職業圖示且如實註明來源，官方發布不等於保證任意公開重用獲授權，公開展示仍以適用條款為準。保留原教材正文、技能圖片、課號、favicon 與錨點路由。後續開新職頁時依此版型。
