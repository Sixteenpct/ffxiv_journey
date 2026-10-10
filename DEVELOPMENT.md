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

## 2026-10-10｜本人定案：PvE 圖鑑頁首、閱讀導覽、章節卡、全站 footer
- **忍者身份正確性**：先前使用 `jobicon_d3_org.png` 導致本人指出顯示為「雙劍士」，不得再將該圖片誤稱忍者；現改為 [FFXIV 官方 Eorzea Database｜Soul of the Ninja](https://na.finalfantasyxiv.com/lodestone/playguide/db/item/ec798591c4e/) 的真正忍者職業水晶 item icon。頁首圖片來源已修，5 個等級段、10 張技能圖和既有課號不變。
- **職業頁固定式閱讀**：忍者頁的麵包屑與縮矮的識別橫幅組成 `reading-masthead`，捲動時留在視窗頂端；左導覽以 `position:sticky` 停留在其下，依實際頭部高度配置 sticky offset／章節 anchor offset，避免標題被蓋。縮短的是彩色識別橫幅**而非麵包屑**；窄螢幕左目錄仍維持可橫向捲動的黏附導覽。
- **Lv 區段標題**：標題區塊高度與字級縮減，改低飽和灰米／鼠尾草中性色，不使用違和的亮黃。這是本人最新裁決，覆寫前一版黃底試作；正文至少約 17px 的可讀性不因緊湊設計而倒退。
- **相關課堂**：使用清楚的藍綠強調區塊、字級 17px 的課號與醒目的標題；每個等級只要一個「相關課堂」容器，內部 `course-grid` 桌面版兩欄排列，單筆佔整排，未來多筆左右並排；行動版單欄。正式網頁教材尚未搬入時不提供失效連結。
- **職業選擇首頁**：保留本人核准的左右職能排列、21 職與 readable fonts，以 `page-atlas` viewport flex layout 在一般桌面高度（含 1754×831 參考）完整顯示分類與 footer，不需捲動；極矮視窗與放大字級時允許捲動而不裁切。隱藏僅為幕後說明的 Notion 維護註記，保留維護來源於本文件。已開放職業的按鈕顏色必須跟隨職能色，不能一律套薄荷綠。
- **真正的近戰紅色**：`role-melee` 標題、左線、開放職業按鈕以偏正紅（非桃粉）的 `#ad2228` 為主；僅附帶低彩度淡紅底。其他職能顏色與五種 emoji 沿用已核准方案。
- **全站 footer 長期硬規則**：網站 root、工坊已有三行共通字級和樣式；新頁統一用 `assets/site-footer.css` 與 `footer-credit`／`footer-brand`／`footer-rights`，視覺字級與本文完全隔離。往後每次增修頁面必跑 `scripts/check-site-footers.mjs`，並維持 `scripts/check-favicons.mjs`。

### 2026-10-10｜近戰職能配色追修（最新本人裁決）
近戰 DPS 的上一版 `#ad2228` 正紅整體過重；最新版改為**柔和暖紅**：`--role:#b8554b`、`--tint:#fff1ed`、`--cell:#fffaf9`、`--active:#fae8e2`，包括職能標題、色條、開放職業（忍者）按鈕同步套用。仍保留「紅色系」識別，不回到桃粉紅；遠程魔法的珊瑚橘等其他四職能不改。以此項作為最新有效配色決定，覆蓋前面較深的正紅。

## 2026-10-10｜首頁版型事故回修（本人最新裁決）
- 職能總覽前版錯誤地強行 `height:100svh` 並將兩欄群組轉成比例式 `grid-template-rows`，在部分瀏覽器尺寸造成 header 跑位、卡片嚴重變形。**撤回強制滿版與群組伸縮規則**；恢復正常文流與自然高度，只沿用已核准的緊湊留白／字級，絕不能為了免捲動裁剪首頁。近戰維持已核准的柔和暖紅 `#b8554b`，不借事故回退配色。此項為 v4「一屏幕強制填滿」的修復，不是另做一套首頁。
- 忍者課程閱讀側欄改為**真正固定位置**（`position:fixed`，桌面維持左側柱、手機變成黏在固定頁首下方的橫向導覽），避免 `sticky` 起始捲動距離造成微小位移。右側章節仍使用正常頁面捲動、anchor offset 隨 masthead 實際高度更新。
- 等級章節標題從不協調的灰米棕色改回乾淨**低彩度天空藍／霧白**，維持已認可的瘦小標題高度與 17px 正文。不得回到過飽和亮黃。
- 本人不喜歡有不透明方框的職業水晶物品圖；忍者改用獨立的 **NIN** 職業圖標，與初始的 **ROG 雙劍士**圖示嚴格區別。圖片來源為 [xivapi/classjob-icons/risingstones/ninja.png](https://github.com/xivapi/classjob-icons/blob/master/risingstones/ninja.png) 的 Rising Stones 職業圖示集；不再顯示帶底色的物品水晶。圖示權利仍屬 SQUARE ENIX。

## 2026-10-10｜透明 NIN 徽記與 CSS 快取修正
- 修正前批以 `risingstones/ninja.png` 代替水晶時仍可能出現底色／外框的問題，改採本 repo 自有 `assets/job-ninja.svg`，取自正確的 FFXIV Ninja 職業 icon（**NIN 062410**，非 ROG 062309）的單一路徑輪廓，透明背景、不帶物品欄黑框，主色柔和暖紅。向量輪廓取材於 Ennea/ffxiv-job-icons 的 NIN SVG（其上游 xivapi/classjob-icons）；保留版權署名 `© SQUARE ENIX`。
- PvE 兩個 HTML 頁面的 `reader.css` URL 加上版本查詢 `?v=20261010-r05`，避免瀏覽器／CDN 沿用尚未移除強制滿版與米灰標題的舊 CSS。今後 CSS 內容更新若牽涉視覺修復，須同批更新受影響閱讀頁的版本標籤以確保部署立即生效。favicon/footer 硬規則照舊。

## 2026-10-10｜職能首頁對齊、適度鬆版與低彩度色塊（本人最新裁決）
- **麵包屑左緣**：職能總覽的外層 `.wrap` 是 `display:flex` body 的子元素，原先沒有明確寬度而收縮成文字寬，造成麵包屑跑到畫面正中央。改 `body.page-atlas>.wrap{width:100%;max-width:1330px}`，與 `PVE · JOB ATLAS` 所在的橫幅同一份 `.wrap` 左緣對齊；**不修改**既有麵包屑內容、顏色、字級、結構與點擊方式。
- **適度放鬆，不回歸上次崩壞**：桌面高視窗適度增加卡片內距、按鈕列高和職能間隔（`min-width:901px`、`min-height:760px`），利用下方空白但仍走正常自然文流；**禁止** `body.page-atlas{height:100svh}`、強制 `grid-template-rows` 等比例伸展版面。窗口過低／放大字體時允許正常捲動，不截斷內容。
- **所有開放閱讀職業的互動狀態**：底色和字色應延續對應職能的淡彩；一般狀態和 hover 的邊框使用低飽和混色，**不能直接以鮮豔 `var(--role)` 作硬亮邊框或 hover outline**。只有 `:focus-visible` 為鍵盤可及性保留明顯外框。近戰維持本人已核准暖紅 `#b8554b`。
- **忍者各階段／課堂配色**：Lv.50～90 階段小標題區塊調為低彩度**淡黃色 → 近白**漸層（不加胖、不加大正文）；每一個「相關課堂」容器改為**淡綠 → 近白**漸層，並以淡綠邊框、深綠文字維持閱讀辨識。相關課堂仍採單容器雙欄排版預留，多堂可一左一右；不改課號、正文或導覽。
- 此項只改 1～4；**21 職各別透明 SVG** 為 LiouLiou 提議但本回合明確暫緩，沒有開始製作或放進職業按鈕。下一批若獲授權才按每職正式職業圖標建檔，不混淆基本職／進階職。

## 2026-10-10｜職能總覽正式職業 SVG（21 職）
- LiouLiou 在前批明確允許施工：**21 職業的職能總覽按鈕文字前一律加上各自的透明職業 SVG**。不以同一圖示代替不同職業，不把上游基礎職／進階職混淆。現有忍者 NIN 062410 的 `assets/job-ninja.svg` 保持原檔；另外建置 20 個 SVG，均直接存放 `assets/job-<職業英文slug>.svg`，無外部圖片依賴。頁面只改圖示與必要文字排版，保留使用者認可的卡片密度、麵包屑、暖紅配色與 footer。
- 來源／判別：輪廓參考公開 [Ennea/ffxiv-job-icons](https://github.com/Ennea/ffxiv-job-icons) 中的 `isvg/<職能>/<iconId>.svg` 與 `notes.txt`（其 README 指向 xivapi/classjob-icons）。從已確認的圖形向量抽取單一路徑，拿掉背景、原來的發光濾鏡及外框，沿用忍者網站徽記的透明剪影風格；統一依五種職能採單色，保留原職業造型與輪廓。這是網站自有託管，不代表取得遊戲圖示著作權；**FINAL FANTASY XIV © SQUARE ENIX**。
- NIN (062410) ≠ ROG (062309)，PLD／WAR ≠ GLA／MRD 等。以下代碼在網站中具有可稽核的固定身分，請用 `node scripts/check-job-icons.mjs` 測試，**再加上既有 favicon 與 footer 兩項檢查**。若新增職業或升級職業映射，必須同時修正 icon 資產、映射和驗證；不得只看圖像外觀推定類別。
- 在頁面以 `<img class="job-icon" alt="" aria-hidden="true">` 當裝飾，真實職業名稱仍是可閱讀文字。SVG 依 role 色系：坦克 `#2686b5`、治療 `#258c71`、近戰 `#b8554b`、遠敏 `#ac7c2e`、遠魔 `#c77c56`。僅忍者維持已開放新分頁，其他 20 職仍保持「籌備中」，不得偽造連結。
- 這批僅建設職能總覽使用的 21 icon，不啟動其他職業教材與 Notion 搬遷。

| 職能 | 代號 | 中文職業 | 向量原始 ID | 本站 SVG |
| --- | --- | --- | --- | --- |
| tank | PLD | 騎士 | 062401 | `assets/job-paladin.svg` |
| tank | WAR | 戰士 | 062403 | `assets/job-warrior.svg` |
| tank | DRK | 暗黑騎士 | 062412 | `assets/job-dark-knight.svg` |
| tank | GNB | 絕槍戰士 | 062417 | `assets/job-gunbreaker.svg` |
| melee | MNK | 武僧 | 062402 | `assets/job-monk.svg` |
| melee | DRG | 龍騎士 | 062404 | `assets/job-dragoon.svg` |
| melee | NIN | 忍者 | 062410 | `assets/job-ninja.svg` |
| melee | SAM | 武士 | 062414 | `assets/job-samurai.svg` |
| melee | RPR | 奪魂者 | 062419 | `assets/job-reaper.svg` |
| melee | VPR | 毒蛇劍士 | 062421 | `assets/job-viper.svg` |
| healer | WHM | 白魔道士 | 062406 | `assets/job-white-mage.svg` |
| healer | SCH | 學者 | 062409 | `assets/job-scholar.svg` |
| healer | AST | 占星術師 | 062413 | `assets/job-astrologian.svg` |
| healer | SGE | 賢者 | 062420 | `assets/job-sage.svg` |
| ranged | BRD | 吟遊詩人 | 062405 | `assets/job-bard.svg` |
| ranged | MCH | 機工士 | 062411 | `assets/job-machinist.svg` |
| ranged | DNC | 舞者 | 062418 | `assets/job-dancer.svg` |
| caster | BLM | 黑魔道士 | 062407 | `assets/job-black-mage.svg` |
| caster | SMN | 召喚士 | 062408 | `assets/job-summoner.svg` |
| caster | RDM | 赤魔道士 | 062415 | `assets/job-red-mage.svg` |
| caster | PCT | 繪靈法師 | 062422 | `assets/job-pictomancer.svg` |

## 2026-10-10｜學者 SVG 可視範圍修復與精簡職能總覽
- 上一批 `assets/job-scholar.svg` **檔案有建立，實際卻看不到**。根因：來源 `Ennea/ffxiv-job-icons/isvg/healer/062409.svg` 的圖形路徑使用約 1000 座標單位，原始 `<path>` 帶有 `transform="matrix(0.09999999,0,0,0.09999999,...)">`；之前抽取輪廓卻漏掉 transform，套入 `viewBox="0 0 100 100"` 後圖案全在可視範圍外。修正為 `<path transform="scale(0.1)">`，保留正確 **SCH 062409** 圖案、原文字和透明底；已定向查核其他 20 職上游原始路徑，無其他額外 path transform。
- **職能總覽最新呈現裁決**：五職能標題旁不顯示 `4 職`／`6 職`／`3 職`；21 職按鈕／展示列不再顯示 `籌備中`／`閱讀 →`。保留真實職業名稱、圖標、`aria-label` 和語意身份，僅 NIN 忍者是 `<a>` 且仍新開分頁，其餘 20 職僅 `<span>` 不可點，不製造假路由。
- **治療 emoji**：從藥丸／OK 繃意象的 `🩹` 改為清楚的醫療十字 `➕`（emoji 呈現，非純文字字元）。
- **整體收窄**：職能總覽僅使用 `max-width:1120px` 的置中完整視覺欄寬，同步適用 header 麵包屑／標題及卡片主容器，避免再次發生首頁麵包屑置中錯誤；保持兩欄職能、內容密度、padding、文字大小與全站 footer 原規範，不鎖死頁高。
- **滑鼠 hover**：可點的職業連結使用角色色系 20% 混色漸層、適中邊框 43% 混色、細微陰影與 1px 上浮，比之前稍明顯而非刺眼／高飽和；不可點的職業不假裝可點，鍵盤可及性 `:focus-visible` 外框保留。讀取版本號 `reader.css?v=20261010-r08`。日後職業陸續開放沿用相同規則。
- `scripts/check-job-icons.mjs` 必須檢查新版無狀態文字列，且檢查 Scholar 的 `scale(0.1)` 是否保留、並針對明顯出界的 SVG 初始路徑座標加入基本防漏；單純確認 21 個檔案存在不能再算圖示完全可用。

## 2026-10-10｜職業圖鑑標題保留、按鈕間距與忍者側欄精準對齊
- **職能總覽的 `<h1>職業圖鑑</h1>` 是必須長期存在、可見的主標題**，本輪核對原 HTML 並無缺漏；為避免被過度緊縮成不醒目的小字，明定在 `page-atlas` 大橫幅中以 29px／粗體／深藍清楚顯示（手機 27px）。首頁的標題彩色橫幅沿用忍者頁 9px／11px 上下留白、11.5px eyebrow、15.5px 描述，縮短整體高度；**不動**獨立於橫幅上方的工坊樣式麵包屑。圖鑑的主 `h1` 另納入 `scripts/check-job-icons.mjs` 的持久檢查。
- **各職業按鈕要有真正的獨立留白**：桌面兩欄 grid `column-gap:16px`、`row-gap:15px`，手機 `10px／12px`；不依賴放大卡片或字體來撐距離，不重啟過去造成首頁跑版的 `height:100svh` 強制填滿規則；21 職、職能排列、SVG、hover 色與鎖定狀態全保留。
- **忍者閱讀頁左側固定目錄與「忍者」標題的 X 軸精準對齊**：前一版固定 sidebar 用 `100vw` 推導左緣，瀏覽器有捲軸時可能比 header 的實際內容左緣多偏右半個捲軸寬。現有的 `reading-masthead` 高度同步程式增加 `title.getBoundingClientRect().left`，輸出 `--reading-title-left`；桌面 `fixed sidebar` 直接讀取這個左緣。小螢幕維持既定水平固定導覽，不強制用桌面座標。
- 這批只修改 `pve/reader.css`、`pve/jobs/index.html`、`pve/jobs/ninja/index.html` 與以上治理文字／主標題檢查。公共網站樣式版本提升 `?v=20261010-r09`，避免瀏覽器快取。素材工坊、其他分館、21 個 SVG、Ninja 課程正文、favicon 與 footer 都不在本次施工範圍。
