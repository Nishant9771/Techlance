export function analyzeProgress(data: any) {
  const progressPercent =
    (data.completedMilestones / data.totalMilestones) * 100;

  const expectedProgress =
    (data.daysPassed / data.timelineDays) * 100;

  let status: "ON_TRACK" | "DELAYED" | "CRITICAL" = "ON_TRACK";

  if (data.lastActivityDays > 5) {
    status = "CRITICAL";
  } else if (progressPercent < expectedProgress) {
    status = "DELAYED";
  }

  return {
    percent: Math.round(progressPercent),
    expected: Math.round(expectedProgress),
    status
  };
}