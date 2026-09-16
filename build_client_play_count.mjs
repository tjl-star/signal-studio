import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/tjldq/Desktop/播放";
const raw = JSON.parse((await fs.readFile("client_play_counts.json", "utf8")).replace(/^\uFEFF/, ""));
const groups = ["安卓", "iOS", "M站"];
const data = Object.fromEntries(groups.map((name) => [name, raw[name][0].value]));
const dates = data[groups[0]].map((row) => row.date);
const rows = [["日期", ...groups], ...dates.map((date, i) => [date, ...groups.map((name) => data[name][i].total_avg_play_count)])];

await fs.mkdir(outputDir, { recursive: true });
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("客户端拆分");
sheet.showGridLines = false;
sheet.getRange("A1:D31").values = rows;
sheet.getRange("A1:D1").format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A2:A31").format.numberFormat = "yyyy-mm-dd";
sheet.getRange("B2:D31").format.numberFormat = "0.0000";
sheet.getRange("A1:D31").format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
sheet.getRange("A1:A31").format.columnWidth = 16;
sheet.getRange("B1:D31").format.columnWidth = 14;
sheet.getRange("A1:D31").format.rowHeight = 20;
sheet.freezePanes.freezeRows(1);
sheet.tables.add("A1:D31", true, "客户端人均播放次数表");

const check = await workbook.inspect({ kind: "table", range: "客户端拆分!A1:D6", include: "values,formulas", tableMaxRows: 6, tableMaxCols: 4 });
console.log(check.ndjson);
const preview = await workbook.render({ sheetName: "客户端拆分", range: "A1:D31", scale: 1, format: "png" });
await fs.writeFile(`${outputDir}/客户端拆分预览.png`, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/近30天人均播放次数_客户端拆分.xlsx`);
console.log(`${outputDir}/近30天人均播放次数_客户端拆分.xlsx`);
