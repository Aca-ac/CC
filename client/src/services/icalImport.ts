export interface ImportedIcsTask {
  title: string;
  dueTime: string;
  description?: string;
  tags: string[];
}

interface IcsEvent {
  summary?: string;
  description?: string;
  dtstart?: string;
}

function unfoldLines(source: string): string[] {
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const unfolded: string[] = [];

  for (const line of lines) {
    if (/^[ \t]/.test(line) && unfolded.length > 0) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line.trimEnd());
    }
  }

  return unfolded.filter(Boolean);
}

function readProperty(line: string): { name: string; value: string } | null {
  const separatorIndex = line.indexOf(":");
  if (separatorIndex < 0) return null;

  const name = line.slice(0, separatorIndex).split(";")[0].toUpperCase();
  const value = line.slice(separatorIndex + 1);
  return { name, value };
}

function decodeIcsText(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function parseIcsDate(value: string): string | null {
  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 0, 0, 0)).toISOString();
  }

  const dateTime = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(value);
  if (!dateTime) return null;

  const [, year, month, day, hour, minute, second, utcSuffix] = dateTime;
  if (utcSuffix) {
    return new Date(
      Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second))
    ).toISOString();
  }

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  ).toISOString();
}

export function parseIcsTasks(source: string): ImportedIcsTask[] {
  const events: IcsEvent[] = [];
  let currentEvent: IcsEvent | null = null;

  for (const rawLine of unfoldLines(source)) {
    const line = rawLine.trim();
    const upperLine = line.toUpperCase();

    if (upperLine === "BEGIN:VEVENT") {
      currentEvent = {};
      continue;
    }

    if (upperLine === "END:VEVENT") {
      if (currentEvent) events.push(currentEvent);
      currentEvent = null;
      continue;
    }

    if (!currentEvent) continue;

    const property = readProperty(line);
    if (!property) continue;

    if (property.name === "SUMMARY") currentEvent.summary = decodeIcsText(property.value);
    if (property.name === "DESCRIPTION") currentEvent.description = decodeIcsText(property.value);
    if (property.name === "DTSTART") currentEvent.dtstart = property.value.trim();
  }

  return events.flatMap((event) => {
    const dueTime = event.dtstart ? parseIcsDate(event.dtstart) : null;
    if (!dueTime) return [];

    return [
      {
        title: event.summary?.trim() || "未命名日程",
        ...(event.description ? { description: event.description } : {}),
        dueTime,
        tags: ["iCal"],
      },
    ];
  });
}
