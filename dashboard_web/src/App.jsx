import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line,
  Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip,
  XAxis, YAxis, ZAxis,
} from "recharts";
import {
  ArrowClockwise, ArrowRight, CheckCircle, Database, DownloadSimple,
  CaretDown, FilmStrip, MagnifyingGlass, PlayCircle, Sparkle, SquaresFour, Timer,
} from "@phosphor-icons/react";
import fallbackDashboard from "./dashboard-data.json";

const API_BASE = "http://127.0.0.1:8000";
const TYPE_LABELS = {
  trailer: "预告", clip: "片段", behind_the_scenes: "幕后",
  interview: "采访", announcement: "官宣", short: "短视频", other: "其他",
};
const TYPE_ORDER = ["trailer", "interview", "short", "announcement", "behind_the_scenes", "clip", "other"];
const COLORS = ["#5b67d8", "#24a378", "#e2a63b", "#7d66d9", "#718096", "#df7852"];
const NAV = [
  { key: "overview", label: "运营总览", icon: SquaresFour },
  { key: "videos", label: "竞品视频库", icon: PlayCircle },
  { key: "titles", label: "影视项目库", icon: FilmStrip },
  { key: "ai", label: "AI选题助手", icon: Sparkle },
  { key: "sources", label: "数据与任务", icon: Database },
];

const num = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const compact = (value) => {
  const n = num(value);
  if (n >= 100000000) return `${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 1 : 2)}万`;
  return Math.round(n).toLocaleString("zh-CN");
};
const percent = (value) => `${(num(value) * 100).toFixed(2)}%`;
const shortDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "未知" : `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const splitList = (value) => Array.isArray(value) ? value : String(value || "").split("|").map((x) => x.trim()).filter(Boolean);
const unique = (values) => [...new Set(values.filter(Boolean))];

function groupBy(items, keyOf, build) {
  const map = new Map();
  items.forEach((item) => {
    const key = keyOf(item);
    map.set(key, [...(map.get(key) || []), item]);
  });
  return [...map.entries()].map(([key, rows]) => build(key, rows));
}

function useModel() {
  return useMemo(() => {
    const data = fallbackDashboard?.data || fallbackDashboard;
    const videos = (data.videos || []).map((video, index) => ({
      ...video,
      rank: num(video.rank, index + 1), views: num(video.views), likes: num(video.likes),
      comments: num(video.comments), heat_score: num(video.heat_score),
      engagement_rate: num(video.engagement_rate), content_type: video.content_type || "other",
      content_type_label: video.content_type_label || TYPE_LABELS[video.content_type] || "其他",
      channel_title: video.channel_title || "未知频道", title: video.title || "未命名视频",
    })).sort((a, b) => b.heat_score - a.heat_score);

    const channels = (data.channels || []).map((item) => ({
      ...item, video_count: num(item.video_count), total_views: num(item.total_views),
      engagement_rate: num(item.engagement_rate), avg_heat_score: num(item.avg_heat_score),
    }));
    const titles = (data.titles || []).map((item) => ({
      ...item, tmdb_id: String(item.tmdb_id || ""), title: item.title || item.original_title || "未命名项目",
      genres: splitList(item.genres), origin_countries: splitList(item.origin_countries),
      channel_titles: splitList(item.channel_titles), total_views: num(item.total_views),
      video_count: num(item.video_count), popularity: num(item.popularity),
      vote_average: num(item.vote_average), best_heat_score: num(item.best_heat_score),
    })).map((item) => ({
      ...item,
      coverage: unique(item.channel_titles).length,
      opportunity: item.popularity * 0.35 + Math.log10(item.total_views + 1) * 12 + item.video_count * 4 + item.best_heat_score * 0.45,
    })).sort((a, b) => b.opportunity - a.opportunity);

    const daily = (data.daily || []).map((row) => ({
      date: String(row.date || "").slice(5), total_views: num(row.total_views), video_count: num(row.video_count),
    }));
    const totalViews = videos.reduce((sum, item) => sum + item.views, 0);
    const totalLikes = videos.reduce((sum, item) => sum + item.likes, 0);
    const totalComments = videos.reduce((sum, item) => sum + item.comments, 0);
    const mapped = videos.filter((item) => item.tmdb_id).length;
    const typeSummary = groupBy(videos, (v) => v.content_type, (type, rows) => ({
      type, label: TYPE_LABELS[type] || "其他", count: rows.length,
      views: rows.reduce((s, x) => s + x.views, 0),
      engagement: rows.reduce((s, x) => s + x.engagement_rate, 0) / rows.length,
    })).sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
    const heatBuckets = [
      { name: "低热度 <30", value: videos.filter((v) => v.heat_score < 30).length },
      { name: "观察 30–45", value: videos.filter((v) => v.heat_score >= 30 && v.heat_score < 45).length },
      { name: "高潜 45–60", value: videos.filter((v) => v.heat_score >= 45 && v.heat_score < 60).length },
      { name: "爆发 >60", value: videos.filter((v) => v.heat_score >= 60).length },
    ];
    const channelMatrix = channels.map((channel) => {
      const row = { channel: channel.channel_title };
      TYPE_ORDER.slice(0, 6).forEach((type) => {
        row[type] = videos.filter((v) => v.channel_title === channel.channel_title && v.content_type === type).length;
      });
      return row;
    });
    const genres = groupBy(
      titles.flatMap((title) => title.genres.map((genre) => ({ genre }))),
      (item) => item.genre,
      (genre, rows) => ({ genre, count: rows.length }),
    ).sort((a, b) => b.count - a.count).slice(0, 6);
    return {
      generatedAt: data.generated_at || "", videos, channels, titles, daily, typeSummary,
      heatBuckets, channelMatrix, genres, sources: data.data_sources || [],
      totals: {
        videos: videos.length, channels: channels.length, titles: titles.length, mapped,
        totalViews, engagement: totalViews ? (totalLikes + totalComments) / totalViews : 0,
        recent48: videos.filter((v) => num(v.age_hours, 9999) <= 48).length,
      },
    };
  }, []);
}

function AppChrome({ active, setActive, model, children }) {
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><strong>Signal Studio</strong><span>海外影视内容运营 AI 工作台</span></div></div>
      <nav>
        <div className="nav-caption">工作台</div>
        {NAV.map((item) => {
          const Icon = item.icon;
          return <button key={item.key} className={`nav-item ${active === item.key ? "active" : ""}`} onClick={() => setActive(item.key)}>
            <Icon size={19} weight={active === item.key ? "fill" : "regular"}/><span>{item.label}</span>
          </button>;
        })}
      </nav>
      <div className="side-status"><i/><div><strong>数据快照正常</strong><span>{model.totals.videos} 条视频 · {model.totals.titles} 个项目</span></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><strong>{NAV.find((x) => x.key === active)?.label}</strong><div className="top-actions"><span className="status-chip"><i/>本地快照</span><span className="top-meta"><Timer size={16}/> 更新于 {shortDate(model.generatedAt)}</span><button className="icon-button" aria-label="刷新页面" onClick={() => window.location.reload()}><ArrowClockwise size={18}/></button></div></header>
      {children}
    </main>
  </div>;
}

function PageHeader({ title, description, action }) {
  return <div className="page-header"><div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
function Panel({ title, note, children, className = "" }) {
  return <section className={`panel ${className}`}><header><div><h2>{title}</h2>{note && <p>{note}</p>}</div></header><div className="panel-body">{children}</div></section>;
}
function Metric({ label, value, unit, note, accent = false }) {
  return <div className={`metric ${accent ? "accent" : ""}`}><span>{label}</span><strong>{value}<small>{unit}</small></strong><p>{note}</p></div>;
}
function DateBar() {
  return <div className="date-bar"><div className="segments"><button className="selected">近30天</button><button>本月</button></div><span className="date-input">2026-06-18</span><b>至</b><span className="date-input">2026-07-17</span><button className="primary small">查询</button><strong>近30天</strong></div>;
}

function Overview({ model, setActive }) {
  return <div className="page">
    <PageHeader title="运营总览" description="先判断整体趋势与账号差异，再进入对应模块查看证据。"/>
    <DateBar/>
    <div className="metrics four">
      <Metric label="总播放量" value={compact(model.totals.totalViews)} note={`${model.totals.videos} 条内容 · ${model.totals.channels} 个频道`} accent/>
      <Metric label="整体互动率" value={percent(model.totals.engagement)} note="点赞与评论 / 播放"/>
      <Metric label="近48小时发布" value={model.totals.recent48} unit="条" note="内容新鲜度"/>
      <Metric label="已关联影视项目" value={`${model.totals.mapped}/${model.totals.videos}`} note={`${model.totals.titles} 个 TMDb 项目`}/>
    </div>
    <div className="dashboard-grid">
      <Panel title="14日播放趋势" note="按发布日期聚合播放表现" className="wide">
        <div className="chart chart-large"><ResponsiveContainer><AreaChart data={model.daily} margin={{top:18,right:24,left:8,bottom:4}}><defs><linearGradient id="overviewFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f67d9" stopOpacity=".25"/><stop offset="1" stopColor="#4f67d9" stopOpacity=".02"/></linearGradient></defs><CartesianGrid stroke="#e9edf4" vertical={false}/><XAxis dataKey="date" axisLine={false} tickLine={false}/><YAxis tickFormatter={compact} axisLine={false} tickLine={false} width={62}/><Tooltip formatter={(v) => compact(v)}/><Area type="monotone" dataKey="total_views" name="播放量" stroke="#4f67d9" strokeWidth={3} fill="url(#overviewFill)"/></AreaChart></ResponsiveContainer></div>
      </Panel>
      <Panel title="频道表现" note="按总播放量对比" className="narrow">
        <div className="chart chart-large"><ResponsiveContainer><BarChart data={model.channels} layout="vertical" margin={{top:20,right:30,left:12,bottom:4}}><CartesianGrid stroke="#edf0f5" horizontal={false}/><XAxis type="number" tickFormatter={compact} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="channel_title" width={90} axisLine={false} tickLine={false}/><Tooltip formatter={(v) => compact(v)}/><Bar dataKey="total_views" name="播放量" fill="#4f67d9" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div>
      </Panel>
      <Panel title="高潜内容" note="综合热度 Top 5，仅保留用于决策的代表内容" className="wide">
        <CompactVideoTable videos={model.videos.slice(0,5)}/>
      </Panel>
      <Panel title="结构洞察" note="当前内容类型占比" className="narrow">
        <div className="chart chart-small"><ResponsiveContainer><PieChart><Pie data={model.typeSummary} dataKey="count" nameKey="label" innerRadius={58} outerRadius={88} paddingAngle={2}>{model.typeSummary.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/><Legend iconType="circle" iconSize={8}/></PieChart></ResponsiveContainer></div>
        <button className="text-button" onClick={() => setActive("videos")}>查看竞品表现 <ArrowRight size={15}/></button>
      </Panel>
    </div>
  </div>;
}

function Filters({ model, query, setQuery, channel, setChannel, type, setType }) {
  return <div className="filter-bar"><label><MagnifyingGlass size={17}/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="搜索标题、频道或影视项目"/></label><select value={channel} onChange={(e)=>setChannel(e.target.value)}><option value="all">全部频道</option>{model.channels.map((x)=><option key={x.channel_title}>{x.channel_title}</option>)}</select><select value={type} onChange={(e)=>setType(e.target.value)}><option value="all">全部类型</option>{model.typeSummary.map((x)=><option key={x.type} value={x.type}>{x.label}</option>)}</select></div>;
}
function CompactVideoTable({ videos, selectedId, onSelect }) {
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>排名</th><th>内容</th><th>频道</th><th>类型</th><th>播放量</th><th>互动率</th><th>热度</th></tr></thead><tbody>{videos.map((v)=><tr key={v.video_id} className={selectedId === v.video_id ? "selected" : ""} onClick={()=>onSelect?.(v.video_id)}><td><b className="rank">{v.rank}</b></td><td><strong className="truncate">{v.title}</strong><span>{shortDate(v.published_at)} · {v.tmdb_title || "未关联IP"}</span></td><td>{v.channel_title}</td><td><em>{v.content_type_label}</em></td><td>{compact(v.views)}</td><td>{percent(v.engagement_rate)}</td><td><strong>{v.heat_score.toFixed(1)}</strong></td></tr>)}</tbody></table></div>;
}

function VideoLibrary({ model }) {
  const [query,setQuery]=useState(""); const [channel,setChannel]=useState("all"); const [type,setType]=useState("all");
  const [selectedId,setSelectedId]=useState(model.videos[0]?.video_id);
  const filtered=useMemo(()=>model.videos.filter(v=>(channel==="all"||v.channel_title===channel)&&(type==="all"||v.content_type===type)&&(!query||`${v.title} ${v.channel_title} ${v.tmdb_title}`.toLowerCase().includes(query.toLowerCase()))),[model.videos,query,channel,type]);
  const selected=filtered.find(v=>v.video_id===selectedId)||filtered[0];
  const scatter=filtered.map(v=>({...v, engagementPercent:v.engagement_rate*100}));
  return <div className="page"><PageHeader title="竞品视频库" description="聚焦内容热度、播放与互动关系；完整视频数据留在数据库中。"/><Filters model={model} query={query} setQuery={setQuery} channel={channel} setChannel={setChannel} type={type} setType={setType}/>
    <div className="dashboard-grid">
      <Panel title="视频热度分布" note="判断内容池是否出现明显爆发内容" className="half"><div className="chart chart-medium"><ResponsiveContainer><BarChart data={model.heatBuckets} margin={{top:18,right:20,left:0,bottom:4}}><CartesianGrid stroke="#edf0f5" vertical={false}/><XAxis dataKey="name" axisLine={false} tickLine={false}/><YAxis allowDecimals={false} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="value" name="视频数" fill="#5b67d8" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></Panel>
      <Panel title="播放量 vs 互动率" note="右上区域代表兼具曝光与互动的高价值内容" className="half"><div className="chart chart-medium"><ResponsiveContainer><ScatterChart margin={{top:18,right:22,left:0,bottom:4}}><CartesianGrid stroke="#edf0f5"/><XAxis dataKey="views" tickFormatter={compact} axisLine={false} tickLine={false}/><YAxis dataKey="engagementPercent" tickFormatter={(v)=>`${v.toFixed(1)}%`} axisLine={false} tickLine={false}/><ZAxis dataKey="heat_score" range={[70,260]}/><Tooltip formatter={(v,n)=>n==="engagementPercent"?`${num(v).toFixed(2)}%`:compact(v)}/><Scatter data={scatter} fill="#5b67d8"/></ScatterChart></ResponsiveContainer></div></Panel>
      <Panel title="代表视频 Top 10" note={`当前筛选 ${filtered.length} 条，只展示最有代表性的 10 条`} className="wide"><CompactVideoTable videos={filtered.slice(0,10)} selectedId={selected?.video_id} onSelect={setSelectedId}/></Panel>
      <Panel title="证据详情" note="点击左侧任意内容查看" className="narrow">{selected?<div className="evidence"><h3>{selected.title}</h3><p>{selected.channel_title} · {shortDate(selected.published_at)} · {selected.content_type_label}</p><div className="mini-grid"><div><span>播放量</span><strong>{compact(selected.views)}</strong></div><div><span>互动率</span><strong>{percent(selected.engagement_rate)}</strong></div><div><span>热度分</span><strong>{selected.heat_score.toFixed(1)}</strong></div><div><span>评论</span><strong>{compact(selected.comments)}</strong></div></div><div className="insight"><strong>运营判断</strong><p>{selected.recommendation || "适合观察标题包装、发布时间与内容形式。"}</p></div><a className="primary full" href={selected.video_url} target="_blank" rel="noreferrer">在 YouTube 查看 <ArrowRight size={15}/></a></div>:<p className="empty">暂无匹配内容</p>}</Panel>
    </div>
  </div>;
}

function TitleLibrary({ model }) {
  const [selectedId,setSelectedId]=useState(model.titles[0]?.tmdb_id); const selected=model.titles.find(x=>x.tmdb_id===selectedId)||model.titles[0];
  return <div className="page"><PageHeader title="影视项目库" description="用 TMDb 热度与竞品覆盖识别值得继续跟进的影视 IP。"/>
    <div className="dashboard-grid">
      <Panel title="IP机会象限" note="横轴 TMDb 热度，纵轴关联播放量；右上区域优先关注" className="wide"><div className="chart chart-large"><ResponsiveContainer><ScatterChart margin={{top:18,right:24,left:8,bottom:4}}><CartesianGrid stroke="#edf0f5"/><XAxis dataKey="popularity" name="TMDb热度" axisLine={false} tickLine={false}/><YAxis dataKey="total_views" name="关联播放" tickFormatter={compact} axisLine={false} tickLine={false}/><ZAxis dataKey="video_count" range={[90,300]}/><Tooltip formatter={(v,n)=>n==="关联播放"?compact(v):v}/><Scatter data={model.titles} fill="#4f67d9"/></ScatterChart></ResponsiveContainer></div></Panel>
      <Panel title="类型分布" note="当前监测影视项目结构" className="narrow"><div className="chart chart-large"><ResponsiveContainer><BarChart data={model.genres} layout="vertical" margin={{top:20,right:28,left:12,bottom:4}}><CartesianGrid stroke="#edf0f5" horizontal={false}/><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="genre" width={110} axisLine={false} tickLine={false}/><Tooltip/><Bar dataKey="count" name="项目数" fill="#24a378" radius={[0,6,6,0]}/></BarChart></ResponsiveContainer></div></Panel>
      <Panel title="高潜 IP 排行" note="结合平台热度、关联播放与竞品覆盖" className="wide"><div className="table-wrap"><table className="data-table"><thead><tr><th>IP</th><th>类型</th><th>覆盖频道</th><th>关联视频</th><th>关联播放</th><th>TMDb热度</th><th>机会分</th></tr></thead><tbody>{model.titles.slice(0,8).map(t=><tr key={t.tmdb_id} className={selected?.tmdb_id===t.tmdb_id?"selected":""} onClick={()=>setSelectedId(t.tmdb_id)}><td><strong>{t.title}</strong><span>{t.original_title}</span></td><td>{t.genres.slice(0,2).join(" / ")||"待补充"}</td><td>{t.coverage}</td><td>{t.video_count}</td><td>{compact(t.total_views)}</td><td>{t.popularity.toFixed(1)}</td><td><strong>{t.opportunity.toFixed(1)}</strong></td></tr>)}</tbody></table></div></Panel>
      <Panel title="IP判断" note="点击左侧项目查看" className="narrow">{selected&&<div className="ip-detail"><div className="ip-title">{selected.poster_url&&<img src={selected.poster_url} alt=""/>}<div><h3>{selected.title}</h3><p>{selected.genres.slice(0,3).join(" · ")||"类型待补充"}</p></div></div><p className="summary">{selected.overview||"暂无中文简介。"}</p><div className="mini-grid"><div><span>评分</span><strong>{selected.vote_average||"—"}</strong></div><div><span>热度</span><strong>{selected.popularity.toFixed(1)}</strong></div><div><span>关联视频</span><strong>{selected.video_count}</strong></div><div><span>覆盖频道</span><strong>{selected.coverage}</strong></div></div><div className="insight success"><strong>内容机会</strong><p>{selected.coverage<=1?"竞品覆盖少但已有热度，可作为差异化跟进候选。":"已有多个频道覆盖，适合比较包装方式并寻找二创角度。"}</p></div></div>}</Panel>
    </div>
  </div>;
}

function fallbackBrief(lead, objective) {
  const ip=lead?.tmdb_title||"热门影视内容";
  return { topic_direction:`围绕《${ip}》承接高互动话题`, business_goal:objective, core_insight:"候选内容同时出现较高热度与互动信号，适合优先复盘其标题钩子和粉丝讨论点。", content_format:"热点解读 + 高互动片段混剪", target_audience:"海外影视、流媒体与娱乐内容受众", suggested_duration:"20–45秒", publishing_advice:"优先在新物料发布后 24–48 小时内跟进", title_options:[`${ip}为什么突然被刷屏？`,`从竞品数据看${ip}的一个内容机会`,`${ip}高互动片段，可以这样二创包装`], opening_hook:`为什么这条内容获得了${compact(lead?.views)}播放？`, evidence:[{fact:`${lead?.channel_title}《${lead?.title}》播放${compact(lead?.views)}，互动率${percent(lead?.engagement_rate)}`}], operational_hypotheses:["高互动可能来自明确IP、纪念节点或强情绪标题，需要结合评论继续验证。"], risks:["缺少地区热度、分享量与完播率；发布前需确认素材版权与平台规则。"], confidence:.55 };
}

function AiAssistant({ model }) {
  const [selectedIds,setSelectedIds]=useState(model.videos.slice(0,2).map(v=>v.video_id)); const [objective,setObjective]=useState("提升海外影视内容曝光与互动");
  const [brief,setBrief]=useState(()=>fallbackBrief(model.videos[0],objective)); const [loading,setLoading]=useState(false); const [scopeOpen,setScopeOpen]=useState(false); const selected=model.videos.filter(v=>selectedIds.includes(v.video_id));
  const toggle=(id)=>setSelectedIds(current=>current.includes(id)?current.filter(x=>x!==id):(current.length<5?[...current,id]:current));
  async function generate(){ if(!selectedIds.length)return; setLoading(true); try{ const response=await fetch(`${API_BASE}/api/ai/briefs`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({video_ids:selectedIds,objective})}); if(!response.ok)throw new Error(); const payload=await response.json(); setBrief(payload?.data?.brief||payload?.data||fallbackBrief(selected[0],objective)); }catch{ setBrief(fallbackBrief(selected[0],objective)); }finally{setLoading(false);setScopeOpen(false);} }
  return <div className="page"><PageHeader title="AI选题助手" description="选择少量竞品证据，让模型把数据转化为可执行的内容建议。"/>
    <section className="decision-scope"><div><label>决策证据范围</label><button className="scope-select" onClick={()=>setScopeOpen(!scopeOpen)}>{selected.length ? `已选择 ${selected.length} 条高潜内容` : "请选择 1–5 条内容"}<CaretDown size={16}/></button></div><label className="goal-input">业务目标<input value={objective} onChange={e=>setObjective(e.target.value)}/></label><button className="primary" disabled={loading||!selectedIds.length} onClick={generate}>{loading?"正在生成…":"重新生成"}</button></section>
    {scopeOpen&&<section className="scope-popover"><header><strong>选择分析证据</strong><span>最多 5 条</span></header>{model.videos.slice(0,10).map(v=><label key={v.video_id}><input type="checkbox" checked={selectedIds.includes(v.video_id)} onChange={()=>toggle(v.video_id)}/><div><strong>{v.title}</strong><span>{v.channel_title} · 热度 {v.heat_score.toFixed(1)} · {compact(v.views)}播放</span></div></label>)}</section>}
    <Panel title="AI运营建议" note={`基于 ${selected.length} 条竞品证据 · ${brief?.provider||"规则分析"}`} className="decision-report"><article className="report"><section><h3>一、总体判断</h3><p>{brief.core_insight}</p></section><section><h3>二、选题与制作建议</h3><div className="report-kpis"><div><span>选题方向</span><strong>{brief.topic_direction}</strong></div><div><span>内容形式</span><strong>{brief.content_format}</strong></div><div><span>目标受众</span><strong>{brief.target_audience}</strong></div><div><span>建议时长</span><strong>{brief.suggested_duration}</strong></div></div></section><section><h3>三、标题与开场</h3><ol>{(brief.title_options||[]).slice(0,3).map((x,i)=><li key={i}>{x}</li>)}</ol><p><b>开场钩子：</b>{brief.opening_hook}</p></section><section><h3>四、发布建议</h3><p>{brief.publishing_advice}</p></section><section><h3>五、数据依据</h3><ul>{(brief.evidence||[]).map((x,i)=><li key={i}>{typeof x==="string"?x:x.fact}</li>)}</ul></section><section><h3>六、运营假设与风险</h3><ul>{[...(brief.operational_hypotheses||[]),...(brief.risks||[])].map((x,i)=><li key={i}>{x}</li>)}</ul><p className="confidence">建议置信度：{Math.round(num(brief.confidence)*100)}%</p></section></article></Panel>
  </div>;
}

function Sources({ model }) {
  return <div className="page"><PageHeader title="数据与任务" description="集中说明数据来源、更新时间、导出方式与指标口径。"/>
    <div className="metrics four"><Metric label="YouTube 数据" value="正常" note={`${model.totals.videos} 条视频` } accent/><Metric label="TMDb 资料" value={model.totals.titles} unit="个" note="影视资料已补全"/><Metric label="最近更新" value={shortDate(model.generatedAt)} note="当前数据快照"/><Metric label="公开版安全" value="脱敏" note="前端不含 API Key"/></div>
    <div className="dashboard-grid">
      <Panel title="数据源状态" note="本地系统可采集；公开版只展示脱敏快照" className="wide"><div className="source-table">{(model.sources.length?model.sources:[{name:"YouTube Data API v3",status:"正常",records:model.totals.videos,role:"频道、视频与互动指标"},{name:"TMDb API",status:"正常",records:model.totals.titles,role:"影视资料、评分与热度"}]).map((s,i)=><div key={i}><CheckCircle size={20} weight="fill"/><strong>{s.name}</strong><span>{s.role||"已接入当前数据流"}</span><b>{s.records||0} 条</b><em>{s.status||"正常"}</em></div>)}</div></Panel>
      <Panel title="导出成果" note="供同事复盘或作品集展示" className="narrow"><div className="exports"><a href={`${API_BASE}/api/exports/videos.csv`}><DownloadSimple size={19}/>视频数据 CSV</a><a href={`${API_BASE}/api/exports/recommendations.csv`}><DownloadSimple size={19}/>推荐结果 CSV</a><a href={`${API_BASE}/api/exports/report.md`}><DownloadSimple size={19}/>运营报告 Markdown</a></div></Panel>
      <Panel title="指标口径" note="所有看板指标统一按以下方式计算" className="full"><div className="definitions"><div><strong>互动率</strong><span>（点赞 + 评论）/ 播放量</span></div><div><strong>热度分</strong><span>综合播放、互动、新鲜度与影视语境的规则评分</span></div><div><strong>内容类型</strong><span>根据标题、描述、时长和关键词进行规则分类</span></div><div><strong>高潜内容</strong><span>适合进一步复盘包装、选题或二创跟进的代表视频</span></div></div></Panel>
    </div>
  </div>;
}

export function App(){ const model=useModel(); const [active,setActive]=useState("overview"); return <AppChrome active={active} setActive={setActive} model={model}>{active==="overview"&&<Overview model={model} setActive={setActive}/>} {active==="videos"&&<VideoLibrary model={model}/>} {active==="titles"&&<TitleLibrary model={model}/>} {active==="ai"&&<AiAssistant model={model}/>} {active==="sources"&&<Sources model={model}/>}</AppChrome>; }
