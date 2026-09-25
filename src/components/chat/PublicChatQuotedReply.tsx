import { quoteExcerpt, type CodyPublicQuote, isCodyLogId } from "@/lib/chat/cody-public-quote";

export function scrollToQuotedMessage(quoteId: string) {
  if (!isCodyLogId(quoteId)) return;

  const target = document.getElementById(`chat-msg-${quoteId}`);
  if (!target) return;

  target.scrollIntoView({ behavior: "smooth", block: "center" });
  target.classList.add("ring-2", "ring-primary/70", "ring-offset-2", "ring-offset-background");
  window.setTimeout(() => {
    target.classList.remove(
      "ring-2",
      "ring-primary/70",
      "ring-offset-2",
      "ring-offset-background",
    );
  }, 1600);
}

export function PublicChatQuotedReply({
  quote,
  alignEnd,
}: {
  quote: CodyPublicQuote;
  alignEnd?: boolean;
}) {
  const excerpt = quoteExcerpt(quote.content);
  const clickable = isCodyLogId(quote.id);

  const body = (
    <>
      <p className="text-[10px] font-extrabold text-primary">{quote.author}</p>
      <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground line-clamp-3 whitespace-pre-wrap break-words">
        {excerpt}
      </p>
    </>
  );

  const className = `mb-2 w-full rounded-lg border-l-2 border-primary/60 bg-secondary/50 px-2.5 py-2 text-left transition ${
    alignEnd ? "ml-auto" : ""
  } ${clickable ? "cursor-pointer hover:bg-secondary/70" : ""}`;

  if (!clickable) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={`View original message from ${quote.author}`}
      onClick={() => scrollToQuotedMessage(quote.id)}
    >
      {body}
    </button>
  );
}
