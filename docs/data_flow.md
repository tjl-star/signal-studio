# 数据流与接口链路

## 第一关：YouTube 竞品账号批量取数

```text
channels.txt 中的 @handle
  → channels.list(forHandle)
  → channel.id、statistics.subscriberCount、contentDetails.relatedPlaylists.uploads
  → playlistItems.list(playlistId=uploads)
  → contentDetails.videoId
  → videos.list(id=video IDs)
  → 标题、发布时间、播放/点赞/评论、时长、标签和缩略图
```

- 输入：`channels.txt`、环境变量 `YOUTUBE_API_KEY`
- 输出：`data/raw/youtube/*.json`、`data/clean/youtube_competitor_videos.csv`
- 负责文件：`backend/fetch_youtube.py`
- 出错查看：终端和 `logs/run.log`

频道名本身没有视频统计数据。必须先获得频道的上传播放列表，再获得视频 ID，最后用视频 ID 查询统计数据。

## 第二关：TMDb 影视资料补全

```text
YouTube 标题
  → title_keywords.csv 人工映射
  → search/multi(query=剧名)
  → TMDb ID + media_type
  → tv/{id} 或 movie/{id}
  → 简介、类型、地区、语言、评分、热度、演员和海报
```

- 输入：第一关 CSV、`title_keywords.csv`、环境变量 `TMDB_API_KEY`
- 输出：`data/raw/tmdb/*.json`、`data/clean/tmdb_titles.csv`、`data/final/youtube_tmdb_merged.csv`
- 负责文件：`backend/enrich_tmdb.py`
- 出错查看：终端和 `logs/run.log`

## 第三关：热度比较和选题建议

综合热度分采用作品集口径：播放量 30%、互动率 20%、评论率 10%、新鲜度 15%、TMDb 热度 15%、TMDb 评分 10%。各指标先在本次样本内归一化。

- 输入：`data/final/youtube_tmdb_merged.csv`
- 输出：`data/final/content_recommendations.csv`、`docs/content_recommendations.md`、`dashboard_web/src/dashboard-data.json`
- 负责文件：`backend/analyze_content.py`
- 出错查看：终端和 `logs/run.log`

## 安全边界

- API Key 只存在于本机环境变量或 `.env`，`.env` 已被 Git 忽略。
- 原始 API 返回按时间戳追加保存，不覆盖旧文件。
- React 前端只导入静态 JSON 快照，不直接访问 YouTube 或 TMDb API。
- YouTube Data API 不提供普通公开视频的分享次数和精确地区热度。
