import { getAllPosts } from "@/lib/mdParser";
import { getAllTags } from "@/lib/search";
import PostList from "@/components/PostList";
import FeaturedPosts from "@/components/FeaturedPosts";

export const revalidate = 3600; // 1시간마다 재생성

export default async function Home() {
  const posts = await getAllPosts();
  const allTags = getAllTags(posts);

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* 메인 컨텐츠 영역 */}
        <div className="lg:col-span-8">
          <PostList posts={posts} allTags={allTags} />
        </div>

        {/* 사이드바 */}
        <aside className="lg:col-span-4">
          <div className="sticky top-24 space-y-8">
            <FeaturedPosts posts={posts} />
          </div>
        </aside>
      </div>
    </div>
  );
}
