"use strict";(()=>{var e={};e.id=3036,e.ids=[3036],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},7738:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>k,patchFetch:()=>A,requestAsyncStorage:()=>g,routeModule:()=>l,serverHooks:()=>_,staticGenerationAsyncStorage:()=>T});var r={};t.r(r),t.d(r,{GET:()=>d,POST:()=>p});var i=t(9303),n=t(8716),s=t(670),o=t(7070),c=t(2049);async function d(e){try{let a=await (0,c.e)(),{searchParams:t}=new URL(e.url),r=t.get("category"),i=t.get("search"),n=t.get("sort")||"popular",s=parseInt(t.get("limit")||"20"),d=a.from("memory_packages").select(`
        id,
        name,
        description,
        category,
        tags,
        memory_count,
        download_count,
        rating,
        review_count,
        preview_memories,
        price,
        is_free,
        author_id,
        created_at,
        updated_at
      `).eq("status","published").limit(s);switch(r&&"all"!==r&&(d=d.eq("category",r)),i&&(d=d.or(`name.ilike.%${i}%,description.ilike.%${i}%`)),n){case"popular":d=d.order("download_count",{ascending:!1});break;case"rating":d=d.order("rating",{ascending:!1});break;case"newest":d=d.order("created_at",{ascending:!1});break;case"free":d=d.eq("is_free",!0).order("download_count",{ascending:!1})}let{data:p,error:m}=await d;if(m){if("42P01"===m.code)return o.NextResponse.json({packages:E,categories:u,message:"Using sample data - run migration for full features"});throw m}return o.NextResponse.json({packages:p||[],categories:u})}catch(e){return o.NextResponse.json({error:e.message},{status:500})}}async function p(e){try{let a=await (0,c.e)(),{data:{user:t},error:r}=await a.auth.getUser();if(r||!t)return o.NextResponse.json({error:"Unauthorized"},{status:401});let{name:i,description:n,category:s,tags:d=[],memoryIds:p=[],price:u=0,isPublic:E=!0}=await e.json();if(!i||!n||!s)return o.NextResponse.json({error:"Name, description, and category required"},{status:400});if(0===p.length)return o.NextResponse.json({error:"At least one memory required"},{status:400});let{data:l,error:g}=await a.from("memories").select("id, content, type, confidence").in("id",p).eq("user_id",t.id);if(g||!l||0===l.length)return o.NextResponse.json({error:"Memories not found"},{status:400});let T=l.slice(0,3).map(e=>({type:e.type,preview:e.content.slice(0,100)+(e.content.length>100?"...":"")})),{data:_,error:k}=await a.from("memory_packages").insert({name:i,description:n,category:s,tags:d,memory_count:l.length,preview_memories:T,price:u||0,is_free:!u||0===u,author_id:t.id,status:E?"published":"draft"}).select().single();if(k){if("42P01"===k.code)return o.NextResponse.json({error:"Marketplace tables not configured",migration:m},{status:500});throw k}let A=l.map(e=>({package_id:_.id,original_memory_id:e.id,content:e.content,type:e.type,confidence:e.confidence}));return await a.from("package_memories").insert(A),o.NextResponse.json({package:_,message:"Package created successfully"})}catch(e){return o.NextResponse.json({error:e.message},{status:500})}}let u=[{id:"productivity",name:"⚡ Verimlilik",description:"İş ve \xfcretkenlik bilgileri"},{id:"development",name:"\uD83D\uDCBB Yazılım",description:"Programlama ve geliştirme"},{id:"language",name:"\uD83C\uDF0D Dil",description:"Dil \xf6ğrenimi ve \xe7eviri"},{id:"business",name:"\uD83D\uDCBC İş",description:"İş ve girişimcilik"},{id:"health",name:"\uD83C\uDFE5 Sağlık",description:"Sağlık ve wellness"},{id:"finance",name:"\uD83D\uDCB0 Finans",description:"Yatırım ve finans"},{id:"creative",name:"\uD83C\uDFA8 Yaratıcı",description:"Sanat ve yaratıcılık"},{id:"education",name:"\uD83D\uDCDA Eğitim",description:"\xd6ğrenme ve akademik"}],E=[{id:"sample-1",name:"Python Uzmanı Hafızası",description:"Python programlama i\xe7in temel bilgiler, best practices ve sık kullanılan pattern'ler",category:"development",tags:["python","programlama","kod"],memory_count:50,download_count:1250,rating:4.8,review_count:45,is_free:!0,preview_memories:[{type:"fact",preview:"Python'da list comprehension kullanımı..."},{type:"preference",preview:"PEP 8 stil rehberine uygun kod yazımı..."}]},{id:"sample-2",name:"Startup Kurucusu Rehberi",description:"Girişimcilik, pitch hazırlama, yatırımcı ilişkileri hakkında deneyimler",category:"business",tags:["startup","girişimcilik","yatırım"],memory_count:35,download_count:890,rating:4.6,review_count:28,is_free:!1,price:9.99,preview_memories:[{type:"fact",preview:"Pitch deck hazırlarken dikkat edilecekler..."},{type:"identity",preview:"Başarılı bir kurucu olmanın temel \xf6zellikleri..."}]},{id:"sample-3",name:"İngilizce Konuşma Pratiği",description:"G\xfcnl\xfck İngilizce konuşma kalıpları ve idiomlar",category:"language",tags:["ingilizce","dil","konuşma"],memory_count:100,download_count:2100,rating:4.9,review_count:156,is_free:!0,preview_memories:[{type:"fact",preview:"Small talk i\xe7in kullanışlı ifadeler..."},{type:"preference",preview:"Native speaker gibi konuşma teknikleri..."}]}],m=`
-- Memory packages table
CREATE TABLE IF NOT EXISTS memory_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  memory_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  preview_memories JSONB DEFAULT '[]',
  price DECIMAL(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  author_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package memories (anonymized copies)
CREATE TABLE IF NOT EXISTS package_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES memory_packages(id) ON DELETE CASCADE,
  original_memory_id UUID,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  confidence DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User package downloads
CREATE TABLE IF NOT EXISTS package_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES memory_packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  downloaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, user_id)
);

-- Package reviews
CREATE TABLE IF NOT EXISTS package_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID REFERENCES memory_packages(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(package_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS memory_packages_category_idx ON memory_packages(category);
CREATE INDEX IF NOT EXISTS memory_packages_status_idx ON memory_packages(status);
CREATE INDEX IF NOT EXISTS package_downloads_user_idx ON package_downloads(user_id);

-- RLS
ALTER TABLE memory_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_reviews ENABLE ROW LEVEL SECURITY;

-- Public can view published packages
CREATE POLICY "Anyone can view published packages" ON memory_packages
  FOR SELECT USING (status = 'published');

-- Authors can manage their packages
CREATE POLICY "Authors can manage own packages" ON memory_packages
  FOR ALL USING (author_id = auth.uid());
`,l=new i.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/marketplace/route",pathname:"/api/marketplace",filename:"route",bundlePath:"app/api/marketplace/route"},resolvedPagePath:"/workspace/project/emergent-ai-ulu.com/frontend/app/api/marketplace/route.js",nextConfigOutput:"",userland:r}),{requestAsyncStorage:g,staticGenerationAsyncStorage:T,serverHooks:_}=l,k="/api/marketplace/route";function A(){return(0,s.patchFetch)({serverHooks:_,staticGenerationAsyncStorage:T})}},2049:(e,a,t)=>{t.d(a,{e:()=>n});var r=t(7721),i=t(1615);async function n(){let e=await (0,i.cookies)();return(0,r.createServerClient)("https://gsqzysjxqwipxphbgnpv.supabase.co","sb_publishable_TDKgZkFjHEU05tdGjSHtsw_2Gt2gf37",{cookies:{getAll:()=>e.getAll(),setAll(a){try{a.forEach(({name:a,value:t,options:r})=>e.set(a,t,r))}catch{}}}})}}};var a=require("../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[9276,5972,1987,7721],()=>t(7738));module.exports=r})();