import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search as SearchIcon, Users, FileText, Layers, Flag } from "lucide-react";

type TabKey = "all" | "people" | "posts" | "groups" | "pages";

function useSearchData(q: string) {
  return useQuery({
    queryKey: ["global-search", q],
    enabled: q.trim().length > 0,
    staleTime: 30_000,
    queryFn: async () => {
      const term = `%${q.trim()}%`;

      const [peopleRes, postsRes, teamsRes] = await Promise.all([
        supabase.rpc("search_users", { p_query: q.trim(), p_limit: 30 }),
        supabase
          .from("feed_posts")
          .select("id, user_id, content, created_at, likes_count, comments_count")
          .ilike("content", term)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase
          .from("fishing_teams")
          .select("id, name, logo_url, category, followers_count, description")
          .ilike("name", term)
          .limit(30),
      ]);

      return {
        people: peopleRes.data ?? [],
        posts: postsRes.data ?? [],
        teams: teamsRes.data ?? [],
      };
    },
  });
}

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const initialTab = (params.get("tab") as TabKey) || "all";
  const [tab, setTab] = useState<TabKey>(initialTab);
  const [input, setInput] = useState(q);

  useEffect(() => setInput(q), [q]);

  // Debounce input → URL ?q= (300ms) so users get live results without spamming the API
  useEffect(() => {
    const handle = setTimeout(() => {
      if (input.trim() === q) return;
      const next = new URLSearchParams(params);
      if (input.trim()) next.set("q", input.trim());
      else next.delete("q");
      setParams(next, { replace: true });
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input]);

  const { data, isLoading } = useSearchData(q);

  const counts = useMemo(
    () => ({
      people: data?.people.length ?? 0,
      posts: data?.posts.length ?? 0,
      teams: data?.teams.length ?? 0,
    }),
    [data],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    next.set("q", input.trim());
    setParams(next, { replace: true });
  };

  const setActive = (t: TabKey) => {
    setTab(t);
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, { replace: true });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <form onSubmit={submit} className="relative mb-6">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search people, posts, pages, groups…"
          className="pl-9 h-11"
        />
      </form>

      {q.trim().length === 0 ? (
        <p className="text-sm text-muted-foreground">Type a keyword to search across Fish-X.</p>
      ) : (
        <Tabs value={tab} onValueChange={(v) => setActive(v as TabKey)}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="people">
              <Users className="h-3.5 w-3.5 mr-1.5" /> People {counts.people ? `(${counts.people})` : ""}
            </TabsTrigger>
            <TabsTrigger value="posts">
              <FileText className="h-3.5 w-3.5 mr-1.5" /> Posts {counts.posts ? `(${counts.posts})` : ""}
            </TabsTrigger>
            <TabsTrigger value="pages">
              <Flag className="h-3.5 w-3.5 mr-1.5" /> Pages {counts.teams ? `(${counts.teams})` : ""}
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Layers className="h-3.5 w-3.5 mr-1.5" /> Groups {counts.teams ? `(${counts.teams})` : ""}
            </TabsTrigger>
          </TabsList>

          <div className="mt-4">
            {isLoading && <p className="text-sm text-muted-foreground">Searching…</p>}

            {tab === "all" && !isLoading && (
              <div className="space-y-6">
                <Section title="People" empty={counts.people === 0}>
                  {data?.people.slice(0, 4).map((p) => <PeopleRow key={p.id} p={p} />)}
                  {counts.people > 4 && <SeeMore onClick={() => setActive("people")} />}
                </Section>
                <Section title="Posts" empty={counts.posts === 0}>
                  {data?.posts.slice(0, 4).map((post) => <PostRow key={post.id} post={post} />)}
                  {counts.posts > 4 && <SeeMore onClick={() => setActive("posts")} />}
                </Section>
                <Section title="Pages & Groups" empty={counts.teams === 0}>
                  {data?.teams.slice(0, 4).map((t) => <TeamRow key={t.id} team={t} />)}
                  {counts.teams > 4 && <SeeMore onClick={() => setActive("pages")} />}
                </Section>
              </div>
            )}

            <TabsContent value="people" className="space-y-2">
              {data?.people.length === 0 && <Empty label="No people found." />}
              {data?.people.map((p) => <PeopleRow key={p.id} p={p} />)}
            </TabsContent>
            <TabsContent value="posts" className="space-y-2">
              {data?.posts.length === 0 && <Empty label="No posts found." />}
              {data?.posts.map((post) => <PostRow key={post.id} post={post} />)}
            </TabsContent>
            <TabsContent value="pages" className="space-y-2">
              {data?.teams.length === 0 && <Empty label="No pages found." />}
              {data?.teams.map((t) => <TeamRow key={t.id} team={t} surface="page" />)}
            </TabsContent>
            <TabsContent value="groups" className="space-y-2">
              {data?.teams.length === 0 && <Empty label="No groups found." />}
              {data?.teams.map((t) => <TeamRow key={t.id} team={t} surface="group" />)}
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  );
}

function Section({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">{title}</h2>
      {empty ? <Empty label={`No ${title.toLowerCase()} found.`} /> : <div className="space-y-2">{children}</div>}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="text-sm text-muted-foreground py-2">{label}</p>;
}

function SeeMore({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-sm text-primary hover:underline mt-1">
      See more results
    </button>
  );
}

function PeopleRow({ p }: { p: any }) {
  return (
    <Link to={`/app/u/${p.id}`}>
      <Card className="p-3 flex items-center gap-3 hover:bg-accent transition-colors">
        <Avatar className="h-12 w-12">
          <AvatarImage src={p.photos?.[0]} />
          <AvatarFallback>{p.display_name?.[0] ?? "?"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{p.display_name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[p.fishing_experience, p.location_name].filter(Boolean).join(" • ")}
          </p>
        </div>
      </Card>
    </Link>
  );
}

function PostRow({ post }: { post: any }) {
  return (
    <Link to={`/app/feed?post=${post.id}`}>
      <Card className="p-3 hover:bg-accent transition-colors">
        <p className="text-sm line-clamp-3 whitespace-pre-wrap">{post.content}</p>
        <p className="text-xs text-muted-foreground mt-2">
          {new Date(post.created_at).toLocaleDateString()} · {post.likes_count ?? 0} likes · {post.comments_count ?? 0} comments
        </p>
      </Card>
    </Link>
  );
}

function TeamRow({ team, surface }: { team: any; surface?: "page" | "group" }) {
  const to = surface === "group" ? `/app/teams/${team.id}?tab=group` : `/app/teams/${team.id}`;
  return (
    <Link to={to}>
      <Card className="p-3 flex items-center gap-3 hover:bg-accent transition-colors">
        <Avatar className="h-12 w-12 rounded-md">
          <AvatarImage src={team.logo_url} />
          <AvatarFallback>{team.name?.[0] ?? "T"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{team.name}</p>
            {team.category && <Badge variant="secondary" className="text-xs">{team.category}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {team.followers_count ?? 0} followers{team.description ? ` · ${team.description}` : ""}
          </p>
        </div>
      </Card>
    </Link>
  );
}