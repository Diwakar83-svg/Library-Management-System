import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
const ROUTES = {
  books: "/api/books",
  students: "/api/students",
  issues: "/api/issues",
  csrf: "/api/auth/csrf",
  login: "/api/auth/login",
  register: "/api/auth/register",
};

const PREVIEW_BOOKS = [
  { book_id: "preview-1", title: "The Garden of Small Beginnings", author: "Abbi Waxman", category: "Fiction", quantity: 6 },
  { book_id: "preview-2", title: "The Midnight Library", author: "Matt Haig", category: "Fiction", quantity: 4 },
  { book_id: "preview-3", title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", quantity: 3 },
  { book_id: "preview-4", title: "The Design of Everyday Things", author: "Don Norman", category: "Design", quantity: 5 },
  { book_id: "preview-5", title: "Educated", author: "Tara Westover", category: "Biography", quantity: 2 },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: "▦" },
  { id: "books", label: "Books", icon: "▤" },
  { id: "students", label: "Students", icon: "♙" },
  { id: "issues", label: "Issue & return", icon: "⇄" },
];

async function responseBody(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json") ? response.json() : response.text();
}

function messageFrom(body, fallback) {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") return body.message ?? body.error ?? fallback;
  return fallback;
}

function recordsFrom(body) {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  for (const key of ["content", "items", "results", "data", "books", "students", "issuedBooks"]) {
    if (Array.isArray(body[key])) return body[key];
  }
  return [];
}

async function apiRequest(path, { method = "GET", body, csrf = false } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  if (csrf) {
    const csrfResponse = await fetch(`${API_BASE_URL}${ROUTES.csrf}`, { credentials: "include" });
    const csrfBody = await responseBody(csrfResponse);
    if (!csrfResponse.ok) {
      throw new Error(messageFrom(csrfBody, "Could not obtain a CSRF token."));
    }
    if (typeof csrfBody?.token !== "string" || !csrfBody.token) {
      throw new Error("The server did not return a CSRF token.");
    }
    headers["X-XSRF-TOKEN"] = csrfBody.token;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const result = await responseBody(response);
  if (!response.ok) {
    throw new Error(messageFrom(result, `Request failed (${response.status}).`));
  }
  return result;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function entityId(item, type) {
  return item.id ?? item[`${type}_id`] ?? item[`${type}Id`];
}

function displayDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function Icon({ name }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1zM16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.6v1" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  };
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("ADMIN");
  const [form, setForm] = useState({ name: "", email: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const payload = mode === "login"
        ? { username: form.username, password: form.password }
        : { ...form, role };
      await apiRequest(mode === "login" ? ROUTES.login : ROUTES.register, {
        method: "POST",
        body: payload,
        csrf: true,
      });
      if (mode === "register") {
        setMode("login");
        setForm((current) => ({ ...current, password: "" }));
        setError("Registration completed. Sign in with your new account.");
      } else {
        onLogin(form.username);
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-symbol"><Icon name="book" /></div>
        <p className="overline">THE READING ROOM</p>
        <h1>{mode === "login" ? "Welcome back" : "Join your library"}</h1>
        <p className="auth-subtitle">A thoughtful space to manage your library.</p>
        <div className="auth-tabs" role="tablist">
          <button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setError(""); }} role="tab" type="button">Sign in</button>
          <button className={mode === "register" ? "selected" : ""} onClick={() => { setMode("register"); setError(""); }} role="tab" type="button">Register</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === "register" && <>
            <label>Full name<input autoComplete="name" onChange={(event) => setForm({ ...form, name: event.target.value })} required value={form.name} /></label>
            <label>Email<input autoComplete="email" onChange={(event) => setForm({ ...form, email: event.target.value })} required type="email" value={form.email} /></label>
            <label>Account role<select onChange={(event) => setRole(event.target.value)} value={role}><option value="ADMIN">Admin</option><option value="LIBRARIAN">Librarian</option></select></label>
          </>}
          <label>Username<input autoComplete="username" onChange={(event) => setForm({ ...form, username: event.target.value })} required value={form.username} /></label>
          <label>Password<input autoComplete={mode === "login" ? "current-password" : "new-password"} onChange={(event) => setForm({ ...form, password: event.target.value })} required type="password" value={form.password} /></label>
          {error && <p className={error.startsWith("Registration completed") ? "notice" : "form-error"} role="alert">{error}</p>}
          <button className="primary-button auth-submit" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in to dashboard" : "Create account"} <Icon name="arrow" /></button>
        </form>
        <p className="auth-footnote">Protected library staff access</p>
      </section>
    </main>
  );
}

function Field({ label, children }) {
  return <label className="field">{label}{children}</label>;
}

function Modal({ title, onClose, children }) {
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section aria-labelledby="modal-title" aria-modal="true" className="modal" role="dialog">
      <div className="modal-heading"><h2 id="modal-title">{title}</h2><button className="icon-button" onClick={onClose} type="button" aria-label="Close">×</button></div>
      {children}
    </section>
  </div>;
}

function App() {
  const [username, setUsername] = useState("");
  const [section, setSection] = useState("dashboard");
  const [books, setBooks] = useState([]);
  const [previewBooks, setPreviewBooks] = useState(false);
  const [students, setStudents] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState("");
  const [editing, setEditing] = useState(null);
  const [actionError, setActionError] = useState("");
  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "", quantity: "1" });
  const [studentForm, setStudentForm] = useState({ name: "", email: "", phone: "" });
  const [issueForm, setIssueForm] = useState({ book_id: "", student_id: "", issue_date: todayString(), due_date: dateAfter(14) });

  const loadData = useCallback(async () => {
    setBusy(true);
    setLoadError("");
    const results = await Promise.allSettled([
      apiRequest(ROUTES.books),
      apiRequest(ROUTES.students),
      apiRequest(ROUTES.issues),
    ]);
    const errors = [];
    if (results[0].status === "fulfilled") {
      const loadedBooks = recordsFrom(results[0].value);
      setPreviewBooks(loadedBooks.length === 0);
      setBooks(loadedBooks.length ? loadedBooks : PREVIEW_BOOKS);
    } else {
      setPreviewBooks(false);
      setBooks([]);
      errors.push(`Books: ${results[0].reason.message}`);
    }
    if (results[1].status === "fulfilled") setStudents(recordsFrom(results[1].value));
    else errors.push(`Students: ${results[1].reason.message}`);
    if (results[2].status === "fulfilled") setIssues(recordsFrom(results[2].value));
    else errors.push(`Issues: ${results[2].reason.message}`);
    if (errors.length) setLoadError(errors.join(" · "));
    setBusy(false);
  }, []);

  useEffect(() => {
    if (username) loadData();
  }, [username, loadData]);

  const activeIssues = useMemo(() => issues.filter((item) => !item.return_date && !item.returnDate), [issues]);
  const overdueIssues = activeIssues.filter((item) => new Date(item.due_date ?? item.dueDate) < new Date(`${todayString()}T00:00:00`));
  const availableCopies = books.reduce((total, item) => total + Math.max(0, Number(item.available_quantity ?? item.availableQuantity ?? item.quantity ?? 0)), 0);

  async function saveBook(event) {
    event.preventDefault();
    const id = editing && entityId(editing, "book");
    console.log("Editing book:", editing);
    console.log("Book ID:", id);
    const hasId = id !== null && id !== undefined;

const path = hasId
    ? `${ROUTES.books}/${encodeURIComponent(id)}`
    : ROUTES.books;
    console.log("API Request Path:", path);
    await runAction(async () => {
      await apiRequest(path, { method: hasId ? "PUT" : "POST", body: { ...bookForm, quantity: Number(bookForm.quantity) }, csrf: true });
      setModal("");
      await loadData();
    });
  }

  async function saveStudent(event) {
  event.preventDefault();

  const id = editing && entityId(editing, "student");
  const hasId = id !== null && id !== undefined;

  const path = hasId
    ? `${ROUTES.students}/${encodeURIComponent(id)}`
    : ROUTES.students;

  await runAction(async () => {
    await apiRequest(path, {
      method: hasId ? "PUT" : "POST",
      body: studentForm,
      csrf: true
    });

    setModal("");
    await loadData();
  });
}

  async function deleteItem(type, item) {
    const id = entityId(item, type);
    if (id === undefined) {
      setActionError(`Cannot delete this ${type}: the API response did not include its ID.`);
      return;
    }
    if (!window.confirm(`Delete this ${type}? This cannot be undone.`)) return;
    await runAction(async () => {
      await apiRequest(`${ROUTES[`${type}s`]}/${encodeURIComponent(id)}`, { method: "DELETE", csrf: true });
      await loadData();
    });
  }

  async function issueBook(event) {
  event.preventDefault();

  const payload = {
    bookId: Number(issueForm.book_id),
    studentId: Number(issueForm.student_id),
    issueDate: issueForm.issue_date,
    dueDate: issueForm.due_date
  };

  await runAction(async () => {
    await apiRequest(ROUTES.issues, {
      method: "POST",
      body: payload,
      csrf: true
    });

    setModal("");
    setIssueForm({
      book_id: "",
      student_id: "",
      issue_date: todayString(),
      due_date: dateAfter(14)
    });

    await loadData();
  });
}

  async function returnBook(issue) {
  const id = entityId(issue, "issue");

  if (id === undefined) {
    setActionError("Cannot return this book: the API response did not include an issue ID.");
    return;
  }

  await runAction(async () => {
    const result = await apiRequest(
      `${ROUTES.issues}/${encodeURIComponent(id)}/return`,
      {
        method: "POST",
        body: { return_date: todayString() },
        csrf: true,
      }
    );

    console.log("Return response:", result);

    await loadData();
  });
}
  async function runAction(action) {
    setActionError("");
    try {
      await action();
    } catch (error) {
      setActionError(error.message);
    }
  }

  function openBook(item = null) {
    setEditing(item);

    setBookForm(item ? {
        title: item.title ?? "",
        author: item.author ?? "",
        category: item.category ?? "",
        quantity: String(item.quantity ?? 1),
    } : {
        title: "",
        author: "",
        category: "",
        quantity: "1"
    });

    setActionError("");
    setModal("book");
}
  function openStudent(item = null) {
    setEditing(item);
    setStudentForm(item ? { name: item.name ?? "", email: item.email ?? "", phone: item.phone ?? "" } : { name: "", email: "", phone: "" });
    setActionError("");
    setModal("student");
  }

  function openIssue() {
    setActionError("");
    setModal("issue");
  }

  if (!username) return <Login onLogin={setUsername} />;

  const title = NAV_ITEMS.find((item) => item.id === section)?.label ?? "Dashboard";
  const filteredBooks = books.filter((book) => [book.title, book.author, book.category].some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase())));
  const filteredStudents = students.filter((student) => [student.name, student.email, student.phone].some((value) => String(value ?? "").toLowerCase().includes(query.toLowerCase())));

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="sidebar-brand" href="#" onClick={(event) => { event.preventDefault(); setSection("dashboard"); }}>
        <span className="sidebar-logo"><Icon name="book" /></span><span><strong>Oak & Ink</strong><small>LIBRARY PORTAL</small></span>
      </a>
      <p className="nav-caption">WORKSPACE</p>
      <nav className="main-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => <button className={section === item.id ? "nav-item active" : "nav-item"} key={item.id} onClick={() => { setSection(item.id); setQuery(""); setActionError(""); }} type="button"><span className="nav-icon">{item.icon}</span>{item.label}{item.id === "issues" && overdueIssues.length > 0 && <span className="nav-count">{overdueIssues.length}</span>}</button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="staff-card"><div className="avatar">{username.slice(0, 1).toUpperCase()}</div><div className="staff-info"><strong>{username}</strong><span>Library staff</span></div></div>
        <button className="logout-button" onClick={() => { setUsername(""); setBooks([]); setStudents([]); setIssues([]); }} type="button"><Icon name="logout" /> Sign out</button>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumb">Library <span>/</span> <strong>{title}</strong></div>
        <div className="topbar-right"><span className="today-label">{new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}</span><div className="top-avatar">{username.slice(0, 1).toUpperCase()}</div></div>
      </header>
      <div className="content">
        {loadError && <div className="alert error-banner" role="alert"><span>{loadError}</span><button onClick={loadData} type="button">Retry</button></div>}
        {actionError && <div className="alert error-banner" role="alert"><span>{actionError}</span><button aria-label="Dismiss error" onClick={() => setActionError("")} type="button">×</button></div>}
        {section === "dashboard" && <Dashboard books={books} students={students} issues={issues} activeCount={activeIssues.length} overdueCount={overdueIssues.length} availableCount={availableCopies} busy={busy} setSection={setSection} onIssue={openIssue} />}
        {section === "books" && <Books books={filteredBooks} isPreview={previewBooks} query={query} setQuery={setQuery} onAdd={() => openBook()} onEdit={openBook} onDelete={(item) => deleteItem("book", item)} />}
        {section === "students" && <Students students={filteredStudents} query={query} setQuery={setQuery} onAdd={() => openStudent()} onEdit={openStudent} onDelete={(item) => deleteItem("student", item)} />}
        {section === "issues" && <Issues issues={issues} books={books} students={students} onAdd={openIssue} onReturn={returnBook} />}
      </div>
    </main>

    {modal === "book" && <Modal title={editing ? "Update book" : "Add a book"} onClose={() => setModal("")}><form className="modal-form" onSubmit={saveBook}>
      <Field label="Title"><input autoFocus onChange={(event) => setBookForm({ ...bookForm, title: event.target.value })} required value={bookForm.title} /></Field>
      <Field label="Author"><input onChange={(event) => setBookForm({ ...bookForm, author: event.target.value })} required value={bookForm.author} /></Field>
      <Field label="Category"><input onChange={(event) => setBookForm({ ...bookForm, category: event.target.value })} required value={bookForm.category} /></Field>
      <Field label="Quantity"><input min="0" onChange={(event) => setBookForm({ ...bookForm, quantity: event.target.value })} required type="number" value={bookForm.quantity} /></Field>
      {actionError && <p className="form-error">{actionError}</p>}
      <div className="modal-actions"><button className="secondary-button" onClick={() => setModal("")} type="button">Cancel</button><button className="primary-button" type="submit">{editing ? "Save changes" : "Add book"}</button></div>
    </form></Modal>}
    {modal === "student" && <Modal title={editing ? "Update student" : "Register student"} onClose={() => setModal("")}><form className="modal-form" onSubmit={saveStudent}>
      <Field label="Full name"><input autoFocus onChange={(event) => setStudentForm({ ...studentForm, name: event.target.value })} required value={studentForm.name} /></Field>
      <Field label="Email"><input onChange={(event) => setStudentForm({ ...studentForm, email: event.target.value })} required type="email" value={studentForm.email} /></Field>
      <Field label="Phone"><input onChange={(event) => setStudentForm({ ...studentForm, phone: event.target.value })} required type="tel" value={studentForm.phone} /></Field>
      {actionError && <p className="form-error">{actionError}</p>}
      <div className="modal-actions"><button className="secondary-button" onClick={() => setModal("")} type="button">Cancel</button><button className="primary-button" type="submit">{editing ? "Save changes" : "Register student"}</button></div>
    </form></Modal>}
    {modal === "issue" && <Modal title="Issue a book" onClose={() => setModal("")}><form className="modal-form" onSubmit={issueBook}>
      <Field label="Book"><select onChange={(event) => setIssueForm({ ...issueForm, book_id: event.target.value })} required value={issueForm.book_id}><option value="">Select a book</option>{books.filter((book) => Number(book.available_quantity ?? book.availableQuantity ?? book.quantity ?? 0) > 0).map((book) => <option key={entityId(book, "book")} value={entityId(book, "book")}>{book.title} — {book.author}</option>)}</select></Field>
      <Field label="Student"><select onChange={(event) => setIssueForm({ ...issueForm, student_id: event.target.value })} required value={issueForm.student_id}><option value="">Select a student</option>{students.map((student) => <option key={entityId(student, "student")} value={entityId(student, "student")}>{student.name}</option>)}</select></Field>
      <div className="form-row"><Field label="Issue date"><input onChange={(event) => setIssueForm({ ...issueForm, issue_date: event.target.value })} required type="date" value={issueForm.issue_date} /></Field><Field label="Due date"><input min={issueForm.issue_date} onChange={(event) => setIssueForm({ ...issueForm, due_date: event.target.value })} required type="date" value={issueForm.due_date} /></Field></div>
      {actionError && <p className="form-error">{actionError}</p>}
      <div className="modal-actions"><button className="secondary-button" onClick={() => setModal("")} type="button">Cancel</button><button className="primary-button" disabled={!books.length || !students.length} type="submit">Confirm issue</button></div>
    </form></Modal>}
  </div>;
}

function Dashboard({ books, students, issues, activeCount, overdueCount, availableCount, busy, setSection, onIssue }) {
  const stats = [
    { label: "Book titles", value: books.length, icon: "book", tone: "sage", note: "In your collection" },
    { label: "Available copies", value: availableCount, icon: "book", tone: "blue", note: "Ready to borrow" },
    { label: "Currently issued", value: activeCount, icon: "clock", tone: "gold", note: "With students" },
    { label: "Overdue returns", value: overdueCount, icon: "clock", tone: "rose", note: "Need attention" },
  ];
  const recent = [...issues].sort((a, b) => new Date(b.issue_date ?? b.issueDate ?? 0) - new Date(a.issue_date ?? a.issueDate ?? 0)).slice(0, 5);
  return <section>
    <div className="welcome-row"><div><p className="overline">YOUR LIBRARY AT A GLANCE</p><h1>Good day, librarian.</h1><p className="muted">Here’s what’s happening in your library today.</p></div><button className="primary-button" onClick={onIssue} type="button"><Icon name="plus" /> Issue a book</button></div>
    <div className="stats-grid">{stats.map((stat) => <article className="stat-card" key={stat.label}><div className={`stat-icon ${stat.tone}`}><Icon name={stat.icon} /></div><p>{stat.label}</p><strong>{busy ? "—" : stat.value}</strong><span>{stat.note}</span></article>)}</div>
    <div className="dashboard-grid">
      <section className="panel recent-panel"><div className="panel-heading"><div><p className="overline">RECENT ACTIVITY</p><h2>Latest book loans</h2></div><button className="text-button" onClick={() => setSection("issues")} type="button">View all <Icon name="arrow" /></button></div>
        {recent.length ? <div className="table-wrap"><table><thead><tr><th>Book</th><th>Student</th><th>Issued</th><th>Status</th></tr></thead><tbody>{recent.map((item, index) => <tr key={entityId(item, "issue") ?? index}><td className="strong-cell">{item.book_title ?? item.bookTitle ?? item.book?.title ?? `Book #${item.book_id ?? item.bookId ?? "—"}`}</td><td>{item.student_name ?? item.studentName ?? item.student?.name ?? `Student #${item.student_id ?? item.studentId ?? "—"}`}</td><td>{displayDate(item.issue_date ?? item.issueDate)}</td><td><StatusBadge issue={item} /></td></tr>)}</tbody></table></div> : <EmptyState loading={busy} text="No book loans yet. Issue a book to get started." />}
      </section>
      <section className="panel quick-panel"><p className="overline">QUICK ACTIONS</p><h2>Keep things moving</h2><button className="quick-action" onClick={() => setSection("books")} type="button"><span className="quick-icon"><Icon name="book" /></span><span><strong>Manage books</strong><small>Add titles and update stock</small></span><Icon name="arrow" /></button><button className="quick-action" onClick={() => setSection("students")} type="button"><span className="quick-icon"><Icon name="users" /></span><span><strong>Register a student</strong><small>Keep student details up to date</small></span><Icon name="arrow" /></button><button className="quick-action" onClick={onIssue} type="button"><span className="quick-icon"><Icon name="clock" /></span><span><strong>Issue a book</strong><small>Record a new book loan</small></span><Icon name="arrow" /></button><div className="student-summary"><span className="summary-dot" /><span><strong>{students.length}</strong> registered students</span></div></section>
    </div>
  </section>;
}

function PageHeading({ eyebrow, title, description, buttonLabel, onClick }) {
  return <div className="page-heading"><div><p className="overline">{eyebrow}</p><h1>{title}</h1><p className="muted">{description}</p></div><button className="primary-button" onClick={onClick} type="button"><Icon name="plus" />{buttonLabel}</button></div>;
}

function SearchBox({ value, onChange, placeholder }) {
  return <label className="search-box"><Icon name="search" /><input aria-label="Search" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>;
}

function EmptyState({ loading, text }) {
  return <div className="empty-table"><span className="empty-book"><Icon name="book" /></span><strong>{loading ? "Loading library records…" : "Nothing here yet"}</strong><p>{loading ? "Please wait while records load." : text}</p></div>;
}

function Books({ books, isPreview, query, setQuery, onAdd, onEdit, onDelete }) {
  return <section><PageHeading eyebrow="COLLECTION" title="Book management" description="Build and care for your library collection." buttonLabel="Add a book" onClick={onAdd} />
    {isPreview && <div className="preview-notice" role="status"><span>Preview data</span> These example titles are for display only and aren’t saved in your library.</div>}
    <div className="panel list-panel"><div className="list-toolbar"><div><strong>All books</strong><span className="record-count">{books.length} titles</span></div><SearchBox value={query} onChange={setQuery} placeholder="Search title, author, category…" /></div>
      {books.length ? <div className="table-wrap"><table><thead><tr><th>Book</th><th>Category</th><th>Book ID</th><th>Quantity</th><th>Actions</th></tr></thead><tbody>{books.map((book, index) => <tr key={entityId(book, "book") ?? index}><td><div className="book-cell"><span className="book-cover"><Icon name="book" /></span><span><strong>{book.title ?? "Untitled book"}</strong><small>{book.author ?? "Unknown author"}</small></span></div></td><td><span className="category-chip">{book.category ?? "Uncategorized"}</span></td><td>{isPreview ? "Preview" : entityId(book, "book") ?? "—"}</td><td><span className="quantity">{book.available_quantity ?? book.availableQuantity ?? book.quantity ?? 0}<small> available</small></span></td><td>{isPreview ? <span className="muted">Preview only</span> : <div className="row-actions"><button onClick={() => onEdit(book)} type="button">Edit</button><button className="delete-action" onClick={() => onDelete(book)} type="button">Delete</button></div>}</td></tr>)}</tbody></table></div> : <EmptyState text={query ? "Try a different search term." : "Add your first title to get started."} />}</div>
  </section>;
}

function Students({ students, query, setQuery, onAdd, onEdit, onDelete }) {
  return <section><PageHeading eyebrow="COMMUNITY" title="Student management" description="Keep student profiles and contact details organized." buttonLabel="Register student" onClick={onAdd} />
    <div className="panel list-panel"><div className="list-toolbar"><div><strong>Registered students</strong><span className="record-count">{students.length} students</span></div><SearchBox value={query} onChange={setQuery} placeholder="Search name, email, phone…" /></div>
      {students.length ? <div className="table-wrap"><table><thead><tr><th>Student</th><th>Email</th><th>Phone</th><th>Student ID</th><th>Actions</th></tr></thead><tbody>{students.map((student, index) => <tr key={entityId(student, "student") ?? index}><td><div className="student-cell"><span className="student-avatar">{(student.name ?? "S").slice(0, 1).toUpperCase()}</span><strong>{student.name ?? "Unnamed student"}</strong></div></td><td>{student.email ?? "—"}</td><td>{student.phone ?? "—"}</td><td>{entityId(student, "student") ?? "—"}</td><td><div className="row-actions"><button onClick={() => onEdit(student)} type="button">Edit</button><button className="delete-action" onClick={() => onDelete(student)} type="button">Delete</button></div></td></tr>)}</tbody></table></div> : <EmptyState text={query ? "Try a different search term." : "Register your first student to get started."} />}</div>
  </section>;
}

function statusOf(issue) {
  if (issue.return_date ?? issue.returnDate) return "Returned";
  const due = issue.due_date ?? issue.dueDate;
  return due && new Date(due) < new Date(`${todayString()}T00:00:00`) ? "Overdue" : "Issued";
}

function StatusBadge({ issue }) {
  const status = statusOf(issue);
  return <span className={`status-badge ${status.toLowerCase()}`}>{status}</span>;
}

function Issues({ issues, books, students, onAdd, onReturn }) {
  const names = new Map(books.map((book) => [String(entityId(book, "book")), book.title]));
  const people = new Map(students.map((student) => [String(entityId(student, "student")), student.name]));

  return (
    <section>
      <PageHeading
        eyebrow="CIRCULATION"
        title="Issue & return"
        description="Track loans, due dates, and returned books."
        buttonLabel="Issue a book"
        onClick={onAdd}
      />

      <div className="issue-summary">
        <div>
          <span className="summary-dot issued-dot" />
          <strong>{issues.filter((issue) => statusOf(issue) === "Issued").length}</strong>
          <span>on loan</span>
        </div>
        <div>
          <span className="summary-dot overdue-dot" />
          <strong>{issues.filter((issue) => statusOf(issue) === "Overdue").length}</strong>
          <span>overdue</span>
        </div>
        <div>
          <span className="summary-dot returned-dot" />
          <strong>{issues.filter((issue) => statusOf(issue) === "Returned").length}</strong>
          <span>returned</span>
        </div>
      </div>

      <div className="panel list-panel">
        <div className="list-toolbar">
          <div>
            <strong>Loan register</strong>
            <span className="record-count">{issues.length} records</span>
          </div>
        </div>

        {issues.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Student</th>
                  <th>Issue date</th>
                  <th>Due date</th>
                  <th>Returned</th>
                  <th>Fine</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {issues.map((issue, index) => (
                  <tr key={entityId(issue, "issue") ?? index}>
                    <td className="strong-cell">
                      {issue.book_title ??
                        issue.bookTitle ??
                        issue.book?.title ??
                        names.get(String(issue.book_id ?? issue.bookId)) ??
                        `Book #${issue.book_id ?? issue.bookId ?? "—"}`}
                    </td>

                    <td>
                      {issue.student_name ??
                        issue.studentName ??
                        issue.student?.name ??
                        people.get(String(issue.student_id ?? issue.studentId)) ??
                        `Student #${issue.student_id ?? issue.studentId ?? "—"}`}
                    </td>

                    <td>{displayDate(issue.issue_date ?? issue.issueDate)}</td>

                    <td>{displayDate(issue.due_date ?? issue.dueDate)}</td>

                    <td>{displayDate(issue.return_date ?? issue.returnDate)}</td>

                    <td>
                      {issue.fine != null ? `₹${issue.fine}` : "—"}
                    </td>

                    <td>
                      <StatusBadge issue={issue} />
                    </td>

                    <td>
                      {statusOf(issue) !== "Returned" ? (
                        <button
                          className="return-button"
                          onClick={() => onReturn(issue)}
                          type="button"
                        >
                          Record return
                        </button>
                      ) : (
                        <span className="muted">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState text="Issue a book to a student to start tracking loans." />
        )}
      </div>
    </section>
  );
}
export default App;
