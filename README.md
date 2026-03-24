# Modern TypeScript Backend API

Enterprise-grade Node.js backend with TypeScript, Express, and MongoDB.

## Features

- ✅ TypeScript for type safety
- ✅ MongoDB Native Driver
- ✅ Clean architecture (Repository + Service + Controller)
- ✅ Global error handling
- ✅ Zod validation
- ✅ Security best practices (Helmet, CORS, Rate Limiting)
- ✅ Environment validation
- ✅ Hot reload in development

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env

# 3. Update .env with your MongoDB URL

# 4. Start development server
npm run dev
```

## Installation

বিস্তারিত দেখুন: [Installation Guide](docs/INSTALLATION.md)

### Required Packages

**Dependencies:**
```bash
npm install express mongodb dotenv cors helmet express-rate-limit zod
```

**Dev Dependencies:**
```bash
npm install -D typescript tsx @types/node @types/express @types/cors
```

## Documentation

- 📦 [Installation Guide](docs/INSTALLATION.md) - Package installation
- 🚀 [Getting Started](docs/GETTING_STARTED.md) - How to build features
- ⚠️ [Error Handling](docs/ERROR_HANDLING.md) - Error handling guide
- 🏗️ [Architecture](docs/ARCHITECTURE.md) - Project structure
- 📚 [API Documentation](docs/API.md) - API endpoints
- 🗄️ [MongoDB Guide](docs/MONGODB.md) - MongoDB best practices

## Scripts

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Build for production
npm start        # Start production server
```

## Project Structure

```
src/
├── config/          # Database & environment config
├── controllers/     # Request handlers (add yours here)
├── middleware/      # Error handling, validation
├── repositories/    # Database access (extends BaseRepository)
├── routes/          # API routes (add yours here)
├── services/        # Business logic (add yours here)
├── types/           # TypeScript types (add yours here)
├── utils/           # Utilities
├── validations/     # Zod schemas (add yours here)
├── app.ts           # Express setup
└── server.ts        # Entry point
```

## Environment Variables

```env
NODE_ENV=development
PORT=5000
DATABASE_URL="mongodb://localhost:27017/mydb"
JWT_SECRET=your-secret-key-minimum-32-characters
JWT_EXPIRES_IN=7d
```

## Example Usage

### Create a New Feature

1. Define type in `src/types/`
2. Create repository in `src/repositories/`
3. Create service in `src/services/`
4. Create controller in `src/controllers/`
5. Create validation in `src/validations/`
6. Create routes in `src/routes/`

বিস্তারিত: [Getting Started Guide](docs/GETTING_STARTED.md)

## Error Handling

সব error automatically handled:
- MongoDB errors
- Validation errors
- Custom AppError
- 404 Not Found
- Unexpected errors

```typescript
throw new AppError(404, 'Not found');
```

বিস্তারিত: [Error Handling Guide](docs/ERROR_HANDLING.md)

## License

ISC
