import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "C:/Users/tjldq/Desktop/播放";
await fs.mkdir(outputDir, { recursive: true });

const rows = [
  ["日期", "人均播放次数"],
  ["2026-07-08", 8.2334], ["2026-07-09", 8.0413], ["2026-07-10", 8.4055],
  ["2026-07-11", 8.6648], ["2026-07-12", 8.2872], ["2026-07-13", 7.6600],
  ["2026-07-14", 7.6156], ["2026-07-15", 7.5755], ["2026-07-16", 8.0018],
  ["2026-07-17", 8.2960], ["2026-07-18", 8.6124], ["2026-07-19", 8.1197],
  ["2026-07-20", 7.3638], ["2026-07-21", 7.5397], ["2026-07-22", 7.6839],
  ["2026-07-23", 7.9951], ["2026-07-24", 8.2582], ["2026-07-25", 8.5778],
  ["2026-07-26", 8.0459], ["2026-07-27", 7.4310], ["2026-07-28", 7.5393],
  ["2026-07-29", 7.7482], ["2026-07-30", 7.8384], ["2026-07-31", 8.6258],
  ["2026-08-01", 8.7439], ["2026-08-02", 8.0980], ["2026-08-03", 7.5829],
  ["2026-08-04", 7.6671], ["2026-08-05", 7.8100], ["2026-08-06", 7.8250],
];

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("人均播放次数");
sheet.showGridLines = false;
sheet.getRange("A1:B31").values = rows;
sheet.getRange("A1:B1").format = {
  fill: "#1F4E78",
  font: { bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange("A2:A31").format.numberFormat = "yyyy-mm-dd";
sheet.getRange("B2:B31").format.numberFormat = "0.0000";
sheet.getRange("A1:B31").format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
sheet.getRange("A1:A31").format.columnWidth = 16;
sheet.getRange("B1:B31").format.columnWidth = 18;
sheet.getRange("A1:B31").format.rowHeight = 20;
sheet.freezePanes.freezeRows(1);
sheet.tables.add("A1:B31", true, "人均播放次数表");

const check = await workbook.inspect({ kind: "table", range: "人均播放次数!A1:B6", include: "values,formulas", tableMaxRows: 6, tableMaxCols: 2 });
console.log(check.ndjson);
const preview = await workbook.render({ sheetName: "人均播放次数", range: "A1:B31", scale: 1, format: "png" });
await fs.writeFile(`${outputDir}/预览.png`, new Uint8Array(await preview.arrayBuffer()));
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(`${outputDir}/近30天人均播放次数.xlsx`);
console.log(`${outputDir}/近30天人均播放次数.xlsx`);
