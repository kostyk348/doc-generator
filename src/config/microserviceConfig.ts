/**
 * Microservice Configuration & Contract Definition
 * generator-doc-gost microservice
 */

export interface MicroserviceConfig {
  serviceName: string;
  version: string;
  apiPrefix: string;
  isEmbeddedMode: boolean;
  allowedOrigins: string[];
  features: {
    aiAssistant: boolean;
    autoRegistry: boolean;
    employeeIntegration: boolean;
    pdfExport: boolean;
    excelExport: boolean;
    signatureCanvas: boolean;
  };
}

export const DEFAULT_MICROSERVICE_CONFIG: MicroserviceConfig = {
  serviceName: 'generator-doc-gost',
  version: '1.0.0',
  apiPrefix: '/api/v1',
  isEmbeddedMode: window.self !== window.top, // Detect if running inside iframe microfrontend
  allowedOrigins: ['*'], // Can be restricted via postMessage handshake
  features: {
    aiAssistant: true,
    autoRegistry: true,
    employeeIntegration: true,
    pdfExport: true,
    excelExport: true,
    signatureCanvas: true,
  },
};
