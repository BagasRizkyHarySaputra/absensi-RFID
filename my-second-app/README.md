This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Student Attendance Report (Dashboard)

The dashboard widget for "Student Attendance Report" reuses the same data logic as the Reports page. It is implemented via `src/components/AttendanceReportDashboard.jsx`, which calls `getAttendanceSummary` from `src/lib/report.js` so the numbers and pie chart match the Reports screen.

- Component: `src/components/AttendanceReportDashboard.jsx`
- Used in: `src/components/DASHBOARDpage.jsx`
- Data source: `src/lib/report.js` (aggregates hadir, izin, alpha using kehadiran + report tables)

To change how values are calculated, edit `getAttendanceSummary` in `src/lib/report.js` and both the Reports page and Dashboard will reflect it.

## Class Schedule rules (Classes > ClassDetail)

The schedule cards in `src/components/ClassDetail.jsx` follow these rules:

- Period numbering counts only lessons. Breaks (subjects containing "Istirahat") do not consume period numbers.
- Daily lesson caps: Monday–Thursday end at period 10; Friday ends at period 8.
- If database returns a teacher for a break, it’s hidden and no "TBA" placeholder is shown.
- Period boxes display numbers for lessons; break cards keep layout but omit the numbers.

Relevant code:
- Normalization and rendering: `src/components/ClassDetail.jsx`
- Styling: `src/static/css/ClassDetail.css`


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
