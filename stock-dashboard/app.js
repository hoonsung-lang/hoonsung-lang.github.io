const viewConfig = {
  "우선순위_TOP": {
    title: "우선순위 TOP",
    subtitle: "투자우선점수 기준 상위 공개 후보",
    sortKey: "투자우선점수",
  },
  "장기투자_후보": {
    title: "장기투자 후보",
    subtitle: "장기투자점수와 품질/현금흐름 중심 후보",
    sortKey: "장기투자점수",
  },
  "선행매매_후보": {
    title: "선행매매 후보",
    subtitle: "선행수급점수와 수급패턴 중심 후보",
    sortKey: "선행수급점수",
  },
  "유명기관_13F증감": {
    title: "유명기관 13F 증감",
    subtitle: "분기 지연 공시 기반 기관수급 요약",
    sortKey: "13F투자후보점수",
  },
  "테마_요약": {
    title: "테마 요약",
    subtitle: "미래산업테마별 후보 수와 평균점수",
    sortKey: "평균점수",
  },
  market: {
    title: "신고가/거래량 급증",
    subtitle: "미국/한국 신고가와 거래량 급증 상위 공개 후보",
    sortKey: "투자우선점수",
  },
};

const preferredColumns = {
  "우선순위_TOP": ["순위", "국가", "구분", "티커", "종목명", "종가", "투자우선점수", "장기투자점수", "선행수급점수", "미래산업테마", "Forward_PER", "Forward_PEG", "목표가상승여력%", "RSI", "리스크뷰"],
  "장기투자_후보": ["국가", "구분", "티커", "종목명", "종가", "투자우선점수", "장기투자점수", "성장점수", "품질점수", "현금흐름점수", "미래산업테마", "Forward_PER", "Forward_PEG", "리스크뷰"],
  "선행매매_후보": ["국가", "구분", "티커", "종목명", "종가", "투자우선점수", "선행수급점수", "수급패턴", "52주고가대비위치%", "거래량배수", "RSI", "미래산업테마", "리스크뷰"],
  "유명기관_13F증감": ["13F선호순위", "티커", "종목명", "13F투자후보점수", "기관수급점수", "Forward_PER", "Forward_PEG", "예상EPS성장률 NextFY%", "왜좋은가", "기관매수추정근거", "데이터매칭"],
  "테마_요약": ["미래산업테마", "후보수", "평균점수", "상위후보"],
  market: ["날짜", "국가", "구분", "티커", "종목명", "종가", "투자우선점수", "선행수급점수", "52주고가대비위치%", "거래량배수", "수급패턴", "미래산업테마", "리스크뷰"],
};

const state = {
  data: null,
  view: "우선순위_TOP",
  sortKey: "투자우선점수",
  sortDir: "desc",
  search: "",
  country: "",
  theme: "",
  score: 0,
};

const table = document.getElementById("dataTable");
const tableTitle = document.getElementById("tableTitle");
const tableSubtitle = document.getElementById("tableSubtitle");
const tableCount = document.getElementById("tableCount");
const searchInput = document.getElementById("searchInput");
const countryFilter = document.getElementById("countryFilter");
const themeFilter = document.getElementById("themeFilter");
const scoreFilter = document.getElementById("scoreFilter");

function numberValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "number") {
    return Number.isInteger(value) ? value.toLocaleString("ko-KR") : value.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
  }
  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rowsForView() {
  const sheets = state.data.sheets;
  if (state.view === "market") {
    return [
      ...sheets["신고가_미국"],
      ...sheets["신고가_한국"],
      ...sheets["거래량급증_미국"],
      ...sheets["거래량급증_한국"],
    ];
  }
  return sheets[state.view] || [];
}

function filteredRows() {
  const query = state.search.trim().toLowerCase();
  const minimumScore = Number(state.score) || 0;
  return rowsForView()
    .filter((row) => {
      const text = `${row["티커"] || ""} ${row["종목명"] || ""}`.toLowerCase();
      const countryOk = !state.country || row["국가"] === state.country;
      const themeOk = !state.theme || row["미래산업테마"] === state.theme;
      const queryOk = !query || text.includes(query);
      const score = numberValue(row["투자우선점수"] ?? row["13F투자후보점수"] ?? row["평균점수"]) ?? 0;
      return countryOk && themeOk && queryOk && score >= minimumScore;
    })
    .sort((a, b) => {
      const aValue = numberValue(a[state.sortKey]);
      const bValue = numberValue(b[state.sortKey]);
      if (aValue !== null || bValue !== null) {
        return state.sortDir === "desc" ? (bValue ?? -Infinity) - (aValue ?? -Infinity) : (aValue ?? Infinity) - (bValue ?? Infinity);
      }
      return state.sortDir === "desc"
        ? String(b[state.sortKey] || "").localeCompare(String(a[state.sortKey] || ""), "ko")
        : String(a[state.sortKey] || "").localeCompare(String(b[state.sortKey] || ""), "ko");
    });
}

function renderKpis() {
  const grid = document.getElementById("kpiGrid");
  grid.innerHTML = state.data.kpis
    .map((item) => `
      <article class="kpi-card">
        <p class="kpi-label">${escapeHtml(item.label)}</p>
        <p class="kpi-value">${escapeHtml(formatValue(item.value))}</p>
        <p class="kpi-note">${escapeHtml(item.note || "")}</p>
      </article>
    `)
    .join("");
}

function fillFilters() {
  const rows = [
    ...state.data.sheets["우선순위_TOP"],
    ...state.data.sheets["장기투자_후보"],
    ...state.data.sheets["선행매매_후보"],
    ...state.data.sheets["신고가_미국"],
    ...state.data.sheets["신고가_한국"],
    ...state.data.sheets["거래량급증_미국"],
    ...state.data.sheets["거래량급증_한국"],
  ];
  const countries = [...new Set(rows.map((row) => row["국가"]).filter(Boolean))].sort();
  const themes = [...new Set(rows.map((row) => row["미래산업테마"]).filter(Boolean))].sort();
  countryFilter.innerHTML = '<option value="">전체</option>' + countries.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
  themeFilter.innerHTML = '<option value="">전체</option>' + themes.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

function renderTable() {
  const config = viewConfig[state.view];
  state.sortKey = state.sortKey || config.sortKey;
  tableTitle.textContent = config.title;
  tableSubtitle.textContent = config.subtitle;

  const rows = filteredRows();
  const columns = preferredColumns[state.view];
  tableCount.textContent = `${rows.length.toLocaleString("ko-KR")} rows`;

  if (!rows.length) {
    table.innerHTML = `<tbody><tr><td class="empty">표시할 데이터가 없습니다.</td></tr></tbody>`;
    return;
  }

  const headers = columns
    .map((column) => {
      const marker = state.sortKey === column ? (state.sortDir === "desc" ? " ↓" : " ↑") : "";
      return `<th data-column="${escapeHtml(column)}">${escapeHtml(column)}${marker}</th>`;
    })
    .join("");
  const body = rows
    .map((row) => `<tr>${columns.map((column) => cellHtml(column, row[column])).join("")}</tr>`)
    .join("");
  table.innerHTML = `<thead><tr>${headers}</tr></thead><tbody>${body}</tbody>`;
}

function cellHtml(column, value) {
  const numeric = numberValue(value);
  const classNames = [];
  if (["투자우선점수", "장기투자점수", "선행수급점수", "13F투자후보점수", "평균점수"].includes(column)) {
    if ((numeric ?? 0) >= 75) classNames.push("score-high");
    else if ((numeric ?? 0) >= 60) classNames.push("score-mid");
  }
  if (column.includes("리스크") && value) classNames.push("risk");
  if (["종목명", "왜좋은가", "기관매수추정근거", "기관별증감내역", "리스크뷰", "상위후보"].includes(column)) classNames.push("text-long");
  return `<td class="${classNames.join(" ")}">${escapeHtml(formatValue(value))}</td>`;
}

function setView(view) {
  state.view = view;
  state.sortKey = viewConfig[view].sortKey;
  state.sortDir = "desc";
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
  renderTable();
}

document.querySelectorAll(".tab-button").forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

table.addEventListener("click", (event) => {
  const header = event.target.closest("th");
  if (!header) return;
  const column = header.dataset.column;
  if (state.sortKey === column) {
    state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
  } else {
    state.sortKey = column;
    state.sortDir = "desc";
  }
  renderTable();
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderTable();
});

countryFilter.addEventListener("change", (event) => {
  state.country = event.target.value;
  renderTable();
});

themeFilter.addEventListener("change", (event) => {
  state.theme = event.target.value;
  renderTable();
});

scoreFilter.addEventListener("input", (event) => {
  state.score = event.target.value;
  renderTable();
});

fetch("./dashboard-data.json")
  .then((response) => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  })
  .then((data) => {
    state.data = data;
    document.getElementById("disclaimer").textContent = data.meta.disclaimer;
    renderKpis();
    fillFilters();
    renderTable();
  })
  .catch((error) => {
    table.innerHTML = `<tbody><tr><td class="empty">데이터를 불러오지 못했습니다: ${escapeHtml(error.message)}</td></tr></tbody>`;
  });
