# Student API

A RESTful API for managing student information with authentication and image upload capabilities.

## Features

- Student registration and authentication
- Image upload for student profiles
- Dynamic additional fields storage
- JWT-based authentication
- MongoDB database

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Create a .env file with the following variables:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/hamdan-api
JWT_SECRET=your_jwt_secret_key_here
```

## API Endpoints

### Authentication

#### Register Student
```
POST /api/students/register
Content-Type: multipart/form-data

Fields:
- username (required)
- password (required)
- name (required)
- phone (required)
- birthdate (required, Date format)
- email (required)
- courseName (required)
- image (optional, file)
- otherFields (optional, JSON object)
```

#### Login
```
POST /api/students/login
Content-Type: application/json

{
  "username": "student1",
  "password": "password123"
}
```

### Protected Routes (Require Authentication Token)

#### Get Profile
```
GET /api/students/profile
Authorization: Bearer <token>
```

#### Update Profile
```
PUT /api/students/profile
Content-Type: multipart/form-data
Authorization: Bearer <token>

Fields:
- name (optional)
- phone (optional)
- birthdate (optional)
- email (optional)
- courseName (optional)
- image (optional, file)
- otherFields (optional, JSON object)
```

## Example Usage

### Register a new student
```bash
curl -X POST http://localhost:3000/api/students/register \
  -F "username=student1" \
  -F "password=password123" \
  -F "name=John Doe" \
  -F "phone=1234567890" \
  -F "birthdate=2000-01-01" \
  -F "email=john@example.com" \
  -F "courseName=Computer Science" \
  -F "image=@/path/to/image.jpg" \
  -F 'otherFields={"interests":["programming","math"],"address":"123 Main St"}'
```

### Login
```bash
curl -X POST http://localhost:3000/api/students/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student1",
    "password": "password123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:3000/api/students/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Update Profile
```bash
curl -X PUT http://localhost:3000/api/students/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "name=John Smith" \
  -F "image=@/path/to/new-image.jpg" \
  -F 'otherFields={"interests":["programming","math","physics"]}'
```

## Note

- Make sure MongoDB is running before starting the server
- Images are stored in the `uploads` directory
- The `otherFields` can store any additional data in key-value format
