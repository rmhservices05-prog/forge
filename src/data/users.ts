import type { User } from "../types";

export const users: User[] = [
  {
    id: "user-me",
    name: "Me",
    email: "me@dealtr.example",
    role: "Owner",
  },
  {
    id: "user-teammate",
    name: "Teammate",
    email: "teammate@dealtr.example",
    role: "Operator",
  },
];

// TODO: Replace seed users with SSO-backed identities and role-based permissions.
export function getUserById(userId: string): User | undefined {
  return users.find((user) => user.id === userId);
}
