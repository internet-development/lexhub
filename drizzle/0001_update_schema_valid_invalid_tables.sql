-- Custom SQL migration file, put your code below! --

-- Drop old lexicons table
DROP TABLE IF EXISTS "lexicons";

-- Create valid_lexicons table
CREATE TABLE "valid_lexicons" (
	"nsid" varchar(317) NOT NULL,
	"cid" varchar(100) NOT NULL,
	"repo_did" varchar(256) NOT NULL,
	"repo_rev" varchar(256) NOT NULL,
	"data" jsonb NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "valid_lexicons_nsid_cid_repo_did_pk" PRIMARY KEY("nsid","cid","repo_did")
);

-- Create invalid_lexicons table
CREATE TABLE "invalid_lexicons" (
	"nsid" varchar(317) NOT NULL,
	"cid" varchar(100) NOT NULL,
	"repo_did" varchar(256) NOT NULL,
	"repo_rev" varchar(256) NOT NULL,
	"raw_data" jsonb NOT NULL,
	"validation_errors" jsonb NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invalid_lexicons_nsid_cid_repo_did_pk" PRIMARY KEY("nsid","cid","repo_did")
);

-- Create indexes for valid_lexicons
CREATE INDEX "valid_lexicons_nsid_idx" ON "valid_lexicons" USING btree ("nsid");
CREATE INDEX "valid_lexicons_repo_did_idx" ON "valid_lexicons" USING btree ("repo_did");
CREATE INDEX "valid_lexicons_data_gin_idx" ON "valid_lexicons" USING gin ("data");

-- Create indexes for invalid_lexicons
CREATE INDEX "invalid_lexicons_nsid_idx" ON "invalid_lexicons" USING btree ("nsid");
CREATE INDEX "invalid_lexicons_repo_did_idx" ON "invalid_lexicons" USING btree ("repo_did");
CREATE INDEX "invalid_lexicons_raw_data_gin_idx" ON "invalid_lexicons" USING gin ("raw_data");
