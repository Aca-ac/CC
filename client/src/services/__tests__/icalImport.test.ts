import { describe, expect, it } from "vitest";
import { parseIcsTasks } from "../icalImport";

describe("parseIcsTasks", () => {
  it("extracts VEVENT summary, date, and description as task import data", () => {
    const tasks = parseIcsTasks(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-1
SUMMARY:算法课
DESCRIPTION:准备笔记\\n带上课本
DTSTART:20260618T103000Z
END:VEVENT
BEGIN:VEVENT
UID:event-2
SUMMARY:整天复习
DTSTART;VALUE=DATE:20260620
END:VEVENT
END:VCALENDAR`);

    expect(tasks).toEqual([
      {
        title: "算法课",
        description: "准备笔记\n带上课本",
        dueTime: "2026-06-18T10:30:00.000Z",
        tags: ["iCal"],
      },
      {
        title: "整天复习",
        dueTime: "2026-06-20T00:00:00.000Z",
        tags: ["iCal"],
      },
    ]);
  });
});
