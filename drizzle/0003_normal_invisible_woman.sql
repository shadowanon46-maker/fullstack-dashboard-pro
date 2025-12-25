CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"action" text NOT NULL,
	"entity_id" integer,
	"metadata" json,
	"created_at" timestamp DEFAULT now()
);
