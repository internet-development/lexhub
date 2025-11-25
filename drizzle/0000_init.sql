CREATE TABLE "lexicons" (
	"id" varchar(317) NOT NULL,
	"cid" varchar(100) NOT NULL,
	"data" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lexicons_id_cid_pk" PRIMARY KEY("id","cid")
);
--> statement-breakpoint
CREATE INDEX "lexicons_id_idx" ON "lexicons" USING btree ("id");--> statement-breakpoint
CREATE INDEX "lexicons_created_at_idx" ON "lexicons" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "lexicons_data_gin_idx" ON "lexicons" USING gin ("data");--> statement-breakpoint


CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lexicons_updated_at
	BEFORE UPDATE ON "lexicons"
	FOR EACH ROW
	EXECUTE FUNCTION update_updated_at_column();
