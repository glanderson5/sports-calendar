import { getJson } from "./http.js";

export interface NewsArticle {
  headline: string;
  description: string;
  url: string;
  imageUrl?: string;
  published: string;
}

function mapArticle(a: any): NewsArticle {
  return {
    headline: a.headline ?? "",
    description: a.description && a.description !== a.headline ? a.description : "",
    url: a.links?.web?.href ?? "",
    imageUrl: a.images?.[0]?.url,
    published: a.published ?? a.lastModified ?? "",
  };
}

async function fetchNews(url: string, limit = 8): Promise<NewsArticle[]> {
  const data = await getJson(url);
  return (data.articles ?? [])
    .map(mapArticle)
    .filter((a: NewsArticle) => a.headline && a.url)
    .slice(0, limit);
}

export const fetchVikingsNews = () =>
  fetchNews("https://site.api.espn.com/apis/site/v2/sports/football/nfl/news?team=16");

export const fetchLynxNews = () =>
  fetchNews("https://site.api.espn.com/apis/site/v2/sports/basketball/wnba/news?team=8");

export const fetchTottenhamNews = () =>
  fetchNews("https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/news?team=367");

// F1: general sport news, not tied to a specific driver/constructor.
export const fetchF1News = () => fetchNews("https://site.api.espn.com/apis/site/v2/sports/racing/f1/news");
