const pageTitles = {
  overview: "大盘总览",
  content: "内容榜单",
  search: "搜索分析"
};

let dashboardData;
const chartInstances = [];

document.addEventListener("DOMContentLoaded", async () => {
  bindNavigation();
  try {
    const response = await fetch("real-data.json");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    dashboardData = await response.json();
    document.getElementById("date-filter").value = dashboardData.dashboard_date;
    renderDashboard(dashboardData);
  } catch (error) {
    document.querySelector(".main").innerHTML = `
      <section class="panel">
        <h3>真实数据未加载</h3>
        <p>请确认 <code>real-data.json</code> 存在，并通过本地静态服务打开看板，例如在 dashboard-demo 目录运行 <code>python -m http.server 8000</code>。</p>
      </section>
    `;
  }
});

window.addEventListener("resize", () => {
  chartInstances.forEach((chart) => chart.resize());
});

function bindNavigation() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(`page-${button.dataset.page}`).classList.add("active");
      document.getElementById("page-title").textContent = pageTitles[button.dataset.page];
      chartInstances.forEach((chart) => chart.resize());
    });
  });
}

function renderDashboard(data) {
  renderMetricCards(data.pages.overview.metric_cards);
  renderTrendChart("dau-chart", data.pages.overview.trends.dau_30d, "DAU", false);
  renderTrendChart("new-users-chart", data.pages.overview.trends.new_users_30d, "新增用户", false);
  renderTrendChart("play-rate-chart", data.pages.overview.trends.play_rate_30d, "播放率", true);
  renderPlatformTable(data.pages.overview.platform_breakdown);
  renderHotPlayTable(data.pages.content_analysis.hot_play_top30);
  renderGenreShare(data.pages.content_analysis.genre_play_share);
  renderHotSearchTable(data.pages.search_analysis.hot_search_top30);
  renderSearchFunnel(data.pages.search_analysis.search_funnel.steps);
}

function renderMetricCards(metrics) {
  const container = document.getElementById("metric-cards");
  container.innerHTML = metrics.map((metric) => {
    const isPending = metric.status === "pending";
    const value = isPending ? "后续补充" : formatValue(metric.value, metric.unit);
    const wow = metric.wow === null ? "昨日环比：后续补充" : `昨日环比：${formatPercent(metric.wow, true)}`;
    return `
      <article class="metric-card">
        <div class="metric-title">
          <span>${metric.metric_name}</span>
          <span class="status ${metric.status}">${statusText(metric.status)}</span>
        </div>
        <div class="metric-value ${isPending ? "pending-text" : ""}">${value}</div>
        <div class="metric-meta ${metric.wow >= 0 ? "up" : "down"}">${wow}</div>
      </article>
    `;
  }).join("");
}

function renderTrendChart(elementId, rows, name, percent) {
  const chart = echarts.init(document.getElementById(elementId));
  const safeRows = Array.isArray(rows) ? rows.filter((row) => row && row.value !== null && row.value !== undefined) : [];
  chart.setOption({
    color: ["#2563eb"],
    grid: { left: 46, right: 18, top: 30, bottom: 42 },
    tooltip: {
      trigger: "axis",
      formatter: (items) => {
        const item = items[0];
        return `${item.axisValue}<br>${name}：${percent ? formatPercent(item.data) : formatNumber(item.data)}`;
      }
    },
    xAxis: {
      type: "category",
      data: safeRows.map((row) => row.date.slice(5)),
      axisLine: { lineStyle: { color: "#d6dce8" } },
      axisLabel: { color: "#6b7588" }
    },
    yAxis: {
      type: "value",
      axisLabel: {
        color: "#6b7588",
        formatter: (value) => percent ? `${Math.round(value * 100)}%` : compactNumber(value)
      },
      splitLine: { lineStyle: { color: "#eef2f7" } }
    },
    series: [{
      name,
      type: "line",
      smooth: true,
      symbol: "none",
      areaStyle: { color: "rgba(37,99,235,0.10)" },
      data: safeRows.map((row) => row.value)
    }]
  });
  chartInstances.push(chart);
}

function renderPlatformTable(rows) {
  const safeRows = Array.isArray(rows) ? rows : [];
  document.getElementById("platform-table").innerHTML = safeRows.length ? safeRows.map((row) => `
    <tr>
      <td>${pendingIfNull(row.platform)}</td>
      <td>${formatNumberOrPending(row.dau)}</td>
      <td>${formatNumberOrPending(row.play_uv)}</td>
      <td>${formatNumberOrPending(row.play_count)}</td>
      <td>${formatPercentOrPending(row.play_rate)}</td>
      <td>${row.avg_play_count === null || row.avg_play_count === undefined ? pendingIfNull(null) : row.avg_play_count.toFixed(2)}</td>
    </tr>
  `).join("") : pendingRow(6);
}

function renderHotPlayTable(rows) {
  document.getElementById("hot-play-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${pendingIfNull(row.rank)}</td>
      <td>${pendingIfNull(row.title)}</td>
      <td>${formatNumberOrPending(row.play_count)}</td>
      <td>${formatNumberOrPending(row.play_uv)}</td>
      <td class="${row.day_change === null || row.day_change === undefined ? "" : row.day_change >= 0 ? "up" : "down"}">${formatPercentOrPending(row.day_change, true)}</td>
      <td>${pendingIfNull(row.country_region)}</td>
      <td>${row.content_type === null || row.content_type === undefined ? pendingIfNull(null) : `<span class="tag">${row.content_type}</span>`}</td>
      <td>${pendingIfNull(row.genre)}</td>
      <td>${row.is_new_entry === null || row.is_new_entry === undefined ? pendingIfNull(null) : row.is_new_entry ? '<span class="tag green">新入榜</span>' : "否"}</td>
    </tr>
  `).join("");
}

function renderGenreShare(rows) {
  const block = document.getElementById("genre-share-block");
  if (rows.every((row) => row.status === "pending")) {
    block.textContent = "后续补充：剧种播放占比字段当前为 pending，不伪造数据";
  }
}

function renderHotSearchTable(rows) {
  document.getElementById("hot-search-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${pendingIfNull(row.rank)}</td>
      <td>${pendingIfNull(row.keyword)}</td>
      <td>${pendingIfNull(row.search_count)}</td>
      <td>${pendingIfNull(row.search_uv)}</td>
      <td>${pendingIfNull(row.day_change)}</td>
    </tr>
  `).join("");
}

function renderSearchFunnel(steps) {
  document.getElementById("search-funnel").innerHTML = steps.map((step) => `
    <div class="funnel-step">
      <strong>${step.step_name}</strong>
      <span>后续补充</span>
      <p>pending 占位结构</p>
    </div>
  `).join("");
}

function renderChannelFunnels(rows) {
  document.getElementById("channel-funnel-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.channel}</td>
      <td>${pendingIfNull(row.home_uv)}</td>
      <td>${pendingIfNull(row.channel_uv)}</td>
      <td>${pendingIfNull(row.detail_uv)}</td>
      <td>${pendingIfNull(row.play_uv)}</td>
      <td>${pendingIfNull(row.conversion_rate)}</td>
    </tr>
  `).join("");
}

function renderHomeSections(rows) {
  document.getElementById("home-section-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.section_name}</td>
      <td>${pendingIfNull(row.exposure_pv)}</td>
      <td>${pendingIfNull(row.click_count)}</td>
      <td>${pendingIfNull(row.play_count)}</td>
      <td>${pendingIfNull(row.effective_play_count)}</td>
      <td>${pendingIfNull(row.conversion_rate)}</td>
    </tr>
  `).join("");
}

function renderBanners(rows) {
  document.getElementById("banner-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.component_name}</td>
      <td>${pendingIfNull(row.title)}</td>
      <td>${row.channel}</td>
      <td>${row.position}</td>
      <td>${pendingIfNull(row.exposure_pv)}</td>
      <td>${pendingIfNull(row.click_count)}</td>
      <td>${pendingIfNull(row.play_count)}</td>
      <td>${pendingIfNull(row.effective_play_count)}</td>
    </tr>
  `).join("");
}

function renderPopups(rows) {
  document.getElementById("popup-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${row.component_name}</td>
      <td>${pendingIfNull(row.exposure_pv)}</td>
      <td>${pendingIfNull(row.click_count)}</td>
      <td>${pendingIfNull(row.play_count)}</td>
      <td>${pendingIfNull(row.effective_play_count)}</td>
    </tr>
  `).join("");
}

function renderGuessYouLike(rows) {
  document.getElementById("guess-table").innerHTML = rows.map((row) => `
    <tr>
      <td>${pendingIfNull(row.exposure_count)}</td>
      <td>${pendingIfNull(row.click_count)}</td>
      <td>${pendingIfNull(row.play_count)}</td>
      <td>${pendingIfNull(row.effective_play_count)}</td>
      <td>${pendingIfNull(row.conversion_rate)}</td>
    </tr>
  `).join("");
}

function statusText(status) {
  return { confirmed: "已确认", calculated: "计算", pending: "后续补充" }[status] || status;
}

function pendingIfNull(value) {
  return value === null || value === undefined ? '<span class="pending-text">后续补充</span>' : value;
}

function formatValue(value, unit) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "后续补充";
  if (unit === "%") return formatPercent(value);
  if (unit === "次/人") return value.toFixed(2);
  return `${formatNumber(value)}${unit}`;
}

function formatNumber(value) {
  return Number(value).toLocaleString("zh-CN");
}

function formatNumberOrPending(value) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? pendingIfNull(null)
    : formatNumber(value);
}

function formatPercentOrPending(value, signed = false) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? pendingIfNull(null)
    : formatPercent(value, signed);
}

function pendingRow(columns) {
  return `<tr><td colspan="${columns}"><span class="pending-text">后续补充</span></td></tr>`;
}

function compactNumber(value) {
  if (value >= 10000) return `${Math.round(value / 10000)}万`;
  return value;
}

function formatPercent(value, signed = false) {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(1)}%`;
}
