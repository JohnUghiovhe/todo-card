const DESCRIPTION_THRESHOLD = 120;
const TIME_REFRESH_MS = 30000;

const initialTask = {
  title: "Ship onboarding card redesign",
  description:
    "Finalize typography scale, spacing tokens, and responsive behavior for the first-run experience card. Add interaction polish, ensure the layout is resilient at small and large viewports, and keep the component accessible for keyboard and screen-reader users.",
  priority: "High",
  dueDate: new Date("2026-04-16T18:00:00.000Z"),
  status: "Pending",
  expanded: false,
};

const state = {
  title: initialTask.title,
  description: initialTask.description,
  priority: initialTask.priority,
  dueDate: new Date(initialTask.dueDate.getTime()),
  status: initialTask.status,
  expanded: initialTask.expanded,
  isEditing: false,
};

const card = document.querySelector('[data-testid="test-todo-card"]');
const title = document.querySelector('[data-testid="test-todo-title"]');
const priorityBadge = document.querySelector('[data-testid="test-todo-priority"]');
const priorityIndicator = document.querySelector('[data-testid="test-todo-priority-indicator"]');
const descriptionPreview = document.querySelector('[data-testid="test-todo-description"]');
const collapsibleSection = document.querySelector('[data-testid="test-todo-collapsible-section"]');
const timeRemainingEl = document.querySelector('[data-testid="test-todo-time-remaining"]');
const overdueIndicator = document.querySelector('[data-testid="test-todo-overdue-indicator"]');
const dueDateEl = document.querySelector('[data-testid="test-todo-due-date"]');
const checkbox = document.querySelector('[data-testid="test-todo-complete-toggle"]');
const statusSelect = document.querySelector('[data-testid="test-todo-status-control"]');
const expandToggle = document.querySelector('[data-testid="test-todo-expand-toggle"]');
const editButton = document.querySelector('[data-testid="test-todo-edit-button"]');
const deleteButton = document.querySelector('[data-testid="test-todo-delete-button"]');
const editForm = document.querySelector('[data-testid="test-todo-edit-form"]');
const editTitleInput = document.querySelector('[data-testid="test-todo-edit-title-input"]');
const editDescriptionInput = document.querySelector('[data-testid="test-todo-edit-description-input"]');
const editPrioritySelect = document.querySelector('[data-testid="test-todo-edit-priority-select"]');
const editDueDateInput = document.querySelector('[data-testid="test-todo-edit-due-date-input"]');
const saveButton = document.querySelector('[data-testid="test-todo-save-button"]');
const cancelButton = document.querySelector('[data-testid="test-todo-cancel-button"]');

let timeIntervalId = null;

function formatDueDate(date) {
  return `Due ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date)}`;
}

function formatDateTimeLocal(date) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function pluralize(value, singular, plural) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function getCollapsedDescription(text) {
  if (text.length <= DESCRIPTION_THRESHOLD) {
    return text;
  }

  return `${text.slice(0, DESCRIPTION_THRESHOLD).trimEnd()}…`;
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

function getPriorityClass(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function syncPriorityUI() {
  const priorityClass = getPriorityClass(state.priority);

  priorityBadge.textContent = state.priority;
  priorityBadge.className = `priority ${priorityClass}`;
  priorityBadge.setAttribute("aria-label", `${state.priority} priority`);

  priorityIndicator.className = `priority-indicator is-${state.priority.toLowerCase()}`;
  card.classList.remove("is-low", "is-medium", "is-high");
  card.classList.add(`is-${state.priority.toLowerCase()}`);
}

function syncStatusUI() {
  checkbox.checked = state.status === "Done";
  statusSelect.value = state.status;

  const statusClasses = ["status-pending", "status-in-progress", "status-done"];
  statusClasses.forEach((className) => statusSelect.classList.remove(className));

  if (state.status === "Done") {
    statusSelect.classList.add("status-done");
  } else if (state.status === "In Progress") {
    statusSelect.classList.add("status-in-progress");
  } else {
    statusSelect.classList.add("status-pending");
  }

  statusSelect.setAttribute("aria-label", `Task status, ${state.status}`);

  title.classList.toggle("is-complete", state.status === "Done");
  descriptionPreview.classList.toggle("is-complete", state.status === "Done");
  collapsibleSection.classList.toggle("is-complete", state.status === "Done");

  card.classList.remove("is-done", "is-in-progress");
  card.classList.toggle("is-done", state.status === "Done");
  card.classList.toggle("is-in-progress", state.status === "In Progress");

  if (state.status === "Done") {
    timeRemainingEl.textContent = "Completed";
    overdueIndicator.hidden = true;
    card.classList.remove("is-overdue");
    stopTimeUpdates();
    return;
  }

  startTimeUpdates();
}

function syncDescriptionUI() {
  const isLongDescription = state.description.length > DESCRIPTION_THRESHOLD;
  const collapsedText = getCollapsedDescription(state.description);

  descriptionPreview.hidden = isLongDescription && state.expanded;
  descriptionPreview.textContent = isLongDescription ? collapsedText : state.description;
  collapsibleSection.hidden = !isLongDescription || !state.expanded;
  expandToggle.hidden = !isLongDescription;
  expandToggle.setAttribute("aria-expanded", String(state.expanded));
  expandToggle.textContent = state.expanded ? "Collapse" : "Expand";

  const expandedContent = collapsibleSection.querySelector(".collapsible-content");
  if (expandedContent) {
    expandedContent.textContent = state.description;
  }
}

function syncDueDateUI() {
  dueDateEl.textContent = formatDueDate(state.dueDate);
  editDueDateInput.value = formatDateTimeLocal(state.dueDate);
}

function refreshTimeDisplay() {
  if (state.status === "Done") {
    timeRemainingEl.textContent = "Completed";
    overdueIndicator.hidden = true;
    card.classList.remove("is-overdue");
    return;
  }

  const remainingText = getTimeRemainingText(state.dueDate);
  const isOverdue = state.dueDate.getTime() < Date.now() - 60 * 1000;

  timeRemainingEl.textContent = remainingText;
  overdueIndicator.hidden = !isOverdue;
  card.classList.toggle("is-overdue", isOverdue);
}

function startTimeUpdates() {
  if (timeIntervalId !== null) {
    refreshTimeDisplay();
    return;
  }

  refreshTimeDisplay();
  timeIntervalId = window.setInterval(refreshTimeDisplay, TIME_REFRESH_MS);
}

function stopTimeUpdates() {
  if (timeIntervalId === null) {
    refreshTimeDisplay();
    return;
  }

  window.clearInterval(timeIntervalId);
  timeIntervalId = null;
  refreshTimeDisplay();
}

function renderCard() {
  title.textContent = state.title;
  syncPriorityUI();
  syncStatusUI();
  syncDescriptionUI();
  syncDueDateUI();
  refreshTimeDisplay();
}

function populateEditForm() {
  editTitleInput.value = state.title;
  editDescriptionInput.value = state.description;
  editPrioritySelect.value = state.priority;
  editDueDateInput.value = formatDateTimeLocal(state.dueDate);
}

function openEditMode() {
  state.isEditing = true;
  populateEditForm();
  editForm.hidden = false;
  window.requestAnimationFrame(() => {
    editTitleInput.focus();
  });
}

function closeEditMode() {
  state.isEditing = false;
  editForm.hidden = true;
  editButton.focus();
}

function commitEditForm() {
  const nextTitle = editTitleInput.value.trim();
  const nextDescription = editDescriptionInput.value.trim();
  const nextPriority = editPrioritySelect.value;
  const nextDueDate = new Date(editDueDateInput.value);

  if (nextTitle) {
    state.title = nextTitle;
  }

  if (nextDescription) {
    state.description = nextDescription;
  }

  if (["Low", "Medium", "High"].includes(nextPriority)) {
    state.priority = nextPriority;
  }

  if (!Number.isNaN(nextDueDate.getTime())) {
    state.dueDate = nextDueDate;
  }

  state.expanded = state.description.length > DESCRIPTION_THRESHOLD ? state.expanded : false;
  renderCard();
  closeEditMode();
}

checkbox.addEventListener("change", () => {
  state.status = checkbox.checked ? "Done" : "Pending";
  renderCard();
});

statusSelect.addEventListener("change", () => {
  state.status = statusSelect.value;
  renderCard();
});

expandToggle.addEventListener("click", () => {
  state.expanded = !state.expanded;
  syncDescriptionUI();
});

editButton.addEventListener("click", () => {
  console.log("edit clicked");
  openEditMode();
});

deleteButton.addEventListener("click", () => {
  alert("Delete clicked");
});

editForm.addEventListener("submit", (event) => {
  event.preventDefault();
  commitEditForm();
});

cancelButton.addEventListener("click", () => {
  populateEditForm();
  closeEditMode();
});

editTitleInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    populateEditForm();
    closeEditMode();
  }
});

renderCard();