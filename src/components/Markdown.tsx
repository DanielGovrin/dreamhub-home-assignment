import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function Markdown({ children }: { children: string }) {
  return (
    <div
      className="
        text-sm leading-relaxed wrap-anywhere
        [&_p]:my-0 [&_p+p]:mt-2
        [&_strong]:font-semibold [&_strong]:text-fg
        [&_em]:italic
        [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5
        [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5
        [&_li]:my-0.5
        [&_img]:max-w-full [&_img]:rounded
        [&_code]:rounded [&_code]:bg-fg/8 [&_code]:px-1 [&_code]:py-px
        [&_code]:font-mono [&_code]:text-[0.85em]
        [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-fg/8 [&_pre]:p-2
        [&_pre_code]:bg-transparent [&_pre_code]:p-0
      "
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Links are user-controlled: isolate the tab and drop the referrer.
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="underline underline-offset-2 hover:opacity-80"
            >
              {children}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
