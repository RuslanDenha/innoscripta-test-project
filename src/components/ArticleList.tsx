import type { Article } from "../news";
import ArticleCard from "./ArticleCard";

export default function ArticleList({ articles, emptyMessage }: { articles: Article[]; emptyMessage?: string }) {
  if (articles.length === 0) return <p className="empty">{emptyMessage ?? "No articles match your search."}</p>;

  return (
    <ul className="articles">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </ul>
  );
}
