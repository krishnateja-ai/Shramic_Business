// config.js - Environment Configuration Loader
class ConfigLoader {
    constructor() {
        this.config = null;
        this.isLoaded = false;
    }

    // Load configuration from environment variables
    async loadConfig() {
        if (this.isLoaded) {
            return this.config;
        }

        try {
            // In production, this would make an API call to your backend
            // that securely provides the configuration without exposing secrets
            const response = await fetch('/api/config', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load configuration');
            }

            this.config = await response.json();
            this.isLoaded = true;
            
            // Validate required configuration
            this.validateConfig();
            
            return this.config;
        } catch (error) {
            console.warn('Failed to load environment config, using fallback:', error);
            
            // Fallback configuration for development
            this.config = this.getFallbackConfig();
            this.isLoaded = true;
            
            return this.config;
        }
    }

    // Fallback configuration for development/demo
    getFallbackConfig() {
        return {
            firebase: {
                apiKey: process.env.FIREBASE_API_KEY,
                authDomain: process.env.FIREBASE_AUTH_DOMAIN,
                projectId: process.env.FIREBASE_PROJECT_ID,
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
                appId: process.env.FIREBASE_APP_ID,
                measurementId: process.env.FIREBASE_MEASUREMENT_ID
            },
            recaptcha: {
                siteKey: process.env.RECAPTCHA_SITE_KEY || "your-recaptcha-site-key"
            },
            app: {
                name: process.env.APP_NAME || "Store Registration Portal",
                version: process.env.APP_VERSION || "1.0.0",
                environment: process.env.ENVIRONMENT || "development"
            },
            features: {
                enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
                enableErrorReporting: process.env.ENABLE_ERROR_REPORTING === 'true',
                maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
                allowedFileTypes: (process.env.ALLOWED_FILE_TYPES || 'image/*,.pdf').split(',')
            }
        };
    }

    // Validate that all required configuration is present
    validateConfig() {
        const required = [
            'firebase.apiKey',
            'firebase.authDomain',
            'firebase.projectId',
            'firebase.storageBucket',
            'firebase.messagingSenderId',
            'firebase.appId'
        ];

        const missing = required.filter(key => {
            const value = this.getNestedValue(this.config, key);
            return !value || value === 'your-api-key-here' || value.startsWith('your-');
        });

        if (missing.length > 0) {
            console.warn('Missing or placeholder configuration values:', missing);
            
            if (this.config.app.environment === 'production') {
                throw new Error(`Missing required configuration in production: ${missing.join(', ')}`);
            }
        }
    }

    // Helper to get nested object values
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    }

    // Get specific config sections
    getFirebaseConfig() {
        return this.config?.firebase || {};
    }

    getRecaptchaConfig() {
        return this.config?.recaptcha || {};
    }

    getAppConfig() {
        return this.config?.app || {};
    }

    getFeaturesConfig() {
        return this.config?.features || {};
    }

    // Check if we're in development mode
    isDevelopment() {
        return this.config?.app?.environment === 'development';
    }

    // Check if we're in production mode
    isProduction() {
        return this.config?.app?.environment === 'production';
    }
}

// Singleton instance
const configLoader = new ConfigLoader();

// Export for use in modules
export default configLoader;

// Also make available globally for non-module usage
if (typeof window !== 'undefined') {
    window.ConfigLoader = configLoader;
}