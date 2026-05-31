@import url("https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap");

:root {
  --bg: #f7f5f0;
  --surface: #ffffff;
  --ink: #1a1814;
  --ink-muted: #6b6760;
  --accent: #c8a96e;
  --accent-soft: #f0e8d8;
  --border: #e8e4dd;
  --user-bg: #1a1814;
  --user-text: #f7f5f0;
  --radius: 16px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: "DM Sans", sans-serif;
  background: var(--bg);
  color: var(--ink);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
