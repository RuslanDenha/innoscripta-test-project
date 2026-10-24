import { useState } from "react";
import { formatFullDate, formatRelativeDate } from "../formatDate";
import type { Article } from "../news";
import { Badge } from "./ui";

export default function ArticleCard({ article }: { article: Article }) {
  // Some sources link images that no longer load; drop those instead of showing a broken image.
  const [imageFailed, setImageFailed] = useState(false);
  const published = new Date(article.publishedAt);

  return (
    <li className="article">
      {article.imageUrl && !imageFailed && (
        <img src={article.imageUrl} alt="" loading="lazy" onError={() => setImageFailed(true)} />
      )}
      <div className="article__body">
        <div className="article__tags">
          <Badge variant="outline">{article.source}</Badge>
          {article.category && <Badge>{article.category}</Badge>}
        </div>
        <h2>
          {/* The title is the card's only link; CSS stretches it over the whole card. */}
          <a href={article.url} target="_blank" rel="noreferrer" className="article__link">
            {article.title}
          </a>
        </h2>
        {article.description && <p className="article__description">{article.description}</p>}
        <p className="meta">
          <time dateTime={article.publishedAt} title={formatFullDate(published)}>
            {formatRelativeDate(published)}
          </time>
          {article.author && <> · {article.author}</>}
        </p>
      </div>
    </li>
  );
}
