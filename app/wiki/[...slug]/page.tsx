import { notFound } from "next/navigation";
import { WikiArticle } from "@/components/WikiArticle";
import { getWikiPage } from "@/lib/wiki";

export default async function WikiPageRoute({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = await getWikiPage(slug);
  if (!page) notFound();

  return (
    <WikiArticle
      title={page.meta.title}
      category={page.meta.category}
      updated={page.meta.updated}
      markdown={page.processedMarkdown}
      sources={page.sources}
    />
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const page = await getWikiPage(slug);
  return {
    title: page ? `${page.meta.title} · sahana-wiki` : "Not found · sahana-wiki",
  };
}
