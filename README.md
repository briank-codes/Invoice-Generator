# Invoice Generator

A full-stack invoicing app I built to practice working with a real backend — auth, a relational database, and CRUD that actually matters (money, in this case). You can add clients, put together invoices with line items, track whether they've been paid, and print them out as a PDF to actually send someone.

I built this as a 4-day project to get more comfortable with Next.js's App Router, Prisma, and Postgres, coming from a mostly frontend background.

## What it does

- Sign up and log in (JWT sessions, httpOnly cookies — no third-party auth)
- Add and manage clients
- Create invoices with multiple line items, auto-numbered per user
- Mark invoices as Draft, Sent, Paid, or Overdue
- Print any invoice to PDF straight from the browser
- A dashboard showing what's outstanding, what's overdue, and how many clients/invoices you have
- Delete clients and invoices (a client with existing invoices can't be deleted, on purpose — didn't want to accidentally nuke financial history)

Money is stored as integers (cents) instead of decimals, so nothing gets weird with rounding.

## Stack

- Next.js (App Router)
- PostgreSQL + Prisma
- Tailwind CSS
- JWT auth, written by hand rather than pulled from a library

## Running it locally

You'll need Node 22+ and npm.

\`\`\`bash
git clone <your-repo-url>
cd invoice-generator
npm install
cp .env.example .env
\`\`\`

Fill in your own `JWT_SECRET` in `.env`, then start a local Postgres instance:

\`\`\`bash
npx prisma dev
\`\`\`

Leave that running in its own terminal — it resets every time it restarts, so don't be surprised if your data disappears between sessions. I haven't set up a persistent volume for it yet.

In another terminal:

\`\`\`bash
npx prisma db push
npx prisma generate
npm run dev
\`\`\`

Then open [http://localhost:3000](http://localhost:3000), register an account, and start adding stuff.

**Why `db push` instead of `migrate dev`:** In this dev environment, Postgres copies existing types into the shadow database it creates from `template1`, and that trips up `migrate dev` with a duplicate-type error. `db push` sidesteps it. Fine for a project like this, but for something going to production I'd set up a clean migration history first.

## Known rough edges

- The `OVERDUE` status doesn't set itself — it's manual for now. The dashboard's overdue count is calculated separately by checking due dates directly, so it can technically disagree with what an individual invoice's status badge says.
- Invoice numbers are just a simple count per user, so they're not bulletproof against race conditions or gaps from deleted invoices.
- No editing line items on an existing invoice — you can change its status, but not what's on it.

## What I'd add next

- Proper migrations for a real deploy
- Editing invoice items after creation
- Maybe multi-currency support, since right now everything assumes KES