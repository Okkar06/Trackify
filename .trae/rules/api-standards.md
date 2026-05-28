# API Standards

## General Rules

* Use RESTful API design
* Use clear route naming

## Example Routes

Auth:

* POST /api/auth/register
* POST /api/auth/login
* POST /api/auth/reset-password

User:

* GET /api/users/profile
* PUT /api/users/update

Work:

* POST /api/work
* GET /api/work
* GET /api/work/:id
* PUT /api/work/:id
* DELETE /api/work/:id

## Rules

* Always validate input
* Use proper HTTP status codes
* Keep controllers clean
* Move logic into services
