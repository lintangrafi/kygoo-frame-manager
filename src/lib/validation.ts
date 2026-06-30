// Input validation utilities

// String validators
export const validators = {
  required: (value: any): string | null => {
    if (value === null || value === undefined || value === "") {
      return "Field ini wajib diisi";
    }
    return null;
  },

  minLength: (min: number) => (value: string): string | null => {
    if (!value) return null;
    if (value.length < min) {
      return `Minimal ${min} karakter`;
    }
    return null;
  },

  maxLength: (max: number) => (value: string): string | null => {
    if (!value) return null;
    if (value.length > max) {
      return `Maksimal ${max} karakter`;
    }
    return null;
  },

  email: (value: string): string | null => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return "Email tidak valid";
    }
    return null;
  },

  phone: (value: string): string | null => {
    if (!value) return null;
    const phoneRegex = /^[0-9+\-\s()]{8,}$/;
    if (!phoneRegex.test(value)) {
      return "Nomor telepon tidak valid";
    }
    return null;
  },

  numeric: (value: string): string | null => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return "Harus berupa angka";
    }
    return null;
  },

  min: (min: number) => (value: number): string | null => {
    if (value < min) {
      return `Minimal ${min}`;
    }
    return null;
  },

  max: (max: number) => (value: number): string | null => {
    if (value > max) {
      return `Maksimal ${max}`;
    }
    return null;
  },

  pattern: (regex: RegExp, message: string) => (value: string): string | null => {
    if (!value) return null;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  },

  slug: (value: string): string | null => {
    if (!value) return null;
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(value)) {
      return "Slug hanya boleh huruf kecil, angka, dan strip";
    }
    return null;
  },

  in: <T extends string>(values: T[]) => (value: T): string | null => {
    if (!values.includes(value)) {
      return `Nilai harus salah satu dari: ${values.join(", ")}`;
    }
    return null;
  },
};

// Schema-based validator
type ValidatorFn = (value: any) => string | null;

interface SchemaField {
  validators?: ValidatorFn[];
  default?: any;
  transform?: (value: any) => any;
}

interface Schema {
  [key: string]: SchemaField;
}

export function validate(schema: Schema, data: Record<string, any>): {
  valid: boolean;
  errors: Record<string, string>;
  transformed: Record<string, any>;
} {
  const errors: Record<string, string> = {};
  const transformed: Record<string, any> = {};

  for (const [key, field] of Object.entries(schema)) {
    let value = data[key];

    // Apply default if not provided
    if (value === undefined && field.default !== undefined) {
      value = field.default;
    }

    // Apply transform
    if (value !== undefined && field.transform) {
      value = field.transform(value);
      transformed[key] = value;
    }

    // Run validators
    if (field.validators) {
      for (const validator of field.validators) {
        const error = validator(value);
        if (error) {
          errors[key] = error;
          break;
        }
      }
    }

    // Add to transformed if not already
    if (transformed[key] === undefined) {
      transformed[key] = value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    transformed,
  };
}

// Pre-built schemas
export const schemas = {
  createFrame: {
    name: {
      validators: [
        validators.required,
        validators.minLength(2),
        validators.maxLength(100),
      ],
    },
    category: {
      validators: [
        validators.required,
        validators.in(["2R", "4R"]),
      ],
    },
    occasion: {
      validators: [
        validators.in(["general", "wedding", "birthday", "graduation", "corporate", "holiday"]),
      ],
      default: "general",
    },
    additionalFee: {
      validators: [
        validators.numeric,
      ],
      transform: (v: string) => v ? parseInt(v) : 0,
      default: 0,
    },
  },

  createSession: {
    customerName: {
      validators: [
        validators.required,
        validators.minLength(2),
        validators.maxLength(100),
      ],
    },
    slug: {
      validators: [
        validators.required,
        validators.slug,
        validators.minLength(3),
        validators.maxLength(50),
      ],
    },
    pinCode: {
      validators: [
        validators.required,
        validators.minLength(4),
        validators.maxLength(6),
        validators.numeric,
      ],
    },
  },

  createComposition: {
    frameId: {
      validators: [
        validators.required,
      ],
    },
  },

  updateComposition: {
    status: {
      validators: [
        validators.in(["draft", "review", "approved", "finalized"]),
      ],
    },
  },
};

// Sanitization helpers
export function sanitize(str: string): string {
  return str
    .replace(/[<>]/g, "") // Remove angle brackets
    .trim();
}

export function sanitizeHtml(str: string): string {
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export function sanitizeFilename(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .substring(0, 255);
}
