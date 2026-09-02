# Devpost submission checklist — Attune

Deadline: **September 3, 2026, 1:00 PM PDT** (= September 4, 05:00 KST). Submit at https://webmcp.devpost.com/ → "Submit project". (Multiple submissions are allowed if substantially different — Attune and Rendezvous are.)

| Field | Value |
|---|---|
| Project name | Attune |
| Tagline | Pages that negotiate with your agent, not track you — words and screen composed for how you read, from the author's own blocks, through WebMCP. |
| Live URL | https://attune.znehraks.workers.dev |
| Repository | https://github.com/znehraks/attune (public, MIT) |
| Demo video | upload `docs/video/attune-demo.mp4` to YouTube (public or unlisted), paste the link |
| Built with | webmcp, typescript, react, vite, cloudflare-workers, durable-objects, playwright, vitest |
| Description | paste `DESCRIPTION.md` |

## Testing instructions
No login or credentials needed.
1. ChatGPT desktop app → built-in browser (model Sol or Terra) → https://attune.znehraks.workers.dev
2. Say: "I have three minutes, I'm a web developer who already knows MCP, and I read Korean. Open the WebMCP article." The page composes a 3-minute expert edition in Korean; the Handshake panel shows what was declared.
3. Say: "I have low vision and I'm reading in a dark room" — the page turns dark with extra-large hyperlegible type and big controls; the Handshake panel explains each choice. (Agents that already know this about the person are asked by the tool description to declare it on arrival.)
4. Say: "Where did I get stuck?" after re-reading a paragraph, then "make it simpler" — the block is swapped for the author's plainer version.
5. On the compound-interest article: "What if I put in 500 a month for 40 years with a 1% fee?" — the calculator on the page updates.
6. "Did the author say anything about iframes?" — the author's own answer, or "not covered". "Forget me" erases everything.
7. Chrome alternative: chrome://flags/#enable-webmcp-testing + Model Context Tool Inspector. No agent: use the Handshake panel and the Agent console on any page.
