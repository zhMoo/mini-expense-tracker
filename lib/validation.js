// OBJECTIVE: Data validation and error handling
//
// Checked HERE, at the API boundary, before anything reaches the database.
// lib/db.js trusts that whatever arrives at it is already valid.
//
// The new rule in this app: AMOUNT MUST BE A POSITIVE NUMBER. Unlike the
// text checks in the Notes app, this has to handle numbers arriving as
// numbers OR as strings from a form ("12.50"), and reject things like
// "abc", "-5", "0", "1e3" and "12.345".

export const CATEGORIES = ["Food", "Transport", "Bills", "Shopping", "Entertainment", "Other"];

const MAX_DESCRIPTION_LENGTH = 100;
const MAX_AMOUNT = 1_000_000;

export function validateDescription(description) {
  if (typeof description !== "string") return "Description must be text";
  const trimmed = description.trim();
  if (trimmed.length === 0) return "Description is required";
  if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
    return `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer`;
  }
  return null; // no error = valid
}

// Turns "12.50" or 12.5 into the number 12.5. Anything else becomes NaN.
// Plain digits only (an optional minus, digits, optional decimals), so
// "1e3", "0x10", "12abc" and "" are NOT treated as numbers.
function toNumber(amount) {
  if (typeof amount === "number") return amount;
  if (typeof amount === "string" && /^-?\d+(\.\d+)?$/.test(amount.trim())) {
    return Number(amount.trim());
  }
  return NaN;
}

export function validateAmount(amount) {
  if (amount === undefined || amount === null || (typeof amount === "string" && amount.trim() === "")) {
    return "Amount is required";
  }
  const value = toNumber(amount);
  if (!Number.isFinite(value)) return "Amount must be a number";
  if (value <= 0) return "Amount must be a positive number (more than 0)";
  if (value > MAX_AMOUNT) return "Amount must be 1,000,000 or less";
  // Money has at most 2 decimal places: 12.5 and 12.50 are fine, 12.345 is not.
  if (Math.abs(value * 100 - Math.round(value * 100)) > 1e-9) {
    return "Amount can have at most 2 decimal places";
  }
  return null;
}

// Call ONLY after validateAmount() returned null.
export function parseAmount(amount) {
  return Math.round(toNumber(amount) * 100) / 100;
}

export function validateCategory(category) {
  if (!CATEGORIES.includes(category)) return `Category must be one of: ${CATEGORIES.join(", ")}`;
  return null;
}

export function isValidId(id) {
  return /^\d+$/.test(id);
}
