# FF14 Journey｜冒險者百科書庫

網站：https://sixteenpct.github.io/ffxiv_journey/

本 repo 是 **所有 FF14 Journey 公開網頁原始碼的唯一維護主庫與發布庫**。直接修改這裡，GitHub Pages 從 main 根目錄發布，不再從 Collection 複製一份前端。

| 網頁 | 原始碼 |
| --- | --- |
| Journey 總首頁 | index.html |
| 收藏分館／素材製作工坊 | collection/workbench/ |
| 收藏分館／永久收藏圖鑑（未建置） | 未來放 collection/catalog/ |
| 戰鬥分館／舊忍者養成路線（停用並保留相容轉址） | pve/jobs/ninja/ → pve/courses/lectures/?job=忍者；原始教材在 Git 備份分支 |
| 戰鬥分館／職業養成學院（21 職業選擇） | pve/courses/ |
| 戰鬥分館／講義總索引（R001／R003／R005／R007／R014／R022 已開放） | pve/courses/lectures/；正式講義在 pve/courses/r001/、r003/、r005/、r007/、r014/、r022/ |
| 戰鬥分館／PvE 內容專修（D029 幻龍殘骸密約之塔已開放） | pve/content/；正式講義 pve/content/d029/ |
| 故事分館／Lore 故事書庫（未建置） | 未來放 lore/stories/ |
| 故事分館／歷代 FF 致敬（未建置） | 未來放 lore/references/ |

未建置路徑僅是命名規則；目前不建立空網頁或假入口。
接手工程先讀 [GPT_CONTEXT.md](GPT_CONTEXT.md)，維護方法見 [DEVELOPMENT.md](DEVELOPMENT.md)。

## 退役原始碼封存

已停用的 `ffxiv_workbench` 舊站最後完整原始碼（9 檔）保存在本 repo 的獨立 [封存分支 `archive/ffxiv-workbench-legacy-20261012`](https://github.com/Sixteenpct/ffxiv_journey/tree/archive/ffxiv-workbench-legacy-20261012/ffxiv_workbench)，來源為舊 repo `27ff046253b3a20e483b22f6241f88e5f8771a7c`；逐檔 Git blob SHA 均已核對一致。封存分支不參與本站 Pages 發布，不得當作第二份網站維護。現行功能程式只維護 main 分支。
