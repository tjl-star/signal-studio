# 看板剧种展示规则

## 国产剧映射

凡是展示在看板中的内容，统一以 `season_id` 作为内容身份。满足以下条件时，展示剧种统一标记为“国产剧”：

- 题材标签（原始字段 `plot_type`）精确包含 `同性`；
- 剧种为泰剧（原始字段 `season_type=TH`），且产地（原始字段 `producer_region`）包含 `泰国`；
- 语言为普通话（原始字段 `language=普通话`）。

当前 `season_play_daily` 数据未稳定提供 `language` 字段，因此已确认的内容以 `data/bl_genre_mapping.json` 中的 `season_id` 作为受控补充映射；不得仅凭标题改类。

## 展示与统计口径

- 该规则只改变看板展示分类，不改变原始接口数据、`season_id`、播放VV/UV或榜单历史；
- 剧种汇总、剧种明细和相关榜单的展示分类均使用同一映射；
- 显示名称统一为“国产剧”，不再显示为“泰剧”或“国产”；
- 播放VV使用原始字段 `play_count`，播放UV使用原始字段 `play_uv`。

## 数据来源

- 明细：`data/season_play_daily/YYYY-MM-DD.json`；
- 剧种汇总原始接口快照：`seasonTypePlayRatio`；
- 受控补充映射：`data/bl_genre_mapping.json`，来源为 `电视列表 (2).xlsx`。
