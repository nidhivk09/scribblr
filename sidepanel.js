// sidepanel.js

// ─── DOM References ──────────────────────────────────────────────
const editor      = document.getElementById("notes-editor");
const noteTabsEl  = document.getElementById("note-tabs");
const btnNewNote  = document.getElementById("btn-new-note");
const btnTheme    = document.getElementById("btn-theme");
const btnCopy     = document.getElementById("btn-copy");
const btnClear    = document.getElementById("btn-clear");
const fmtBold     = document.getElementById("fmt-bold");
const fmtItalic   = document.getElementById("fmt-italic");
const fmtUnderline= document.getElementById("fmt-underline");
const fmtBullet   = document.getElementById("fmt-bullet");
const fmtHeading  = document.getElementById("fmt-heading");
const statusMsg   = document.getElementById("status-msg");
const charCount   = document.getElementById("char-count");

// ─── App State ───────────────────────────────────────────────────

let state = {
  notes: [],
  activeNoteId: null,
  theme: "light"
};

let saveTimeout = null; // Used for debounced saving




async function init() {
 
  const saved = await chrome.storage.local.get(["notes", "activeNoteId", "theme"]);

  
  if (!saved.notes || saved.notes.length === 0) {
    const defaultNote = createNewNoteObject("Note 1");
    state.notes = [defaultNote];
    state.activeNoteId = defaultNote.id;
  } else {
    state.notes = saved.notes;
    state.activeNoteId = saved.activeNoteId || saved.notes[0].id;
  }


  state.theme = saved.theme || "light";
  applyTheme(state.theme);


  renderTabs();
  loadActiveNote();
}



function createNewNoteObject(title = "New Note") {
  return {
    id: `note_${Date.now()}`,
    title,
    content: ""
  };
}


function getActiveNote() {
  return state.notes.find(n => n.id === state.activeNoteId);
}


function switchToNote(noteId) {
  
  saveCurrentEditorContent();

  state.activeNoteId = noteId;
  renderTabs();
  loadActiveNote();

  
  chrome.storage.local.set({ activeNoteId: noteId });
}


function loadActiveNote() {
  const note = getActiveNote();
  if (!note) return;
  editor.value = note.content;
  updateCharCount();
  editor.focus();
}


function saveCurrentEditorContent() {
  const note = getActiveNote();
  if (!note) return;
  note.content = editor.value;

  // Auto-generate title from first line of note content
  const firstLine = editor.value.split("\n")[0].trim();
  if (firstLine.length > 0) {
    note.title = firstLine.substring(0, 20) + (firstLine.length > 20 ? "…" : "");
  } else {
    note.title = "Untitled";
  }
}

// Creates a new blank note and switches to it
function addNewNote() {
  saveCurrentEditorContent();
  const note = createNewNoteObject(`Note ${state.notes.length + 1}`);
  state.notes.push(note);
  state.activeNoteId = note.id;
  renderTabs();
  loadActiveNote();
  saveToStorage();
}


function deleteNote(noteId) {
  if (state.notes.length === 1) {
    showStatus("Can't delete your last note!");
    return;
  }

  const confirmed = confirm("Delete this note? This can't be undone.");
  if (!confirmed) return;

  state.notes = state.notes.filter(n => n.id !== noteId);

  if (state.activeNoteId === noteId) {
    state.activeNoteId = state.notes[0].id;
    loadActiveNote();
  }

  renderTabs();
  saveToStorage();
}

function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveCurrentEditorContent();
    saveToStorage();
  }, 500);
}

function saveToStorage() {
  chrome.storage.local.set({
    notes: state.notes,
    activeNoteId: state.activeNoteId
  }, () => {
    
    showStatus("Saved ✓");
    renderTabs(); 
  });
}



function renderTabs() {
  noteTabsEl.innerHTML = ""; 

  state.notes.forEach(note => {
    const tab = document.createElement("button");
    tab.className = `note-tab ${note.id === state.activeNoteId ? "active" : ""}`;
    tab.title = note.title;

    
    const label = document.createElement("span");
    label.textContent = note.title;

   
    const closeBtn = document.createElement("span");
    closeBtn.className = "tab-close";
    closeBtn.textContent = "×";
    closeBtn.title = "Delete note";

    
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      deleteNote(note.id);
    });

    tab.appendChild(label);
    tab.appendChild(closeBtn);

    
    tab.addEventListener("click", () => switchToNote(note.id));

    noteTabsEl.appendChild(tab);
  });
}


function updateCharCount() {
  const len = editor.value.length;
  charCount.textContent = `${len.toLocaleString()} char${len !== 1 ? "s" : ""}`;
}


let statusTimeout = null;
function showStatus(msg, duration = 2000) {
  statusMsg.textContent = msg;
  statusMsg.className = "status-msg saved";
  clearTimeout(statusTimeout);
  statusTimeout = setTimeout(() => {
    statusMsg.textContent = "";
    statusMsg.className = "status-msg";
  }, duration);
}



function wrapSelection(prefix, suffix = prefix) {
  const start = editor.selectionStart;
  const end   = editor.selectionEnd;
  const selected = editor.value.substring(start, end);

  const wrapped = `${prefix}${selected}${suffix}`;

  
  editor.setRangeText(wrapped, start, end, "select");
  editor.focus();

  
  if (start === end) {
    editor.selectionStart = start + prefix.length;
    editor.selectionEnd   = start + prefix.length;
  }

  debouncedSave();
}


function prependToLines(prefix) {
  const start = editor.selectionStart;
  const end   = editor.selectionEnd;

  const selectedText = editor.value.substring(start, end);
  const lines = selectedText.split("\n");

  
  const allHavePrefix = lines.every(l => l.startsWith(prefix));
  const result = allHavePrefix
    ? lines.map(l => l.substring(prefix.length)).join("\n")
    : lines.map(l => `${prefix}${l}`).join("\n");

  editor.setRangeText(result, start, end, "select");
  editor.focus();
  debouncedSave();
}




function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    btnTheme.textContent = "☀️";
  } else {
    document.body.classList.remove("dark");
    btnTheme.textContent = "🌙";
  }
}

function toggleTheme() {
  state.theme = state.theme === "light" ? "dark" : "light";
  applyTheme(state.theme);
  
  chrome.storage.local.set({ theme: state.theme });
}



editor.addEventListener("input", () => {
  updateCharCount();
  debouncedSave();
});

// Keyboard shortcuts inside the editor
editor.addEventListener("keydown", (e) => {
  // Ctrl+B → Bold
  if (e.ctrlKey && e.key === "b") {
    e.preventDefault();
    wrapSelection("**");
  }
  // Ctrl+I → Italic
  if (e.ctrlKey && e.key === "i") {
    e.preventDefault();
    wrapSelection("_");
  }
  // Ctrl+U → Underline (using HTML-like marker since plain text)
  if (e.ctrlKey && e.key === "u") {
    e.preventDefault();
    wrapSelection("__");
  }
  // Tab → insert 2 spaces instead of losing focus
  if (e.key === "Tab") {
    e.preventDefault();
    const start = editor.selectionStart;
    editor.setRangeText("  ", start, start, "end");
    debouncedSave();
  }
});

// Toolbar buttons
btnNewNote.addEventListener("click", addNewNote);
btnTheme.addEventListener("click", toggleTheme);

// Formatting bar buttons
fmtBold.addEventListener("click",      () => wrapSelection("**"));
fmtItalic.addEventListener("click",    () => wrapSelection("_"));
fmtUnderline.addEventListener("click", () => wrapSelection("__"));
fmtBullet.addEventListener("click",    () => prependToLines("• "));
fmtHeading.addEventListener("click",   () => prependToLines("# "));

// Copy button — copies the full note content to clipboard
btnCopy.addEventListener("click", async () => {
  await navigator.clipboard.writeText(editor.value);
  showStatus("Copied to clipboard! 📋");
});

// Clear button — clears the current note with confirmation
btnClear.addEventListener("click", () => {
  if (!editor.value) return;
  const confirmed = confirm("Clear this note? This can't be undone.");
  if (!confirmed) return;

  editor.value = "";
  const note = getActiveNote();
  if (note) note.content = "";
  updateCharCount();
  saveToStorage();
  showStatus("Note cleared");
});



init();
