const dueDate = new Date("2026-04-16T18:00:00.000Z");

const card = document.querySelector('[data-testid="test-todo-card"]');
const title = document.querySelector('[data-testid="test-todo-title"]');
const status = document.querySelector('[data-testid="test-todo-status"]');
const completeToggle = document.querySelector('[data-testid="test-todo-complete-toggle"]');
const timeRemainingEl = document.querySelector('[data-testid="test-todo-time-remaining"]');
const dueDateEl = document.querySelector('[data-testid="test-todo-due-date"]');
const editButton = document.querySelector('[data-testid="test-todo-edit-button"]');
const deleteButton = document.querySelector('[data-testid="test-todo-delete-button"]');

function formatDueDate(date) {
  return `Due ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short"
  }).format(date)}`;
}

function pluralize(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getTimeRemainingText(targetDate) {
  const now = Date.now();
  const diffMs = targetDate.getTime() - now;
  const absMs = Math.abs(diffMs);
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (absMs < minuteMs) {
    return "Due now!";
  }

  if (diffMs > 0) {
    const days = Math.floor(diffMs / dayMs);
    if (days >= 2) {
      return `Due in ${pluralize(days, "day", "days")}`;
    }
    if (days === 1) {
      return "Due tomorrow";
    }

    const hours = Math.floor(diffMs / hourMs);
    if (hours >= 1) {
      return `Due in ${pluralize(hours, "hour", "hours")}`;
    }

    const minutes = Math.max(1, Math.floor(diffMs / minuteMs));
    return `Due in ${pluralize(minutes, "minute", "minutes")}`;
  }

  const overdueDays = Math.floor(absMs / dayMs);
  if (overdueDays >= 1) {
    return `Overdue by ${pluralize(overdueDays, "day", "days")}`;
  }

  const overdueHours = Math.floor(absMs / hourMs);
  if (overdueHours >= 1) {
    return `Overdue by ${pluralize(overdueHours, "hour", "hours")}`;
  }

  const overdueMinutes = Math.max(1, Math.floor(absMs / minuteMs));
  return `Overdue by ${pluralize(overdueMinutes, "minute", "minutes")}`;
}

function updateRemainingTime() {
  timeRemainingEl.textContent = getTimeRemainingText(dueDate);
}

function updateCompletionState(isComplete) {
  card.classList.toggle("is-complete", isComplete);
  status.textContent = isComplete ? "Done" : "Pending";
  status.classList.toggle("status-done", isComplete);
  status.setAttribute("aria-label", isComplete ? "Done status" : "Pending status");
  title.setAttribute("aria-label", isComplete ? "Completed task" : "Pending task");
}

dueDateEl.textContent = formatDueDate(dueDate);
updateRemainingTime();
setInterval(updateRemainingTime, 30000);

completeToggle.addEventListener("change", (event) => {
  updateCompletionState(Boolean(event.target.checked));
});

editButton.addEventListener("click", () => {
  console.log("edit clicked");
  alert("Edit clicked");
});

deleteButton.addEventListener("click", () => {
  alert("Delete clicked");
});