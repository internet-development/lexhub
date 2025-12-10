CREATE TABLE "invalid_lexicons" (
	"nsid" varchar(317) NOT NULL,
	"cid" varchar(100) NOT NULL,
	"repo_did" varchar(256) NOT NULL,
	"repo_rev" varchar(256) NOT NULL,
	"raw_data" jsonb NOT NULL,
	"reasons" jsonb NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invalid_lexicons_nsid_cid_repo_did_pk" PRIMARY KEY("nsid","cid","repo_did"),
	CONSTRAINT "reasons_not_empty" CHECK (jsonb_array_length("invalid_lexicons"."reasons") > 0)
);
--> statement-breakpoint
CREATE TABLE "valid_lexicons" (
	"nsid" varchar(317) NOT NULL,
	"cid" varchar(100) NOT NULL,
	"repo_did" varchar(256) NOT NULL,
	"repo_rev" varchar(256) NOT NULL,
	"data" jsonb NOT NULL,
	"ingested_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "valid_lexicons_nsid_cid_repo_did_pk" PRIMARY KEY("nsid","cid","repo_did")
);
--> statement-breakpoint
CREATE INDEX "invalid_lexicons_nsid_idx" ON "invalid_lexicons" USING btree ("nsid");--> statement-breakpoint
CREATE INDEX "invalid_lexicons_repo_did_idx" ON "invalid_lexicons" USING btree ("repo_did");--> statement-breakpoint
CREATE INDEX "invalid_lexicons_raw_data_gin_idx" ON "invalid_lexicons" USING gin ("raw_data");--> statement-breakpoint
CREATE INDEX "invalid_lexicons_reasons_gin_idx" ON "invalid_lexicons" USING gin ("reasons");--> statement-breakpoint
CREATE INDEX "valid_lexicons_nsid_idx" ON "valid_lexicons" USING btree ("nsid");--> statement-breakpoint
CREATE INDEX "valid_lexicons_repo_did_idx" ON "valid_lexicons" USING btree ("repo_did");--> statement-breakpoint
CREATE INDEX "valid_lexicons_data_gin_idx" ON "valid_lexicons" USING gin ("data");
