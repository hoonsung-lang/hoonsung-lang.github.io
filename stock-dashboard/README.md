# 52 Week Highs Dashboard

Static GitHub Pages dashboard generated from:

```text
C:\___AI Workspace\codex_ws\52w_Stock_Analysis\52_week_highs_enriched.xlsx
```

Refresh flow:

```powershell
cd "C:\___AI Workspace\codex_ws\52w_Stock_Analysis"
python .\export_dashboard_data.py --input .\52_week_highs_enriched.xlsx --output .\dashboard-data.json
Copy-Item .\dashboard-data.json "C:\___AI Workspace\codex_ws\hoonsung-lang.github.io\stock-dashboard\dashboard-data.json" -Force
```

Published path:

```text
https://hoonsung-lang.github.io/stock-dashboard/
```
