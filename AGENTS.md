<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Supabase Database & Security Rules

앞으로 테이블을 생성할 때와 액세스할 때 아래 사항을 항상 적용하도록 합니다:

> anon과 authenticated 역할(Role)이 PostgREST API를 통해 이 테이블에 접근할 수 있도록 명시적인 GRANT SQL 문(SELECT, INSERT, UPDATE, DELETE 등)을 반드시 포함해 줘.

> 또한, RLS(Row Level Security)를 활성화하고, 인증된 유저(authenticated)만 본인의 일기를 읽고 쓸 수 있도록 Policy도 함께 작성해 줘.

