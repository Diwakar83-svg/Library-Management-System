# Library Management Backend

Spring Boot REST API for the library app. It uses PostgreSQL, Java 21, Spring Data JPA, and session-based authentication.

## Create the PostgreSQL database

The app can create its tables, but PostgreSQL databases must exist first. In pgAdmin, connect to the server, select the default `postgres` database, open **Tools > Query Tool**, and run [`sql/create-database.sql`](./sql/create-database.sql) once:

```sql
CREATE DATABASE library_db OWNER postgres;
```

## Configure the first admin

The public registration endpoint is intentionally restricted to admins. Set both variables before starting the backend to create the first admin account:

```powershell
$env:LIBRARY_ADMIN_USERNAME = "admin"
$env:LIBRARY_ADMIN_PASSWORD = "replace-with-a-unique-password-of-at-least-12-characters"
$env:DATABASE_USERNAME = "postgres"
$env:DATABASE_PASSWORD = "your-postgres-password"
```

If you leave the admin variables unset, configure them and restart to create an admin. Existing usernames are not overwritten.

## Run and test

```powershell
.\mvnw.cmd spring-boot:run
```

In another terminal:

```powershell
.\mvnw.cmd test
```

The API listens on `http://localhost:8080`. PostgreSQL connection settings can be overridden with `DATABASE_URL`, `DATABASE_USERNAME`, and `DATABASE_PASSWORD`. `FINE_PER_DAY` sets the late-return fine per day (default `1.00`).

Alternatively, if Docker is installed, start the included local PostgreSQL service with `docker compose up -d`. The Compose service creates `library_db` using the `library_user` account; in that case, leave `DATABASE_USERNAME` unset and set `DATABASE_PASSWORD` to the same value used by Compose.

## Authentication

The frontend should send credentialed requests and keep the `JSESSIONID` session cookie. Before any `POST`, `PUT`, or `DELETE`, fetch a CSRF token:

```http
GET /api/auth/csrf
```

Send the returned token in the `X-XSRF-TOKEN` header for the login, registration, and other state-changing requests. Login with:

```json
{ "username": "admin", "password": "your-password" }
```

Registration creates librarian accounts and requires an authenticated admin session. Passwords are stored as BCrypt hashes. `POST /api/auth/logout` ends the current session.

## API

All routes below except `/api/auth/csrf` and `/api/auth/login` require authentication.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/register` | Admin creates a librarian |
| GET | `/api/auth/me` | Current account |
| POST | `/api/auth/logout` | Sign out |
| GET, POST | `/api/books` | List/search (`?q=`), create books |
| PUT, DELETE | `/api/books/{id}` | Update/delete books |
| GET, POST | `/api/students` | List/search (`?q=`), register students |
| PUT, DELETE | `/api/students/{id}` | Update/delete students |
| GET | `/api/issues` | Issue history |
| POST | `/api/issues` | Issue a book |
| POST | `/api/issues/{id}/return` | Return a book and calculate its fine |
| GET | `/api/dashboard` | Inventory, student, active issue, and overdue totals |

Book issue requests use `bookId`, `studentId`, and a future `dueDate` (`YYYY-MM-DD`). Issue/return operations update available stock in the same database transaction. Book and student records with issue history cannot be deleted.

Spring JPA updates the local schema automatically (`ddl-auto=update`). Use a migration tool before deploying to production.
