import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MY-EMDR Backend API',
      version: '1.0.0',
      description: 'Enterprise-grade Node.js backend for the MY-EMDR application. Built with Express, TypeScript, and MongoDB.',
      contact: {
        name: 'API Support',
        email: 'support@myemdr.com',
      },
    },
    servers: [
      {
        url: 'https://crafts-mit-slots-airplane.trycloudflare.com',
        description: 'Cloudflare Tunnel (Default)',
      },
      {
        url: `http://localhost:${env.PORT || 5005}`,
        description: 'Local Development',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'], // Path to the API docs
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Premium Dark Theme CSS
export const swaggerCustomCss = `
  .swagger-ui {
    background-color: #0f172a;
    color: #f8fafc;
  }
  .swagger-ui .topbar {
    background-color: #1e293b;
    border-bottom: 1px solid #334155;
  }
  .swagger-ui .info .title {
    color: #38bdf8;
    font-family: 'Inter', sans-serif;
  }
  .swagger-ui .info li, .swagger-ui .info p, .swagger-ui .info table {
    color: #94a3b8;
  }
  .swagger-ui .scheme-container {
    background-color: #1e293b;
    box-shadow: none;
    border-top: 1px solid #334155;
  }
  .swagger-ui .opblock.opblock-get { background: rgba(56, 189, 248, 0.1); border-color: #38bdf8; }
  .swagger-ui .opblock.opblock-post { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; }
  .swagger-ui .opblock.opblock-put { background: rgba(234, 179, 8, 0.1); border-color: #eab308; }
  .swagger-ui .opblock.opblock-delete { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
  .swagger-ui .opblock.opblock-patch { background: rgba(168, 85, 247, 0.1); border-color: #a855f7; }
  
  .swagger-ui .opblock .opblock-summary-method { border-radius: 6px; font-weight: bold; }
  .swagger-ui .opblock .opblock-summary-path { color: #f1f5f9; font-weight: 500; }
  .swagger-ui .btn.authorize { color: #38bdf8; border-color: #38bdf8; }
  .swagger-ui .btn.authorize svg { fill: #38bdf8; }
  
  /* Input fields */
  .swagger-ui input[type=text], .swagger-ui textarea {
    background-color: #0f172a !important;
    color: #f1f5f9 !important;
    border: 1px solid #334155 !important;
  }
  
  /* Models section */
  .swagger-ui .model-box { background-color: #1e293b; }
  .swagger-ui .model-title { color: #38bdf8; }
  
  /* Select boxes */
  .swagger-ui select {
    background-color: #0f172a;
    color: #f1f5f9;
    border: 1px solid #334155;
  }
`;
