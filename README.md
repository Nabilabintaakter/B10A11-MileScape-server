# **Milescape - Server Side** 🌐

This is the back-end server for the **Milescape - Marathon Management System**. It is responsible for managing APIs, handling database operations, and ensuring secure authentication. The server is built using **Node.js** with **Express.js** and connects to **MongoDB** for storing and retrieving data.

---

## ✨ **Features**
### **Core Functionalities**
- **Marathon Management**
  - Add, update, delete marathon events.
  - Fetch all marathons or a single marathon by ID.
- **Participant Management**
  - Register for marathon events.
  - Retrieve and manage user-specific registrations.

### **Authentication**
- **JWT Authentication** for secure access to private routes.
- Password encryption using **bcrypt.js** for added security.

### **Error Handling**
- Centralized error handling for all API responses.
- HTTP status codes for better debugging and clarity.

### **Middleware**
- **JWT Verification**: Protects private routes.
- **CORS Policy**: Ensures smooth integration with the client-side application.

### **Database Management**
- Built with **MongoDB Atlas** for reliable and scalable data storage.
- Uses **Mongoose** for schema-based data modeling.

---

## 🛠️ **Technologies Used**
- **Node.js**: JavaScript runtime for building back-end services.
- **Express.js**: Lightweight framework for routing and middleware.
- **MongoDB Atlas**: Cloud database for storing application data.
- **JWT (JSON Web Tokens)**: For authentication and secure route protection.
- **CORS**: Middleware to handle cross-origin requests.
- **dotenv**: For managing environment variables.

---

## 🌐 **Live Server URL**
[Visit the Live Server](https://b10-a11-milescape-server.vercel.app/)
