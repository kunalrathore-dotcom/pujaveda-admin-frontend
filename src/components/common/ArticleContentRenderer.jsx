/**
 * ArticleContentRenderer
 * Shared typography and styling for rendered blog article HTML.
 * Matches the Customer storefront article layout and design system.
 */
export default function ArticleContentRenderer({ html = "" }) {
  if (!html || !html.trim()) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-xs text-neutral-400">
        No article content to display.
      </div>
    );
  }

  return (
    <div
      className="prose prose-stone max-w-none text-[#2D1C13] leading-relaxed space-y-5
        [&>h1]:text-2xl [&>h1]:sm:text-3xl [&>h1]:font-black [&>h1]:text-[#5C0F17] [&>h1]:mt-8 [&>h1]:mb-3 [&>h1]:font-serif
        [&>h2]:text-xl [&>h2]:sm:text-2xl [&>h2]:font-black [&>h2]:text-[#5C0F17] [&>h2]:mt-8 [&>h2]:mb-3 [&>h2]:font-serif
        [&>h3]:text-lg [&>h3]:sm:text-xl [&>h3]:font-bold [&>h3]:text-[#2D1C13] [&>h3]:mt-6 [&>h3]:mb-2
        [&>p]:text-sm [&>p]:sm:text-base [&>p]:leading-7 [&>p]:text-neutral-700
        [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ul]:text-sm sm:[&>ul]:text-base [&>ul]:text-neutral-700
        [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2 [&>ol]:text-sm sm:[&>ol]:text-base [&>ol]:text-neutral-700
        [&>blockquote]:border-l-4 [&>blockquote]:border-[#DA9B26] [&>blockquote]:bg-[#FAF5ED] [&>blockquote]:p-4 [&>blockquote]:rounded-r-2xl [&>blockquote]:italic [&>blockquote]:text-neutral-800
        [&>img]:rounded-2xl [&>img]:shadow-sm [&>img]:my-6 [&>img]:w-full [&>img]:object-cover
        [&>hr]:border-neutral-200 [&>hr]:my-6
        [&>a]:text-[#5C0F17] [&>a]:underline [&>a]:font-bold hover:[&>a]:text-[#E85D04]"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
