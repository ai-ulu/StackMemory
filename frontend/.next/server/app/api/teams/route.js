"use strict";(()=>{var e={};e.id=8281,e.ids=[8281],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},7872:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>l,patchFetch:()=>p,requestAsyncStorage:()=>c,routeModule:()=>N,serverHooks:()=>L,staticGenerationAsyncStorage:()=>_});var a={};r.r(a),r.d(a,{DELETE:()=>T,GET:()=>E,POST:()=>d});var s=r(9303),i=r(8716),n=r(670),o=r(7070),m=r(2049);async function E(e){try{let e=await (0,m.e)(),{data:{user:t},error:r}=await e.auth.getUser();if(r||!t)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{data:a,error:s}=await e.from("team_members").select(`
        role,
        joined_at,
        team:teams (
          id,
          name,
          description,
          avatar_url,
          created_at,
          owner_id
        )
      `).eq("user_id",t.id);if(s){if("42P01"===s.code)return o.NextResponse.json({teams:[],message:"Teams feature requires database migration",migration:u});throw s}let i=(a||[]).map(e=>({...e.team,role:e.role,joined_at:e.joined_at,isOwner:e.team.owner_id===t.id}));return o.NextResponse.json({teams:i})}catch(e){return o.NextResponse.json({error:e.message},{status:500})}}async function d(e){try{let t=await (0,m.e)(),{data:{user:r},error:a}=await t.auth.getUser();if(a||!r)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{name:s,description:i}=await e.json();if(!s||s.length<2)return o.NextResponse.json({error:"Team name required (min 2 chars)"},{status:400});let{data:n,error:E}=await t.from("teams").insert({name:s,description:i||"",owner_id:r.id}).select().single();if(E){if("42P01"===E.code)return o.NextResponse.json({error:"Teams table not configured",migration:u},{status:500});throw E}return await t.from("team_members").insert({team_id:n.id,user_id:r.id,role:"admin"}),o.NextResponse.json({team:{...n,role:"admin",isOwner:!0},message:"Team created successfully"})}catch(e){return o.NextResponse.json({error:e.message},{status:500})}}async function T(e){try{let t=await (0,m.e)(),{data:{user:r},error:a}=await t.auth.getUser();if(a||!r)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{searchParams:s}=new URL(e.url),i=s.get("id");if(!i)return o.NextResponse.json({error:"Team ID required"},{status:400});let{data:n}=await t.from("teams").select("owner_id").eq("id",i).single();if(!n||n.owner_id!==r.id)return o.NextResponse.json({error:"Not authorized"},{status:403});let{error:E}=await t.from("teams").delete().eq("id",i);if(E)throw E;return o.NextResponse.json({success:!0,message:"Team deleted"})}catch(e){return o.NextResponse.json({error:e.message},{status:500})}}let u=`
-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Team invitations table
CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add team_id to memories for shared memories
ALTER TABLE memories ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS teams_owner_id_idx ON teams(owner_id);
CREATE INDEX IF NOT EXISTS team_members_user_id_idx ON team_members(user_id);
CREATE INDEX IF NOT EXISTS team_members_team_id_idx ON team_members(team_id);
CREATE INDEX IF NOT EXISTS memories_team_id_idx ON memories(team_id);

-- RLS Policies
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Users can see teams they're members of
CREATE POLICY "Users can view own teams" ON teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM team_members WHERE user_id = auth.uid())
  );

-- Team owners can manage their teams
CREATE POLICY "Owners can manage teams" ON teams
  FOR ALL USING (owner_id = auth.uid());

-- Users can view their memberships
CREATE POLICY "Users can view own memberships" ON team_members
  FOR SELECT USING (user_id = auth.uid());

-- Admins can manage members
CREATE POLICY "Admins can manage members" ON team_members
  FOR ALL USING (
    team_id IN (
      SELECT team_id FROM team_members 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
`,N=new s.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/teams/route",pathname:"/api/teams",filename:"route",bundlePath:"app/api/teams/route"},resolvedPagePath:"/workspace/project/emergent-ai-ulu.com/frontend/app/api/teams/route.js",nextConfigOutput:"",userland:a}),{requestAsyncStorage:c,staticGenerationAsyncStorage:_,serverHooks:L}=N,l="/api/teams/route";function p(){return(0,n.patchFetch)({serverHooks:L,staticGenerationAsyncStorage:_})}},2049:(e,t,r)=>{r.d(t,{e:()=>i});var a=r(7721),s=r(1615);async function i(){let e=await (0,s.cookies)();return(0,a.createServerClient)("https://gsqzysjxqwipxphbgnpv.supabase.co","sb_publishable_TDKgZkFjHEU05tdGjSHtsw_2Gt2gf37",{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:r,options:a})=>e.set(t,r,a))}catch{}}}})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[9276,5972,1987,7721],()=>r(7872));module.exports=a})();