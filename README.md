# Mini Expense Tracker (App Router)

Log expenses with an amount and a category, and see a running total.
Built the same way as the course's Notes app (Module 11 / 14 edition):
NextAuth.js sign-in, a real **MySQL** database through a connection pool,
secured Route Handlers, the Context API, a dedicated `lib/validation.js`,
and `try/catch` error handling around every database call.

| | Notes app (course example) | This app |
|---|---|---|
| Entity | `{ text }` | `{ description, amount, category }` |
| Validation | Text: required, max 200 characters | **Amount must be a positive number** (plus description and category checks) |
| Secured actions | Add / edit / delete a note | **Add / delete an expense** |
| Extra | — | **Stats widget**: total spent, average per entry, count and total by category |
| Users | One demo user | Two demo users, each with their own expenses |

## Run it

1. **Start MAMP** and confirm MySQL is running.
2. ```bash
   npm install
   cp .env.local.example .env.local
   # replace the placeholder secret with: openssl rand -base64 32
   # check the MYSQL_* values against MAMP's own connection panel
   npm run dev
   ```

On Windows, copy `.env.local.example` to a new file named `.env.local` instead of using `cp`.

Open `http://localhost:3000`. It redirects to `/signin`.

| Username | Password |
| --- | --- |
| `Moo` | `password123` |
| `Jeff` | `password123` |

Nothing to create in MySQL first: the app creates its own database
(`nextjs_expense_tracker`) and `expenses` table on the first request, and adds
some demo expenses for both users.

`npm run db:inspect` prints the table, plus totals by category calculated by MySQL itself.

## Files

```
lib/auth.js                      NextAuth options (demo users Moo, Jeff)
lib/db.js                        MySQL pool, creates the database + table, getAll / create / delete
lib/validation.js                description, AMOUNT, category and id checks
lib/stats.js                     computeStats(): total, average, biggest, by category
app/api/expenses/route.js        GET (list), POST (add)       — secured
app/api/expenses/[id]/route.js   DELETE                       — secured
context/ExpensesContext.jsx      shared expenses state + fetch() calls
components/ExpenseForm.jsx       log an expense
components/ExpenseList.jsx       list + Delete buttons
components/ExpenseStats.jsx      the stats widget
app/dashboard/page.js            checks the session, reads from MySQL, renders everything
scripts/inspect-db.js            npm run db:inspect
```

## The database: `lib/db.js`

```sql
CREATE TABLE IF NOT EXISTS expenses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(50)    NOT NULL,
  description VARCHAR(100)   NOT NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  category    VARCHAR(30)    NOT NULL,
  created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
)
```

`amount` is `DECIMAL(10, 2)`, not `FLOAT`, so money is stored exactly (12.50
stays 12.50). Every query includes `WHERE user_id = ?`, so Moo and Jeff only
ever see and delete their own expenses.

## Validation: amount must be a positive number → `lib/validation.js`

The Notes app only ever checked text. An amount is harder: it can arrive as a
number (`12.5`) or as text typed in a form (`"12.50"`), and many things that
*look* like numbers shouldn't be accepted.

```js
export function validateAmount(amount) {
  if (amount === undefined || amount === null || (typeof amount === "string" && amount.trim() === "")) {
    return "Amount is required";
  }
  const value = toNumber(amount);
  if (!Number.isFinite(value)) return "Amount must be a number";
  if (value <= 0) return "Amount must be a positive number (more than 0)";
  if (value > MAX_AMOUNT) return "Amount must be 1,000,000 or less";
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-9) {
    return "Amount can have at most 2 decimal places";
  }
  return null;
}
```

Every case was tested against the running app (`POST /api/expenses`):

| Amount sent | Response |
|---|---|
| `"12.50"`, `12.5`, `"0.01"` | `201` created |
| `""` or missing | `400 { error: "Amount is required" }` |
| `"abc"`, `"12abc"`, `"1e3"`, `true` | `400 { error: "Amount must be a number" }` |
| `0`, `"-5"` | `400 { error: "Amount must be a positive number (more than 0)" }` |
| `"12.345"` | `400 { error: "Amount can have at most 2 decimal places" }` |
| `1000000.01` | `400 { error: "Amount must be 1,000,000 or less" }` |

Other checks: description required (max 100 characters), category must be one of
the list, and the id in `DELETE /api/expenses/[id]` must be a number (`400` if not).

The form sends the amount **exactly as typed** and doesn't block anything itself,
so the message you see under the form comes from the server's validation.
Try `-5` or `abc` in the Amount box.

## Secured actions: add and delete

Both routes check the session with `getServerSession(authOptions)` before doing anything:

| Situation | Response |
|---|---|
| Not signed in | `401 { error: "Not authenticated" }` |
| Invalid input | `400` with the validation message |
| Delete an id that doesn't exist, **or belongs to the other user** | `404 { error: "Expense not found" }` |
| Database down | `500 { error: "Could not add expense" }` (real error logged on the server only) |

## Stats widget → `lib/stats.js` + `components/ExpenseStats.jsx`

`computeStats(expenses)` works out:

- **Total spent**
- **Average per entry**
- **Number of entries**
- **Biggest expense**, and what it was
- **By category**: count, total, and share of spending (with a bar), biggest category first

All money maths is done in **cents** (whole numbers), so 0.10 + 0.20 is exactly
0.30. The widget reads the same `expenses` array from `ExpensesContext` as the
list does, so the numbers update instantly when you add or delete, without a
page reload.

## Error handling

Same pattern as the course: every database call is wrapped in `try/catch`.

```js
try {
  return NextResponse.json(await getAllExpenses(session.user.id));
} catch (err) {
  console.error("GET /api/expenses failed:", err);
  return NextResponse.json({ error: "Could not load expenses" }, { status: 500 });
}
```

**Tested with a real failure:** MySQL was stopped while `npm run dev` was running.

- The API returned clean `500`s.
- The dashboard showed a friendly "Can't reach the database" page instead of crashing.
- The real error (`ECONNREFUSED 127.0.0.1:8889`) appeared only in the server log.
- After MySQL was started again, the app worked straight away without restarting `npm run dev`.

## Deploying (cloud MySQL)

Set the `MYSQL_*` values to your cloud database (e.g. TiDB Cloud) and
`MYSQL_SSL=true`. No code changes are needed. In production, `NEXTAUTH_SECRET`
and `NEXTAUTH_URL` must be set to real values.

## Suggested exploration

- Add an expense with amount `-5`, then `abc`, then `12.345`, and read each server message.
- Add an expense and watch every number in the stats widget change.
- Sign in as `Moo`, then as `Jeff`: different expenses, different totals.
- Run `npm run db:inspect` and compare MySQL's own `SUM` / `AVG` per category with the widget.
