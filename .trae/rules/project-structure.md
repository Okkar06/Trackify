# Project Structure

Root:

* public → frontend (React + Tailwind)
* server → backend (Node.js + Express MVC)

## Frontend (public)

* src/

  * components/
  * pages/
  * layouts/
  * services/
  * hooks/
  * utils/

## Backend (server)

* controllers/
* models/
* routes/
* middleware/
* services/
* utils/
* config/

## Rules

* Do not mix frontend and backend code
* Always place frontend code in `public`
* Always place backend code in `server`
* Follow MVC strictly for backend
* Use reusable components in frontend
