# FormScript - Interactive Form Builder and Execution Platform

FormScript is a marketplace and expo platform allowing users to create, share, and execute custom forms with JavaScript logic.

## Features

- User authentication and profile management
- Drag-and-drop form builder
- JavaScript code editor for form validation and processing
- Form submission handling and data storage
- Public form sharing and discovery
- Secure code execution
- Responsive design for all devices

## Tech Stack

- **Frontend**: React, Tailwind CSS, Shadcn UI, TanStack Query
- **Backend**: Express.js, Passport.js
- **Database**: PostgreSQL with Drizzle ORM
- **Code Execution**: VM2 for secure JavaScript execution
- **Deployment**: Vercel

## Deployment to Vercel

This project is configured for deployment to Vercel. Follow these steps to deploy:

1. Create a Vercel account at [vercel.com](https://vercel.com)
2. Install the Vercel CLI: `npm i -g vercel`
3. Login to Vercel: `vercel login`
4. From the project directory, run: `vercel`
5. Set up the following environment variables in the Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL database connection URL
   - `SESSION_SECRET`: A secure random string for session encryption

### Important Notes for Vercel Deployment

- The PostgreSQL database should be hosted in a service that allows external connections (like Neon, Supabase, or RDS)
- Make sure your database connection URL includes SSL parameters
- Serverless function execution has a time limit; keep this in mind for script execution
- Set up an appropriate scaling plan based on expected traffic

## Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a PostgreSQL database and set the DATABASE_URL environment variable
4. Start the development server: `npm run dev`

## Database Setup

The project uses Drizzle ORM for database operations. To set up the database schema:

1. Ensure your DATABASE_URL environment variable is set
2. Run: `npm run db:push`

## License

MIT