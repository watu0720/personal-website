


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    CONSTRAINT "admin_roles_role_check" CHECK (("role" = 'admin'::"text"))
);


ALTER TABLE "public"."admin_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "actor_user_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text" NOT NULL,
    "target_id" "text" NOT NULL,
    "meta" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."changelog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "body_html" "text" NOT NULL,
    "published_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."changelog" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "reaction_type" "text" NOT NULL,
    "actor_type" "text" NOT NULL,
    "actor_user_id" "uuid",
    "actor_fingerprint" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid",
    "visitor_id" "text",
    CONSTRAINT "comment_reactions_actor_type_check" CHECK (("actor_type" = ANY (ARRAY['guest'::"text", 'user'::"text", 'admin'::"text"]))),
    CONSTRAINT "comment_reactions_reaction_type_check" CHECK (("reaction_type" = ANY (ARRAY['good'::"text", 'not_good'::"text", 'admin_heart'::"text"]))),
    CONSTRAINT "reactions_actor_chk" CHECK (((("actor_type" = ANY (ARRAY['user'::"text", 'admin'::"text"])) AND ("actor_user_id" IS NOT NULL) AND ("actor_fingerprint" IS NULL)) OR (("actor_type" = 'guest'::"text") AND ("actor_fingerprint" IS NOT NULL) AND ("actor_user_id" IS NULL))))
);


ALTER TABLE "public"."comment_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comment_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "comment_id" "uuid" NOT NULL,
    "reporter_type" "text" NOT NULL,
    "reporter_user_id" "uuid",
    "guest_fingerprint" "text",
    "reason" "text" NOT NULL,
    "message" "text",
    "resolved" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "comment_reports_reason_check" CHECK (("reason" = ANY (ARRAY['spam'::"text", 'abuse'::"text", 'other'::"text"]))),
    CONSTRAINT "comment_reports_reporter_type_check" CHECK (("reporter_type" = ANY (ARRAY['guest'::"text", 'user'::"text"]))),
    CONSTRAINT "reports_actor_chk" CHECK (((("reporter_type" = 'user'::"text") AND ("reporter_user_id" IS NOT NULL) AND ("guest_fingerprint" IS NULL)) OR (("reporter_type" = 'guest'::"text") AND ("guest_fingerprint" IS NOT NULL) AND ("reporter_user_id" IS NULL))))
);


ALTER TABLE "public"."comment_reports" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_key" "text" NOT NULL,
    "parent_id" "uuid",
    "author_type" "text" NOT NULL,
    "author_user_id" "uuid",
    "guest_name" "text",
    "body" "text" NOT NULL,
    "body_has_links" boolean DEFAULT false NOT NULL,
    "is_hidden" boolean DEFAULT false NOT NULL,
    "hidden_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "admin_heart" boolean DEFAULT false NOT NULL,
    "admin_heart_by" "uuid",
    "admin_heart_at" timestamp with time zone,
    "author_name" "text",
    "author_avatar_url" "text",
    "edit_token_hash" "text",
    "edited_at" timestamp with time zone,
    CONSTRAINT "comments_author_type_check" CHECK (("author_type" = ANY (ARRAY['guest'::"text", 'user'::"text"]))),
    CONSTRAINT "comments_guest_name_len_chk" CHECK (((("author_type" = 'guest'::"text") AND ("guest_name" IS NOT NULL) AND (("char_length"("guest_name") >= 2) AND ("char_length"("guest_name") <= 20)) AND ("author_user_id" IS NULL)) OR (("author_type" = 'user'::"text") AND ("author_user_id" IS NOT NULL) AND ("guest_name" IS NULL)))),
    CONSTRAINT "comments_hidden_reason_check" CHECK ((("hidden_reason" IS NULL) OR ("hidden_reason" = ANY (ARRAY['deleted'::"text", 'reported'::"text", 'admin'::"text"]))))
);


ALTER TABLE "public"."comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_contents" (
    "page_key" "text" NOT NULL,
    "title" "text" DEFAULT ''::"text" NOT NULL,
    "body_md" "text" DEFAULT ''::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    "body_html" "text" DEFAULT ''::"text" NOT NULL,
    "header_image_url" "text"
);


ALTER TABLE "public"."page_contents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_visits" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "page_key" "text" NOT NULL,
    "visitor_hash" "text" NOT NULL,
    "visited_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."page_visits" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "user_id" "uuid" NOT NULL,
    "display_name" "text",
    "avatar_path" "text",
    "header_path" "text",
    "bio" "text",
    "links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."site_changelog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "title" "text" NOT NULL,
    "body_html" "text" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."site_changelog" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."changelog"
    ADD CONSTRAINT "changelog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comment_reports"
    ADD CONSTRAINT "comment_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."page_contents"
    ADD CONSTRAINT "page_contents_pkey" PRIMARY KEY ("page_key");



ALTER TABLE ONLY "public"."page_visits"
    ADD CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."site_changelog"
    ADD CONSTRAINT "site_changelog_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admin_roles_created_at" ON "public"."admin_roles" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_audit_created_at" ON "public"."audit_logs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_changelog_published_at" ON "public"."changelog" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_comment_reactions_user_id" ON "public"."comment_reactions" USING "btree" ("user_id");



CREATE INDEX "idx_comment_reactions_visitor_id" ON "public"."comment_reactions" USING "btree" ("visitor_id");



CREATE INDEX "idx_comments_admin_heart" ON "public"."comments" USING "btree" ("admin_heart", "created_at" DESC);



CREATE INDEX "idx_comments_author_user_id" ON "public"."comments" USING "btree" ("author_user_id");



CREATE INDEX "idx_comments_edit_token_hash" ON "public"."comments" USING "btree" ("edit_token_hash");



CREATE INDEX "idx_comments_hidden_created_at" ON "public"."comments" USING "btree" ("is_hidden", "created_at" DESC);



CREATE INDEX "idx_comments_page_created_at" ON "public"."comments" USING "btree" ("page_key", "created_at" DESC);



CREATE INDEX "idx_reactions_comment" ON "public"."comment_reactions" USING "btree" ("comment_id");



CREATE INDEX "idx_reports_comment_created_at" ON "public"."comment_reports" USING "btree" ("comment_id", "created_at" DESC);



CREATE INDEX "idx_site_changelog_date" ON "public"."site_changelog" USING "btree" ("date" DESC, "created_at" DESC);



CREATE INDEX "idx_visits_page_visited_at" ON "public"."page_visits" USING "btree" ("page_key", "visited_at" DESC);



CREATE INDEX "idx_visits_visitor_visited_at" ON "public"."page_visits" USING "btree" ("visitor_hash", "visited_at" DESC);



CREATE UNIQUE INDEX "uq_reactions_admin_heart_one" ON "public"."comment_reactions" USING "btree" ("comment_id", "reaction_type") WHERE ("reaction_type" = 'admin_heart'::"text");



CREATE UNIQUE INDEX "uq_reactions_guest_per_comment_type" ON "public"."comment_reactions" USING "btree" ("comment_id", "reaction_type", "actor_fingerprint") WHERE (("actor_fingerprint" IS NOT NULL) AND ("reaction_type" = ANY (ARRAY['good'::"text", 'not_good'::"text"])));



CREATE UNIQUE INDEX "uq_reactions_user_per_comment_type" ON "public"."comment_reactions" USING "btree" ("comment_id", "reaction_type", "actor_user_id") WHERE (("actor_user_id" IS NOT NULL) AND ("reaction_type" = ANY (ARRAY['good'::"text", 'not_good'::"text"])));



CREATE UNIQUE INDEX "uq_reports_guest_once" ON "public"."comment_reports" USING "btree" ("comment_id", "guest_fingerprint") WHERE ("guest_fingerprint" IS NOT NULL);



CREATE UNIQUE INDEX "uq_reports_user_once" ON "public"."comment_reports" USING "btree" ("comment_id", "reporter_user_id") WHERE ("reporter_user_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trg_comments_updated_at" BEFORE UPDATE ON "public"."comments" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_page_contents_updated_at" BEFORE UPDATE ON "public"."page_contents" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."admin_roles"
    ADD CONSTRAINT "admin_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."changelog"
    ADD CONSTRAINT "changelog_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reactions"
    ADD CONSTRAINT "comment_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comment_reports"
    ADD CONSTRAINT "comment_reports_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comment_reports"
    ADD CONSTRAINT "comment_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_admin_heart_by_fkey" FOREIGN KEY ("admin_heart_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_author_user_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_page_key_fkey" FOREIGN KEY ("page_key") REFERENCES "public"."page_contents"("page_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."comments"
    ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."page_contents"
    ADD CONSTRAINT "page_contents_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."page_visits"
    ADD CONSTRAINT "page_visits_page_key_fkey" FOREIGN KEY ("page_key") REFERENCES "public"."page_contents"("page_key") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."site_changelog"
    ADD CONSTRAINT "site_changelog_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE "public"."admin_roles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_roles_delete_admin" ON "public"."admin_roles" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_roles" "ar"
  WHERE (("ar"."user_id" = "auth"."uid"()) AND ("ar"."role" = 'admin'::"text")))));



CREATE POLICY "admin_roles_insert_admin" ON "public"."admin_roles" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_roles" "ar"
  WHERE (("ar"."user_id" = "auth"."uid"()) AND ("ar"."role" = 'admin'::"text")))));



CREATE POLICY "admin_roles_select_self" ON "public"."admin_roles" FOR SELECT TO "authenticated" USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."changelog" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "changelog_admin_write" ON "public"."changelog" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_roles" "ar"
  WHERE (("ar"."user_id" = "auth"."uid"()) AND ("ar"."role" = 'admin'::"text"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."admin_roles" "ar"
  WHERE (("ar"."user_id" = "auth"."uid"()) AND ("ar"."role" = 'admin'::"text")))));



CREATE POLICY "changelog_select_public" ON "public"."changelog" FOR SELECT USING (true);



ALTER TABLE "public"."comment_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comment_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."comments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "comments_select_public" ON "public"."comments" FOR SELECT USING (true);



CREATE POLICY "comments_update_owner" ON "public"."comments" FOR UPDATE TO "authenticated" USING (("author_user_id" = "auth"."uid"())) WITH CHECK (("author_user_id" = "auth"."uid"()));



ALTER TABLE "public"."page_contents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "page_contents_select_public" ON "public"."page_contents" FOR SELECT USING (true);



ALTER TABLE "public"."page_visits" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "profiles_select_public" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"())) WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "reactions_select_public" ON "public"."comment_reactions" FOR SELECT USING (true);



ALTER TABLE "public"."site_changelog" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_roles" TO "anon";
GRANT ALL ON TABLE "public"."admin_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_roles" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."changelog" TO "anon";
GRANT ALL ON TABLE "public"."changelog" TO "authenticated";
GRANT ALL ON TABLE "public"."changelog" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reactions" TO "anon";
GRANT ALL ON TABLE "public"."comment_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."comment_reports" TO "anon";
GRANT ALL ON TABLE "public"."comment_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."comment_reports" TO "service_role";



GRANT ALL ON TABLE "public"."comments" TO "anon";
GRANT ALL ON TABLE "public"."comments" TO "authenticated";
GRANT ALL ON TABLE "public"."comments" TO "service_role";



GRANT ALL ON TABLE "public"."page_contents" TO "anon";
GRANT ALL ON TABLE "public"."page_contents" TO "authenticated";
GRANT ALL ON TABLE "public"."page_contents" TO "service_role";



GRANT ALL ON TABLE "public"."page_visits" TO "anon";
GRANT ALL ON TABLE "public"."page_visits" TO "authenticated";
GRANT ALL ON TABLE "public"."page_visits" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."site_changelog" TO "anon";
GRANT ALL ON TABLE "public"."site_changelog" TO "authenticated";
GRANT ALL ON TABLE "public"."site_changelog" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







