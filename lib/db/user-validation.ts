type UserContactFields = {
  phone?: string | null;
  email?: string | null;
};

export class UserContactError extends Error {
  constructor() {
    super("A user must have at least one contact method: phone or email.");
    this.name = "UserContactError";
  }
}

export function validateUserContact({ phone, email }: UserContactFields): void {
  if (!phone && !email) {
    throw new UserContactError();
  }
}
