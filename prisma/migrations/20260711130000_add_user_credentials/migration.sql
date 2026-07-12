-- Local username/password auth fields on User (nullable; pre-auth stub users stay valid).
ALTER TABLE "User" ADD COLUMN "username" TEXT,
ADD COLUMN "passwordHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
