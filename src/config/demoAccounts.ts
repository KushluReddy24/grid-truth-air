// Demo Accounts Configuration
// This file documents the hardcoded demo account credentials used for testing

export const DEMO_ACCOUNTS = {
  contributor: {
    userId: "MU012026",
    password: "contributor123",
    role: "contributor",
    description: "Can submit emission data",
  },
  verifier: {
    userId: "pcb012026",
    password: "verifier123",
    role: "verifier",
    description: "Can review and verify submissions",
  },
} as const;

// Role Descriptions
export const ROLE_DESCRIPTIONS = {
  public_user: {
    name: "Public User",
    description: "View-only access to emissions map",
    permissions: ["View emissions data", "View map"],
  },
  contributor: {
    name: "Contributor",
    description: "Submit and track emission data",
    permissions: [
      "Submit emission data",
      "Track submissions",
      "View personal submissions",
      "View map",
    ],
  },
  verifier: {
    name: "Verifier",
    description: "Review and verify submissions",
    permissions: [
      "Review submissions",
      "Approve/reject submissions",
      "Add verification notes",
      "View audit trail",
      "View all submissions",
      "View map",
    ],
  },
} as const;

// Feature Access Matrix
export const FEATURE_ACCESS = {
  submitData: ["contributor", "verifier"],
  reviewSubmissions: ["verifier"],
  viewAllSubmissions: ["verifier"],
  viewPersonalSubmissions: ["contributor"],
  viewMap: ["public_user", "contributor", "verifier"],
  managedUsers: ["verifier"], // Could be extended for admin panel
} as const;
