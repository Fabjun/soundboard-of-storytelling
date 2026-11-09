/**
 * @fileoverview HelpContent — the help's search and topics, for the help screen and the help dialog
 * (Slice 17a / 17b, BACKLOG "Help screen and context help")
 *
 * Opens with `topic` open and scrolled into view; every topic is a section that opens and closes
 * (WAI-ARIA APG Disclosure, the button inside the topic's heading). A search lists the topics
 * holding every word typed, opened, and says how many (NN/g heuristic 10). The texts are data
 * (src/lib/helpTopics.ts). The sections are plain blocks: in a scrolling column a flex child with
 * min-height 0 would be squeezed (the error class of v3/tests/e2e/layout-reach.spec.ts).
 */

import type { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { UiIcon } from './UiIcon';
import { searchHelp, type HelpTopicId } from '../lib/helpTopics';

/** Shows the help's search and topics, `topic` open; `prefix` keeps its ids unique on the page. */
export function HelpContent({
  topic,
  prefix,
}: {
  topic: HelpTopicId;
  prefix: string;
}): JSX.Element {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<ReadonlySet<HelpTopicId>>(() => new Set([topic]));
  const origin = useRef<HTMLElement>(null);
  const topics = searchHelp(query);

  // The topic of the place it came from, in view
  useEffect(() => origin.current?.scrollIntoView({ block: 'start' }), []);

  function search(text: string): void {
    setQuery(text);
    // What a search finds is shown open; each topic still opens and closes by its button
    if (text.trim()) setOpen(new Set(searchHelp(text).map((t) => t.id)));
  }

  function toggle(id: HelpTopicId): void {
    const next = new Set(open);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setOpen(next);
  }

  return (
    <>
      <div class="sb-search-field">
        <UiIcon name="search" size={12} color="var(--text-mute)" />
        <input
          class="sb-search-input sb-flex-1"
          type="search"
          aria-label="Search the help"
          placeholder="Search the help…"
          value={query}
          onInput={(e) => search(e.currentTarget.value)}
        />
      </div>
      {query.trim() && (
        <p class="sb-caption" role="status">
          {topics.length === 0
            ? 'No topic matches. Try another word, e.g. "deck", "key" or "backup".'
            : `${topics.length} ${topics.length === 1 ? 'topic matches' : 'topics match'}.`}
        </p>
      )}
      <div>
        {topics.map((t) => {
          const isOpen = open.has(t.id);
          return (
            <section
              key={t.id}
              ref={t.id === topic ? origin : undefined}
              aria-labelledby={`${prefix}-topic-${t.id}`}
            >
              <h2>
                <button
                  id={`${prefix}-topic-${t.id}`}
                  class="sb-disclosure"
                  aria-expanded={isOpen}
                  aria-controls={`${prefix}-text-${t.id}`}
                  onClick={() => toggle(t.id)}
                >
                  <UiIcon name={isOpen ? 'down' : 'right'} />
                  <span class="sb-flex-1">{t.title}</span>
                </button>
              </h2>
              <div id={`${prefix}-text-${t.id}`} class="sb-help-text" hidden={!isOpen}>
                {t.text.map((p) => (
                  <p key={p} class="sb-caption">
                    {p}
                  </p>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
