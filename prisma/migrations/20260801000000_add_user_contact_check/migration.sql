ALTER TABLE "User" ADD CONSTRAINT "User_contact_check" CHECK ("phone" IS NOT NULL OR "email" IS NOT NULL);
