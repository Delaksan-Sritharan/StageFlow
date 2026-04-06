export type AuthFormState = {
  errors?: {
    displayName?: string;
    email?: string;
    password?: string;
    form?: string;
  };
};

export function getSafeRedirectPath(
  value: FormDataEntryValue | string | null | undefined,
) {
  const rawValue = typeof value === "string" ? value : value?.toString() ?? "";

  if (!rawValue || !rawValue.startsWith("/") || rawValue.startsWith("//")) {
    return "/";
  }

  return rawValue;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validateCredentials(
  email: string,
  password: string,
  displayName?: string,
) {
  const errors: AuthFormState["errors"] = {};

  if (displayName !== undefined && displayName.length > 0 && displayName.length < 2) {
    errors.displayName = "Display name must be at least 2 characters long.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  }

  return errors;
}